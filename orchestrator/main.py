"""LLM Council Orchestrator - FastAPI Application."""

import asyncio
from contextlib import asynccontextmanager
from typing import Optional
from uuid import UUID

from fastapi import FastAPI, HTTPException, BackgroundTasks, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import get_settings
from db.supabase import get_supabase_client
from models.schemas import (
    RunCreate,
    RunResponse,
    RunStatusResponse,
    RunStatus,
)
from services.runner import get_runner_service
from services.prompt_enhancer import enhance_prompt, EnhancedPrompt


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    settings = get_settings()
    print(f"Starting {settings.app_name}...")
    yield
    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title="LLM Council Orchestrator",
    description="Orchestration service for multi-model AI deliberations",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# Health Check
# =============================================================================


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "orchestrator"}


# =============================================================================
# Run Endpoints
# =============================================================================


class RunCreateRequest(BaseModel):
    """Request body for creating a run."""
    session_id: UUID
    prompt: dict
    council: dict


class PromptEnhanceRequest(BaseModel):
    """Request body for prompt enhancement."""
    content: str
    objective: Optional[str] = None
    constraints: Optional[list[str]] = None
    context: Optional[str] = None
    audience: Optional[str] = None


class PromptEnhanceResponse(BaseModel):
    """Response from prompt enhancement."""
    original_content: str
    enhanced_content: str
    suggested_objective: Optional[str] = None
    suggested_constraints: list[str] = []
    suggested_context: Optional[str] = None
    suggested_audience: Optional[str] = None
    improvements: list[str] = []


@app.post("/api/runs", response_model=RunStatusResponse)
async def create_run(
    request: RunCreate,
    background_tasks: BackgroundTasks,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Create and start a new deliberation run.

    The run will be executed in the background.
    Use GET /api/runs/{run_id} to check status.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header required")

    runner = get_runner_service()

    try:
        user_id = UUID(x_user_id)
        run = await runner.create_run(request, user_id)

        # Start execution in background
        background_tasks.add_task(runner.execute_run, UUID(run["id"]))

        return RunStatusResponse(
            id=UUID(run["id"]),
            status=RunStatus.QUEUED,
            current_phase=1,
            message="Run created and queued for execution",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create run: {e}")


@app.get("/api/runs/{run_id}", response_model=RunResponse)
async def get_run(run_id: UUID):
    """Get the full status and results of a run."""
    db = get_supabase_client()

    run = await db.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    # Transform to response model
    models = []
    for rm in run.get("run_models", []):
        outputs = [
            {
                "id": o["id"],
                "phase": o["phase"],
                "content": o["content"],
                "metadata": o.get("metadata", {}),
                "created_at": o["created_at"],
            }
            for o in rm.get("model_outputs", [])
        ]
        models.append({
            "id": rm["id"],
            "model_key": rm["model_key"],
            "display_name": rm["display_name"],
            "role": rm["role"],
            "weight": rm["weight"],
            "status": rm["status"],
            "latency_ms": rm.get("latency_ms"),
            "cost_usd": rm.get("cost_usd"),
            "outputs": outputs,
        })

    # Fetch peer reviews for this run
    peer_reviews_data = await db.get_peer_reviews(run_id)
    peer_reviews = [
        {
            "id": pr["id"],
            "run_id": pr["run_id"],
            "reviewer_run_model_id": pr["reviewer_run_model_id"],
            "reviewed_run_model_id": pr["reviewed_run_model_id"],
            "score": pr["score"],
            "rationale": pr.get("rationale"),
            "created_at": pr["created_at"],
        }
        for pr in peer_reviews_data
    ]

    return RunResponse(
        id=UUID(run["id"]),
        session_id=UUID(run["session_id"]),
        prompt_id=UUID(run["prompt_id"]),
        status=RunStatus(run["status"]),
        current_phase=run["current_phase"],
        phase_status=run.get("phase_status", {}),
        started_at=run.get("started_at"),
        ended_at=run.get("ended_at"),
        error=run.get("error"),
        cost_usd=run.get("cost_usd"),
        models=models,
        peer_reviews=peer_reviews,
        created_at=run["created_at"],
    )


# =============================================================================
# Prompt Enhancement Endpoint
# =============================================================================


@app.post("/api/prompts/enhance", response_model=PromptEnhanceResponse)
async def enhance_prompt_endpoint(request: PromptEnhanceRequest):
    """Enhance a prompt using AI suggestions.

    Uses a fast model to analyze and improve the user's prompt,
    suggesting better phrasing, objectives, constraints, and context.
    Target response time: <3 seconds.
    """
    try:
        result = await enhance_prompt(
            content=request.content,
            objective=request.objective,
            constraints=request.constraints,
            context=request.context,
            audience=request.audience,
        )

        return PromptEnhanceResponse(
            original_content=result.original_content,
            enhanced_content=result.enhanced_content,
            suggested_objective=result.suggested_objective,
            suggested_constraints=result.suggested_constraints,
            suggested_context=result.suggested_context,
            suggested_audience=result.suggested_audience,
            improvements=result.improvements,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to enhance prompt: {str(e)}",
        )


@app.post("/api/runs/{run_id}/cancel", response_model=RunStatusResponse)
async def cancel_run(run_id: UUID):
    """Cancel a running deliberation."""
    runner = get_runner_service()

    canceled = await runner.cancel_run(run_id)
    if not canceled:
        raise HTTPException(
            status_code=400,
            detail="Run is not currently executing or already completed",
        )

    return RunStatusResponse(
        id=run_id,
        status=RunStatus.CANCELED,
        current_phase=0,
        message="Run cancellation requested",
    )


# =============================================================================
# Development runner
# =============================================================================

if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8002,
        reload=settings.debug,
    )
