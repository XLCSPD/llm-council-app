"""Supabase client for database operations."""

from functools import lru_cache
from typing import Any, Optional
from uuid import UUID

from supabase import create_client, Client

from config import get_settings


class SupabaseClient:
    """Wrapper around Supabase client with typed methods."""

    def __init__(self, client: Client):
        self._client = client

    # =========================================================================
    # Prompts
    # =========================================================================

    async def create_prompt(
        self,
        session_id: UUID,
        user_id: UUID,
        content: str,
        objective: Optional[str] = None,
        constraints: Optional[list[str]] = None,
        audience: Optional[str] = None,
        context: Optional[str] = None,
        attachments: Optional[list[dict]] = None,
    ) -> dict:
        """Create a new prompt record."""
        data = {
            "session_id": str(session_id),
            "user_id": str(user_id),
            "content": content,
            "objective": objective,
            "constraints": constraints or [],
            "audience": audience,
            "context": context,
            "attachments": attachments or [],
        }
        result = self._client.table("prompts").insert(data).execute()
        return result.data[0]

    # =========================================================================
    # Runs
    # =========================================================================

    async def create_run(
        self,
        session_id: UUID,
        prompt_id: UUID,
        council_config: dict,
    ) -> dict:
        """Create a new run record."""
        data = {
            "session_id": str(session_id),
            "prompt_id": str(prompt_id),
            "council_config": council_config,
            "status": "queued",
            "current_phase": 1,
        }
        result = self._client.table("runs").insert(data).execute()
        return result.data[0]

    async def get_run(self, run_id: UUID) -> Optional[dict]:
        """Get a run by ID with related data."""
        result = (
            self._client.table("runs")
            .select("*, prompts(*), run_models(*, model_outputs(*))")
            .eq("id", str(run_id))
            .single()
            .execute()
        )
        return result.data

    async def update_run(self, run_id: UUID, **updates) -> dict:
        """Update a run record."""
        # Convert UUID fields to strings
        data = {k: str(v) if isinstance(v, UUID) else v for k, v in updates.items()}
        result = (
            self._client.table("runs")
            .update(data)
            .eq("id", str(run_id))
            .execute()
        )
        return result.data[0]

    async def update_run_status(
        self,
        run_id: UUID,
        status: str,
        current_phase: Optional[int] = None,
        error: Optional[dict] = None,
    ) -> dict:
        """Update run status and optionally phase."""
        updates: dict[str, Any] = {"status": status}
        if current_phase is not None:
            updates["current_phase"] = current_phase
        if error is not None:
            updates["error"] = error
        if status == "running" and current_phase == 2:
            updates["started_at"] = "now()"
        if status in ("succeeded", "failed", "canceled"):
            updates["ended_at"] = "now()"
        return await self.update_run(run_id, **updates)

    async def update_run_phase_status(
        self,
        run_id: UUID,
        phase: int,
        started: bool = False,
        completed: bool = False,
    ) -> dict:
        """Update phase status timestamps."""
        # First get current phase_status
        run = await self.get_run(run_id)
        phase_status = run.get("phase_status", {}) or {}

        phase_key = f"phase_{phase}"
        if phase_key not in phase_status:
            phase_status[phase_key] = {}

        from datetime import datetime, timezone
        now = datetime.now(timezone.utc).isoformat()

        if started:
            phase_status[phase_key]["started_at"] = now
        if completed:
            phase_status[phase_key]["completed_at"] = now

        return await self.update_run(run_id, phase_status=phase_status)

    # =========================================================================
    # Run Models
    # =========================================================================

    async def create_run_model(
        self,
        run_id: UUID,
        model_key: str,
        display_name: str,
        role: str,
        weight: float = 1.0,
    ) -> dict:
        """Create a run_model record."""
        data = {
            "run_id": str(run_id),
            "model_key": model_key,
            "display_name": display_name,
            "role": role,
            "weight": weight,
            "status": "pending",
        }
        result = self._client.table("run_models").insert(data).execute()
        return result.data[0]

    async def create_run_models_batch(
        self,
        run_id: UUID,
        models: list[dict],
    ) -> list[dict]:
        """Create multiple run_model records in a single batch operation.

        Args:
            run_id: The run ID to associate models with
            models: List of dicts with keys: model_key, display_name, role, weight (optional)

        Returns:
            List of created run_model records
        """
        if not models:
            return []

        data = [
            {
                "run_id": str(run_id),
                "model_key": m["model_key"],
                "display_name": m["display_name"],
                "role": m["role"],
                "weight": m.get("weight", 1.0),
                "status": "pending",
            }
            for m in models
        ]
        result = self._client.table("run_models").insert(data).execute()
        return result.data

    async def update_run_model(self, run_model_id: UUID, **updates) -> dict:
        """Update a run_model record."""
        data = {k: str(v) if isinstance(v, UUID) else v for k, v in updates.items()}
        result = (
            self._client.table("run_models")
            .update(data)
            .eq("id", str(run_model_id))
            .execute()
        )
        return result.data[0]

    async def get_run_models(self, run_id: UUID) -> list[dict]:
        """Get all models for a run."""
        result = (
            self._client.table("run_models")
            .select("*")
            .eq("run_id", str(run_id))
            .execute()
        )
        return result.data

    # =========================================================================
    # Model Outputs
    # =========================================================================

    async def create_model_output(
        self,
        run_model_id: UUID,
        phase: int,
        content: str,
        metadata: Optional[dict] = None,
    ) -> dict:
        """Create a model output record."""
        data = {
            "run_model_id": str(run_model_id),
            "phase": phase,
            "content": content,
            "metadata": metadata or {},
        }
        result = self._client.table("model_outputs").insert(data).execute()
        return result.data[0]

    # =========================================================================
    # Peer Reviews
    # =========================================================================

    async def create_peer_review(
        self,
        run_id: UUID,
        reviewer_run_model_id: UUID,
        reviewed_run_model_id: UUID,
        score: float,
        rationale: Optional[str] = None,
    ) -> dict:
        """Create a peer review record."""
        data = {
            "run_id": str(run_id),
            "reviewer_run_model_id": str(reviewer_run_model_id),
            "reviewed_run_model_id": str(reviewed_run_model_id),
            "score": score,
            "rationale": rationale,
        }
        result = self._client.table("peer_reviews").insert(data).execute()
        return result.data[0]

    async def create_peer_reviews_batch(
        self,
        reviews: list[dict],
    ) -> list[dict]:
        """Create multiple peer review records in a single batch operation.

        Args:
            reviews: List of dicts with keys: run_id, reviewer_run_model_id,
                     reviewed_run_model_id, score, rationale (optional)

        Returns:
            List of created peer_review records
        """
        if not reviews:
            return []

        data = [
            {
                "run_id": str(r["run_id"]),
                "reviewer_run_model_id": str(r["reviewer_run_model_id"]),
                "reviewed_run_model_id": str(r["reviewed_run_model_id"]),
                "score": r["score"],
                "rationale": r.get("rationale"),
            }
            for r in reviews
        ]
        result = self._client.table("peer_reviews").insert(data).execute()
        return result.data

    async def get_peer_reviews(self, run_id: UUID) -> list[dict]:
        """Get all peer reviews for a run."""
        result = (
            self._client.table("peer_reviews")
            .select("*")
            .eq("run_id", str(run_id))
            .execute()
        )
        return result.data


@lru_cache
def get_supabase_client() -> SupabaseClient:
    """Get cached Supabase client instance."""
    settings = get_settings()
    client = create_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )
    return SupabaseClient(client)
