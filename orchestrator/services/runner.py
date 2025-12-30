"""Runner service for executing council deliberations."""

import asyncio
import re
from functools import lru_cache
from typing import Optional
from uuid import UUID

from db.supabase import SupabaseClient, get_supabase_client
from models.schemas import RunCreate, RunStatus, CouncilMemberConfig
from services.openrouter import OpenRouterClient, get_openrouter_client, CompletionResult
from services.prompts import build_reasoning_prompt, build_review_prompt, build_synthesis_prompt


# Model pricing (cost per 1k tokens) - Updated Dec 2025
MODEL_COSTS: dict[str, dict[str, float]] = {
    # OpenAI
    "openai/gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
    "openai/gpt-4.1": {"input": 0.002, "output": 0.008},
    "openai/gpt-4.1-mini": {"input": 0.0004, "output": 0.0016},
    "openai/gpt-4.1-nano": {"input": 0.0001, "output": 0.0004},
    "openai/gpt-5": {"input": 0.00125, "output": 0.010},
    "openai/gpt-5.1": {"input": 0.00125, "output": 0.010},
    "openai/gpt-5.2": {"input": 0.00175, "output": 0.014},
    "openai/gpt-5-mini": {"input": 0.00025, "output": 0.002},
    "openai/gpt-5-nano": {"input": 0.00005, "output": 0.0004},
    # Anthropic
    "anthropic/claude-opus-4.5": {"input": 0.005, "output": 0.025},
    "anthropic/claude-sonnet-4.5": {"input": 0.003, "output": 0.015},
    "anthropic/claude-sonnet-4": {"input": 0.003, "output": 0.015},
    "anthropic/claude-haiku-4.5": {"input": 0.001, "output": 0.005},
    "anthropic/claude-3.7-sonnet": {"input": 0.003, "output": 0.015},
    "anthropic/claude-3.5-sonnet": {"input": 0.006, "output": 0.030},
    "anthropic/claude-3.5-haiku": {"input": 0.0008, "output": 0.004},
    # Google
    "google/gemini-2.5-flash": {"input": 0.0003, "output": 0.0025},
    "google/gemini-2.0-flash-001": {"input": 0.0001, "output": 0.0004},
    "google/gemini-2.5-pro": {"input": 0.00125, "output": 0.010},
    # xAI
    "x-ai/grok-3-mini": {"input": 0.0003, "output": 0.0005},
    "x-ai/grok-3": {"input": 0.003, "output": 0.015},
    "x-ai/grok-4-fast": {"input": 0.0002, "output": 0.0005},
    # Meta
    "meta-llama/llama-3.3-70b-instruct": {"input": 0.00035, "output": 0.0004},
    # Mistral
    "mistralai/mistral-large-2411": {"input": 0.002, "output": 0.006},
    # DeepSeek
    "deepseek/deepseek-v3.2": {"input": 0.000224, "output": 0.00032},
    "deepseek/deepseek-chat-v3.1": {"input": 0.00015, "output": 0.00075},
}


def calculate_cost(model_key: str, prompt_tokens: int, completion_tokens: int) -> float:
    """Calculate cost in USD for a model completion."""
    costs = MODEL_COSTS.get(model_key, {"input": 0.001, "output": 0.002})  # Default fallback
    input_cost = (prompt_tokens / 1000) * costs["input"]
    output_cost = (completion_tokens / 1000) * costs["output"]
    return round(input_cost + output_cost, 6)


