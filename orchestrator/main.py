"""LLM Council Orchestrator - FastAPI Application."""

import asyncio
from contextlib import asynccontextmanager
from typing import Optional
from uuid import UUID

from fastapi import FastAPI, HTTPException, BackgroundTasks, Header, UploadFile, File
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
from services.whisper import transcribe_audio, TranscriptionError
from services.invites import (
    create_invite,
    get_org_invites,
    cancel_invite,
    resend_invite,
    get_org_members,
    verify_org_admin,
    InviteError,
)
from services.analytics import (
    check_platform_admin,
    verify_analytics_access,
    get_analytics_summary,
    get_usage_analytics,
    get_cost_analytics,
    get_model_analytics,
    AnalyticsError,
)


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
# Voice Transcription Endpoint
# =============================================================================


class TranscribeResponse(BaseModel):
    """Response from audio transcription."""
    text: str


@app.post("/api/transcribe", response_model=TranscribeResponse)
async def transcribe_audio_endpoint(
    audio: UploadFile = File(..., description="Audio file to transcribe"),
):
    """
    Transcribe audio to text using OpenAI Whisper.

    Accepts audio files in common formats: webm, wav, mp3, mp4, m4a, ogg, flac.
    Maximum file size: 25MB.
    Recommended maximum duration: 60 seconds.

    Returns:
        TranscribeResponse with transcribed text.
    """
    # Read the audio file
    audio_data = await audio.read()

    try:
        text = await transcribe_audio(
            audio_data=audio_data,
            filename=audio.filename or "audio.webm",
            content_type=audio.content_type or "audio/webm",
        )
        return TranscribeResponse(text=text)

    except TranscriptionError as e:
        raise HTTPException(
            status_code=e.status_code or 500,
            detail=str(e),
        )


# =============================================================================
# Invite Endpoints
# =============================================================================


class InviteCreateRequest(BaseModel):
    """Request body for creating an invite."""
    org_id: UUID
    email: str
    role: str = "member"  # 'admin' or 'member'
    name: Optional[str] = None  # Invitee's name for personalized email


class InviteResponse(BaseModel):
    """Response for invite operations."""
    id: UUID
    org_id: UUID
    email: str
    role: str
    status: str
    expires_at: str
    created_at: str


class InviteListResponse(BaseModel):
    """Response for listing invites."""
    invites: list[dict]


class OrgMembersResponse(BaseModel):
    """Response for listing org members."""
    members: list[dict]


@app.post("/api/invites", response_model=InviteResponse)
async def create_invite_endpoint(
    request: InviteCreateRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    x_redirect_url: Optional[str] = Header(None, alias="X-Redirect-URL"),
):
    """Create and send an organization invite.

    Requires X-User-ID header. User must be org admin/owner.
    Sends invitation email via Supabase Auth.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header required")

    try:
        user_id = UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid X-User-ID format")

    # Verify user is org admin
    is_admin = await verify_org_admin(request.org_id, user_id)
    if not is_admin:
        raise HTTPException(
            status_code=403,
            detail="You must be an organization admin or owner to send invites"
        )

    # Validate role
    if request.role not in ("admin", "member"):
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'member'")

    try:
        invite = await create_invite(
            org_id=request.org_id,
            email=request.email,
            role=request.role,
            invited_by=user_id,
            redirect_url=x_redirect_url,
            name=request.name,
        )
        return InviteResponse(
            id=UUID(invite["id"]),
            org_id=UUID(invite["org_id"]),
            email=invite["email"],
            role=invite["role"],
            status=invite["status"],
            expires_at=invite["expires_at"],
            created_at=invite["created_at"],
        )
    except InviteError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create invite: {str(e)}")


@app.get("/api/orgs/{org_id}/invites", response_model=InviteListResponse)
async def list_invites_endpoint(
    org_id: UUID,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """List all invites for an organization.

    Requires X-User-ID header. User must be org admin/owner.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header required")

    try:
        user_id = UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid X-User-ID format")

    # Verify user is org admin
    is_admin = await verify_org_admin(org_id, user_id)
    if not is_admin:
        raise HTTPException(
            status_code=403,
            detail="You must be an organization admin or owner to view invites"
        )

    invites = await get_org_invites(org_id)
    return InviteListResponse(invites=invites)


