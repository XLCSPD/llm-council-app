"""OpenRouter API client for LLM calls."""

import asyncio
from dataclasses import dataclass
from functools import lru_cache
from typing import AsyncIterator, Optional
import time

import httpx

from config import get_settings


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


class OpenRouterClient:
    """Client for OpenRouter API."""

    def __init__(self, api_key: str, base_url: str = "https://openrouter.ai/api/v1"):
        self.api_key = api_key
        self.base_url = base_url
        self._client: Optional[httpx.AsyncClient] = None

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
        """Make a completion request to OpenRouter."""
        client = await self._get_client()
        start_time = time.perf_counter()

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }
        if max_tokens:
            payload["max_tokens"] = max_tokens

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