class RunnerService:
    """Orchestrates the execution of council deliberations."""

    def __init__(self, db: SupabaseClient, llm: OpenRouterClient):
        self.db = db
        self.llm = llm
        self._active_runs: dict[str, bool] = {}  # Track cancellation

    async def create_run(self, request: RunCreate, user_id: UUID) -> dict:
        """Create a new run and return the run record."""
        # Create prompt record
        prompt = await self.db.create_prompt(
            session_id=request.session_id,
            user_id=user_id,
            content=request.prompt.content,
            objective=request.prompt.objective,
            constraints=request.prompt.constraints or [],
            audience=request.prompt.audience,
            context=request.prompt.context,
        )

        # Create run record
        council_config = {
            "members": [m.model_dump() for m in request.council.members],
            "chairman_model_key": request.council.chairman_model_key,
        }
        run = await self.db.create_run(
            session_id=request.session_id,
            prompt_id=UUID(prompt["id"]),
            council_config=council_config,
        )

        # Create run_models for each council member
        for member in request.council.members:
            await self.db.create_run_model(
                run_id=UUID(run["id"]),
                model_key=member.model_key,
                display_name=member.display_name,
                role=member.role.value,
                weight=member.weight,
            )

        return run

    async def execute_run(self, run_id: UUID) -> None:
        """Execute the full deliberation pipeline."""
        run_id_str = str(run_id)
        self._active_runs[run_id_str] = True

        try:
            # Get run with models
            run = await self.db.get_run(run_id)
            if not run:
                raise ValueError(f"Run {run_id} not found")

            # Update status to running
            await self.db.update_run_status(run_id, "running", current_phase=2)

            # Execute phases
            await self._execute_phase_2(run)

            if not self._is_canceled(run_id_str):
                await self._execute_phase_3(run)

            if not self._is_canceled(run_id_str):
                await self._execute_phase_4(run)

            if not self._is_canceled(run_id_str):
                await self.db.update_run_status(run_id, "succeeded")

        except Exception as e:
            await self.db.update_run_status(
                run_id,
                "failed",
                error={"message": str(e), "type": type(e).__name__},
            )
            raise
        finally:
            self._active_runs.pop(run_id_str, None)

    async def cancel_run(self, run_id: UUID) -> bool:
        """Cancel a running deliberation."""
        run_id_str = str(run_id)
        if run_id_str in self._active_runs:
            self._active_runs[run_id_str] = False
            await self.db.update_run_status(run_id, "canceled")
            return True
        return False

    def _is_canceled(self, run_id_str: str) -> bool:
        """Check if a run has been canceled."""
        return not self._active_runs.get(run_id_str, False)

    # =========================================================================
    # Phase 2: Independent Reasoning
    # =========================================================================

    async def _execute_phase_2(self, run: dict) -> None:
        """Execute Phase 2: Independent Reasoning."""
        run_id = UUID(run["id"])
        await self.db.update_run_phase_status(run_id, 2, started=True)
        await self.db.update_run(run_id, current_phase=2)

        run_models = run.get("run_models", [])
        council_config = run.get("council_config", {})

        # Get prompt data from joined prompts table
        prompt_data = run.get("prompts", {}) or {}
        prompt_content = prompt_data.get("content", "")
        prompt_objective = prompt_data.get("objective")
        prompt_constraints = prompt_data.get("constraints")
        prompt_audience = prompt_data.get("audience")
        prompt_context = prompt_data.get("context")

        # Build requests for all models
        requests = []
        model_mapping = []  # Track which request goes to which run_model

        for rm in run_models:
            role = rm["role"]
            if role == "chair":
                continue  # Chair doesn't participate in reasoning phase

            messages = build_reasoning_prompt(
                user_prompt=prompt_content,
                role=role,
                objective=prompt_objective,
                constraints=prompt_constraints,
                audience=prompt_audience,
                context=prompt_context,
            )

            requests.append({
                "model": rm["model_key"],
                "messages": messages,
                "temperature": 0.7,
            })
            model_mapping.append(rm)

            # Update model status to running
            await self.db.update_run_model(UUID(rm["id"]), status="running")

        # Execute all requests in parallel
        results = await self.llm.complete_parallel(requests)

        # Process results
        for rm, result in zip(model_mapping, results):
            rm_id = UUID(rm["id"])

            if isinstance(result, Exception):
                await self.db.update_run_model(rm_id, status="failed")
                continue

            result: CompletionResult
            cost = calculate_cost(rm["model_key"], result.prompt_tokens, result.completion_tokens)
            await self.db.create_model_output(
                run_model_id=rm_id,
                phase=2,
                content=result.content,
                metadata={
                    "prompt_tokens": result.prompt_tokens,
                    "completion_tokens": result.completion_tokens,
                    "total_tokens": result.total_tokens,
                    "latency_ms": result.latency_ms,
                    "cost_usd": cost,
                },
            )
            await self.db.update_run_model(
                rm_id,
                status="succeeded",
                latency_ms=result.latency_ms,
                cost_usd=cost,
            )

        await self.db.update_run_phase_status(run_id, 2, completed=True)

    # =========================================================================
    # Phase 3: Peer Review
    # =========================================================================

    async def _execute_phase_3(self, run: dict) -> None:
        """Execute Phase 3: Peer Review."""
        run_id = UUID(run["id"])
        await self.db.update_run_phase_status(run_id, 3, started=True)
        await self.db.update_run(run_id, current_phase=3)

        # Refresh run to get outputs
        run = await self.db.get_run(run_id)
        run_models = run.get("run_models", [])

        # Collect phase 2 outputs
        responses = []
        for rm in run_models:
            outputs = rm.get("model_outputs", [])
            phase_2_output = next((o for o in outputs if o["phase"] == 2), None)
            if phase_2_output:
                # Assign label based on position in filtered list (A, B, C...)
                label = chr(65 + len(responses))
                responses.append({
                    "label": label,
                    "content": phase_2_output["content"],
                    "run_model_id": rm["id"],
                })

        if len(responses) < 2:
            # Not enough responses to review
            await self.db.update_run_phase_status(run_id, 3, completed=True)
            return

        # Get original prompt content from joined prompts table
        prompt_data = run.get("prompts", {}) or {}
        prompt_content = prompt_data.get("content", "")

        # Each model reviews all other responses
        requests = []
        review_mapping = []  # Track reviewer -> reviewed

        for rm in run_models:
            if rm["role"] == "chair":
                continue

            # Build review prompt (excluding self)
            other_responses = [r for r in responses if r["run_model_id"] != rm["id"]]
            if not other_responses:
                continue

            messages = build_review_prompt(
                original_prompt=prompt_content,
                responses=other_responses,
                reviewer_role=rm["role"],
            )

            requests.append({
                "model": rm["model_key"],
                "messages": messages,
                "temperature": 0.5,
            })
            review_mapping.append({
                "reviewer": rm,
                "reviewed_responses": other_responses,
            })

        # Execute reviews in parallel
        results = await self.llm.complete_parallel(requests)

        # Parse and store reviews
        for mapping, result in zip(review_mapping, results):
            if isinstance(result, Exception):
                continue

            result: CompletionResult
            reviewer_id = UUID(mapping["reviewer"]["id"])

            # Store the review output
            await self.db.create_model_output(
                run_model_id=reviewer_id,
                phase=3,
                content=result.content,
                metadata={
                    "prompt_tokens": result.prompt_tokens,
                    "completion_tokens": result.completion_tokens,
                },
            )

            # Parse scores from the response
            scores = self._parse_review_scores(result.content)
            for label, score_data in scores.items():
                # Find the reviewed model
                reviewed = next(
                    (r for r in mapping["reviewed_responses"] if r["label"] == label),
                    None
                )
                if reviewed:
                    await self.db.create_peer_review(
                        run_id=run_id,
                        reviewer_run_model_id=reviewer_id,
                        reviewed_run_model_id=UUID(reviewed["run_model_id"]),
                        score=score_data["score"],
                        rationale=score_data.get("rationale"),
                    )

        await self.db.update_run_phase_status(run_id, 3, completed=True)

    def _parse_review_scores(self, content: str) -> dict:
        """Parse scores from review response.

        Handles various LLM response formats:
        - Response A: 8/10
        - **Response A**: 8/10
        - Response A - 8/10
        - Response A: 8 out of 10
        - Score for Response A: 8
        - A: 8/10
        """
        scores = {}

        # Multiple patterns to match different LLM output formats
        patterns = [
            # Standard format: Response A: 8/10 or Response A: 8.5/10
            r"\*{0,2}Response\s+([A-Z])\*{0,2}\s*[:=-]\s*(\d+(?:\.\d+)?)\s*/\s*10",
            # "X out of 10" format
            r"\*{0,2}Response\s+([A-Z])\*{0,2}\s*[:=-]\s*(\d+(?:\.\d+)?)\s+out\s+of\s+10",
            # Score prefix: "Score for Response A: 8"
            r"Score\s+(?:for\s+)?Response\s+([A-Z])\s*[:=-]\s*(\d+(?:\.\d+)?)",
            # Just letter with score: "A: 8/10" or "A - 8/10"
            r"(?:^|\n)\s*\*{0,2}([A-Z])\*{0,2}\s*[:=-]\s*(\d+(?:\.\d+)?)\s*/\s*10",
            # Rating format: "Response A.*Rating: 8"
            r"\*{0,2}Response\s+([A-Z])\*{0,2}[^0-9]*?(?:Rating|Score)\s*[:=-]\s*(\d+(?:\.\d+)?)",
        ]

        for pattern in patterns:
            matches = re.findall(pattern, content, re.IGNORECASE | re.MULTILINE)
            for label, score in matches:
                label_upper = label.upper()
                if label_upper not in scores:  # Don't overwrite existing scores
                    score_val = float(score)
                    # Normalize scores > 10 (in case LLM gives percentage)
                    if score_val > 10:
                        score_val = score_val / 10
                    scores[label_upper] = {"score": min(10, max(0, score_val))}

        # Try to extract rationales with flexible matching
        # Use \Z for end-of-string and \n\s*\n for blank lines (more robust than $|\n\n)
        rationale_patterns = [
            # Primary format matching our prompt template: "Response A: 8/10\nRationale: ..."
            # Captures everything after "Rationale:" until next "Response" block or end
            r"Response\s+([A-Z])\s*:\s*\d+(?:\.\d+)?\s*/\s*10\s*\n+Rationale\s*:\s*(.+?)(?=\n\s*Response\s+[A-Z]|\n\s*\n|\Z)",
            # Standard rationale with flexible spacing
            r"Response\s+([A-Z]).*?Rationale\s*:\s*(.+?)(?=\n\s*Response\s+[A-Z]|\n\s*\n|\Z)",
            # "Reasoning" instead of "Rationale"
            r"Response\s+([A-Z]).*?Reasoning\s*:\s*(.+?)(?=\n\s*Response\s+[A-Z]|\n\s*\n|\Z)",
            # "Justification" format
            r"Response\s+([A-Z]).*?Justification\s*:\s*(.+?)(?=\n\s*Response\s+[A-Z]|\n\s*\n|\Z)",
        ]

        for pattern in rationale_patterns:
            rationale_matches = re.findall(pattern, content, re.IGNORECASE | re.DOTALL)
            for label, rationale in rationale_matches:
                label = label.upper()
                if label in scores and "rationale" not in scores[label]:
                    # Clean up the rationale text
                    cleaned = rationale.strip()
                    # Remove trailing score patterns that might have been captured
                    cleaned = re.sub(r'\s*\d+(?:\.\d+)?\s*/\s*10\s*$', '', cleaned)
                    # Remove markdown formatting
                    cleaned = re.sub(r'^\*+\s*', '', cleaned)
                    cleaned = re.sub(r'\s*\*+$', '', cleaned)
                    if cleaned:
                        scores[label]["rationale"] = cleaned[:2000]  # Increased limit

        return scores

    # =========================================================================
    # Phase 4: Synthesis
    # =========================================================================

    async def _execute_phase_4(self, run: dict) -> None:
        """Execute Phase 4: Synthesis."""
        run_id = UUID(run["id"])
        await self.db.update_run_phase_status(run_id, 4, started=True)
        await self.db.update_run(run_id, current_phase=4)

        # Refresh run
        run = await self.db.get_run(run_id)
        run_models = run.get("run_models", [])

        # Get prompt data from joined prompts table
        prompt_data = run.get("prompts", {}) or {}
        prompt_content = prompt_data.get("content", "")
        prompt_objective = prompt_data.get("objective")

        # Find or select chairman
        chairman = next((rm for rm in run_models if rm["role"] == "chair"), None)
        if not chairman:
            # Use first model as chairman
            chairman = run_models[0] if run_models else None

        if not chairman:
            await self.db.update_run_phase_status(run_id, 4, completed=True)
            return

        # Collect phase 2 responses
        responses = []
        for rm in run_models:
            outputs = rm.get("model_outputs", [])
            phase_2_output = next((o for o in outputs if o["phase"] == 2), None)
            if phase_2_output:
                responses.append({
                    "role": rm["role"],
                    "content": phase_2_output["content"],
                })

        # Get peer reviews
        peer_reviews = await self.db.get_peer_reviews(run_id)
        # Format reviews for synthesis prompt
        reviews_formatted = []
        for pr in peer_reviews:
            reviews_formatted.append({
                "reviewer": pr["reviewer_run_model_id"],
                "scores": [{"label": "?", "score": pr["score"]}],  # Simplified
            })

        # Build synthesis prompt
        messages = build_synthesis_prompt(
            original_prompt=prompt_content,
            responses=responses,
            reviews=reviews_formatted,
            objective=prompt_objective,
        )

        # Get synthesis from chairman
        result = await self.llm.complete(
            model=chairman["model_key"],
            messages=messages,
            temperature=0.5,
        )

        # Calculate synthesis cost
        synthesis_cost = calculate_cost(
            chairman["model_key"],
            result.prompt_tokens,
            result.completion_tokens
        )

        # Store synthesis output
        await self.db.create_model_output(
            run_model_id=UUID(chairman["id"]),
            phase=4,
            content=result.content,
            metadata={
                "prompt_tokens": result.prompt_tokens,
                "completion_tokens": result.completion_tokens,
                "total_tokens": result.total_tokens,
                "latency_ms": result.latency_ms,
                "is_synthesis": True,
                "cost_usd": synthesis_cost,
            },
        )

        # Update chairman's run_model with accumulated cost
        current_cost = chairman.get("cost_usd") or 0
        await self.db.update_run_model(
            UUID(chairman["id"]),
            cost_usd=current_cost + synthesis_cost,
        )

        await self.db.update_run_phase_status(run_id, 4, completed=True)


@lru_cache
def get_runner_service() -> RunnerService:
    """Get cached runner service instance."""
    return RunnerService(
        db=get_supabase_client(),
        llm=get_openrouter_client(),
    )
