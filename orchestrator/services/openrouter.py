"""OpenRouter API client for LLM calls."""

import asyncio
import logging
import random
from dataclasses import dataclass
from functools import lru_cache
from typing import AsyncIterator, Optional
import time

import httpx

from config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class CompletionResult:
    """Result from an LLM completion."""
    content: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    latency_ms: int
    cost_usd: Optional[float] = None
    model: Optional[str] = None


@dataclass
class StreamChunk:
    """A chunk from a streaming response."""
    content: str
    is_final: bool = False
    metadata: Optional[dict] = None


# Retry configuration
MAX_RETRIES = 3
INITIAL_BACKOFF_MS = 1000  # 1 second
MAX_BACKOFF_MS = 30000  # 30 seconds
BACKOFF_MULTIPLIER = 2.0
JITTER_FACTOR = 0.1  # 10% jitter

# Rate limiting - max concurrent requests to OpenRouter
MAX_CONCURRENT_REQUESTS = 10


def calculate_backoff(attempt: int) -> float:
    """Calculate exponential backoff with jitter."""
    backoff_ms = min(
        INITIAL_BACKOFF_MS * (BACKOFF_MULTIPLIER ** attempt),
        MAX_BACKOFF_MS
    )
    # Add jitter to prevent thundering herd
    jitter = backoff_ms * JITTER_FACTOR * (2 * random.random() - 1)
    return (backoff_ms + jitter) / 1000  # Convert to seconds


def is_retryable_error(error: Exception) -> bool:
    """Determine if an error is retryable."""
    if isinstance(error, httpx.HTTPStatusError):
        # Retry on rate limits (429), server errors (5xx)
        status = error.response.status_code
        return status == 429 or status >= 500
    if isinstance(error, (httpx.ConnectError, httpx.ReadTimeout, httpx.WriteTimeout)):
        return True
    return False


class OpenRouterClient:
    """Client for OpenRouter API with retry logic and rate limiting."""

    def __init__(self, api_key: str, base_url: str = "https://openrouter.ai/api/v1"):
        self.api_key = api_key
        self.base_url = base_url
        self._client: Optional[httpx.AsyncClient] = None
        self._semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create async HTTP client."""
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "HTTP-Referer": "https://llm-council.app",
                    "X-Title": "LLM Council",
                },
                timeout=httpx.Timeout(120.0),
            )
        return self._client

    async def close(self):
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None

    async def complete(
        self,
        model: str,
        messages: list[dict],
        max_tokens: Optional[int] = None,
        temperature: float = 0.7,
    ) -> CompletionResult:
        """Make a completion request to OpenRouter with retry logic."""
        async with self._semaphore:  # Rate limiting
            return await self._complete_with_retry(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )

    async def _complete_with_retry(
        self,
        model: str,
        messages: list[dict],
        max_tokens: Optional[int] = None,
        temperature: float = 0.7,
    ) -> CompletionResult:
        """Make a completion request with exponential backoff retry."""
        client = await self._get_client()
        start_time = time.perf_counter()

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }
        if max_tokens:
            payload["max_tokens"] = max_tokens

        last_error: Optional[Exception] = None

        for attempt in range(MAX_RETRIES + 1):
            try:
                response = await client.post("/chat/completions", json=payload)
                response.raise_for_status()
                data = response.json()

                latency_ms = int((time.perf_counter() - start_time) * 1000)

                usage = data.get("usage", {})
                return CompletionResult(
                    content=data["choices"][0]["message"]["content"],
                    prompt_tokens=usage.get("prompt_tokens", 0),
                    completion_tokens=usage.get("completion_tokens", 0),
                    total_tokens=usage.get("total_tokens", 0),
                    latency_ms=latency_ms,
                    model=data.get("model"),
                )

            except Exception as e:
                last_error = e

                if attempt < MAX_RETRIES and is_retryable_error(e):
                    backoff = calculate_backoff(attempt)
                    logger.warning(
                        f"OpenRouter request failed (attempt {attempt + 1}/{MAX_RETRIES + 1}), "
                        f"retrying in {backoff:.2f}s: {e}"
                    )
                    await asyncio.sleep(backoff)
                else:
                    # Non-retryable error or max retries exceeded
                    break

        # All retries exhausted
        logger.error(f"OpenRouter request failed after {MAX_RETRIES + 1} attempts: {last_error}")
        raise last_error  # type: ignore

    async def stream_complete(
        self,
        model: str,
        messages: list[dict],
        max_tokens: Optional[int] = None,
        temperature: float = 0.7,
    ) -> AsyncIterator[StreamChunk]:
        """Stream a completion from OpenRouter."""
        client = await self._get_client()

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "stream": True,
        }
        if max_tokens:
            payload["max_tokens"] = max_tokens

        async with client.stream("POST", "/chat/completions", json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line or not line.startswith("data: "):
                    continue
                data_str = line[6:]  # Remove "data: " prefix
                if data_str == "[DONE]":
                    yield StreamChunk(content="", is_final=True)
                    break
                try:
                    import json
                    data = json.loads(data_str)
                    delta = data["choices"][0].get("delta", {})
                    content = delta.get("content", "")
                    if content:
                        yield StreamChunk(content=content)
                except (json.JSONDecodeError, KeyError, IndexError):
                    continue

    async def complete_parallel(
        self,
        requests: list[dict],
    ) -> list[CompletionResult]:
        """Execute multiple completions in parallel.

        Args:
            requests: List of dicts with keys: model, messages, max_tokens, temperature

        Returns:
            List of CompletionResults in same order as requests
        """
        tasks = [
            self.complete(
                model=req["model"],
                messages=req["messages"],
                max_tokens=req.get("max_tokens"),
                temperature=req.get("temperature", 0.7),
            )
            for req in requests
        ]
        return await asyncio.gather(*tasks, return_exceptions=True)


@lru_cache
def get_openrouter_client() -> OpenRouterClient:
    """Get cached OpenRouter client instance."""
    settings = get_settings()
    return OpenRouterClient(
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
    )