@app.get("/api/orgs/{org_id}/members", response_model=OrgMembersResponse)
async def list_members_endpoint(
    org_id: UUID,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """List all members of an organization.

    Requires X-User-ID header. User must be org member.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header required")

    members = await get_org_members(org_id)
    return OrgMembersResponse(members=members)


@app.post("/api/invites/{invite_id}/cancel")
async def cancel_invite_endpoint(
    invite_id: UUID,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Cancel a pending invite.

    Requires X-User-ID header.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header required")

    success = await cancel_invite(invite_id)
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Invite not found or already processed"
        )

    return {"success": True, "message": "Invite canceled"}


@app.post("/api/invites/{invite_id}/resend")
async def resend_invite_endpoint(
    invite_id: UUID,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    x_redirect_url: Optional[str] = Header(None, alias="X-Redirect-URL"),
):
    """Resend an invite email.

    Requires X-User-ID header.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header required")

    try:
        invite = await resend_invite(invite_id, redirect_url=x_redirect_url)
        return {"success": True, "message": "Invite resent", "invite": invite}
    except InviteError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resend invite: {str(e)}")


# =============================================================================
# Analytics Endpoints
# =============================================================================


@app.get("/api/admin/is-platform-admin")
async def check_platform_admin_endpoint(
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Check if current user is a platform administrator.

    Requires X-User-ID header.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header required")

    try:
        is_admin = await check_platform_admin(UUID(x_user_id))
        return {"is_platform_admin": is_admin}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check admin status: {str(e)}")


@app.get("/api/analytics/summary")
async def get_summary_endpoint(
    org_id: Optional[UUID] = None,
    time_range: str = "30d",
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Get summary metrics for dashboard header cards.

    Args:
        org_id: Organization ID (omit for platform-wide, requires platform admin)
        time_range: Time range - 7d, 30d, 90d, 1y (default: 30d)

    Requires X-User-ID header.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header required")

    user_id = UUID(x_user_id)

    # Verify access
    has_access = await verify_analytics_access(org_id, user_id)
    if not has_access:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Platform-wide analytics requires platform admin."
            if org_id is None else "Access denied. Must be org admin/owner."
        )

    try:
        summary = await get_analytics_summary(org_id, time_range)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analytics summary: {str(e)}")


@app.get("/api/analytics/usage")
async def get_usage_endpoint(
    org_id: Optional[UUID] = None,
    time_range: str = "30d",
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Get usage analytics with time series data.

    Args:
        org_id: Organization ID (omit for platform-wide, requires platform admin)
        time_range: Time range - 7d, 30d, 90d, 1y (default: 30d)

    Requires X-User-ID header.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header required")

    user_id = UUID(x_user_id)

    # Verify access
    has_access = await verify_analytics_access(org_id, user_id)
    if not has_access:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Platform-wide analytics requires platform admin."
            if org_id is None else "Access denied. Must be org admin/owner."
        )

    try:
        usage = await get_usage_analytics(org_id, time_range)
        return usage
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get usage analytics: {str(e)}")


@app.get("/api/analytics/costs")
async def get_costs_endpoint(
    org_id: Optional[UUID] = None,
    time_range: str = "30d",
    group_by: str = "model",
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Get cost breakdown analytics.

    Args:
        org_id: Organization ID (omit for platform-wide, requires platform admin)
        time_range: Time range - 7d, 30d, 90d, 1y (default: 30d)
        group_by: Grouping - model, user, day (default: model)

    Requires X-User-ID header.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header required")

    user_id = UUID(x_user_id)

    # Verify access
    has_access = await verify_analytics_access(org_id, user_id)
    if not has_access:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Platform-wide analytics requires platform admin."
            if org_id is None else "Access denied. Must be org admin/owner."
        )

    try:
        costs = await get_cost_analytics(org_id, time_range, group_by)
        return costs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get cost analytics: {str(e)}")


@app.get("/api/analytics/models")
async def get_models_endpoint(
    org_id: Optional[UUID] = None,
    time_range: str = "30d",
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Get model performance analytics.

    Args:
        org_id: Organization ID (omit for platform-wide, requires platform admin)
        time_range: Time range - 7d, 30d, 90d, 1y (default: 30d)

    Requires X-User-ID header.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header required")

    user_id = UUID(x_user_id)

    # Verify access
    has_access = await verify_analytics_access(org_id, user_id)
    if not has_access:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Platform-wide analytics requires platform admin."
            if org_id is None else "Access denied. Must be org admin/owner."
        )

    try:
        models = await get_model_analytics(org_id, time_range)
        return models
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get model analytics: {str(e)}")


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
