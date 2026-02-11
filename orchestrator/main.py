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
    BalanceChangeResponse,
    SuggestedFixResponse,
)
from services.runner import get_runner_service, MODEL_COSTS
from services.council_balancer import (
    validate_council,
    has_adversarial_role,
    balance_council,
    get_suggested_fix,
)
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
from services.admin import (
    get_all_system_users,
    get_detailed_members,
    update_member_role,
    remove_member,
    bulk_member_action,
    get_all_invites,
    delete_invite,
    get_audit_logs,
    verify_org_owner,
    verify_org_admin as verify_admin_access,
    AdminError,
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

    Council Balance Rules:
    - Council must have at least 2 members
    - Council can have at most 1 chair
    - Council should have at least 1 adversarial role (critic or devils_advocate)
    - If auto_balance=True (default), missing adversarial role is auto-fixed
    - If auto_balance=False, error is returned with suggested fix
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header required")

    # Validate council configuration
    is_valid, errors = validate_council(request.council.members)
    if not is_valid:
        raise HTTPException(status_code=400, detail={"errors": errors})

    # Check for adversarial role and balance if needed
    balance_changes = []
    if not has_adversarial_role(request.council.members):
        if request.auto_balance:
            # Auto-balance the council
            balanced_members, changes = balance_council(
                request.council.members, MODEL_COSTS
            )
            # Update the request with balanced members
            request.council.members = balanced_members
            balance_changes = [c.to_dict() for c in changes]
        else:
            # Return error with suggested fix
            suggested_fix = get_suggested_fix(request.council.members, MODEL_COSTS)
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "council_not_balanced",
                    "message": "Council requires at least one critic or devil's advocate",
                    "suggested_fix": suggested_fix.to_dict(),
                },
            )

    runner = get_runner_service()

    try:
        user_id = UUID(x_user_id)
        run = await runner.create_run(request, user_id, balance_changes=balance_changes)

        # Start execution in background
        background_tasks.add_task(runner.execute_run, UUID(run["id"]))

        # Build response with balance changes if any
        balance_change_responses = None
        if balance_changes:
            balance_change_responses = [
                BalanceChangeResponse(**c) for c in balance_changes
            ]

        return RunStatusResponse(
            id=UUID(run["id"]),
            status=RunStatus.QUEUED,
            current_phase=1,
            message="Run created and queued for execution",
            balance_changes=balance_change_responses,
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

    Requires X-User-ID header. Any org member can send invites.
    Sends invitation email via Supabase Auth.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header required")

    try:
        user_id = UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid X-User-ID format")

    # Verify user is a member of the org (any member can invite)
    client = get_supabase_client()._client
    membership = (
        client.table("org_members")
        .select("id")
        .eq("org_id", str(request.org_id))
        .eq("user_id", str(user_id))
        .execute()
    )
    if not membership.data:
        raise HTTPException(
            status_code=403,
            detail="You must be a member of this organization to send invites"
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

    Requires X-User-ID header. Any org member can view invites.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header required")

    try:
        user_id = UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid X-User-ID format")

    # Verify user is a member of the org
    client = get_supabase_client()._client
    membership = (
        client.table("org_members")
        .select("id")
        .eq("org_id", str(org_id))
        .eq("user_id", str(user_id))
        .execute()
    )
    if not membership.data:
        raise HTTPException(
            status_code=403,
            detail="You must be a member of this organization to view invites"
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
# Admin Panel Endpoints
# =============================================================================


class MemberUpdateRequest(BaseModel):
    """Request for updating member role."""
    role: str


class BulkMemberRequest(BaseModel):
    """Request for bulk member operations."""
    member_ids: list[str]
    action: str  # 'update_role' or 'remove'
    role: Optional[str] = None


@app.get("/api/admin/users")
async def get_all_system_users_endpoint(
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Get all users in the system from Supabase auth.

    Returns all users with their org membership info.
    Requires X-User-ID header. User must be an org admin/owner.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header required")

    # Verify user is an admin of at least one org
    client = get_supabase_client()._client
    result = (
        client.table("org_members")
        .select("role")
        .eq("user_id", x_user_id)
        .in_("role", ["owner", "admin"])
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        users = await get_all_system_users()
        return {"users": users, "total": len(users)}
    except AdminError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")


@app.get("/api/orgs/{org_id}/members/detailed")
async def get_detailed_members_endpoint(
    org_id: UUID,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Get detailed member list with activity stats.

    Requires X-User-ID header. User must be org admin/owner.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header required")

    # Verify admin access
    is_admin = await verify_admin_access(org_id, UUID(x_user_id))
    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        members = await get_detailed_members(org_id)
        return {"members": members}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch members: {str(e)}")


@app.patch("/api/orgs/{org_id}/members/{member_id}/role")
async def update_member_role_endpoint(
    org_id: UUID,
    member_id: UUID,
    request: MemberUpdateRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Update a member's role. Only owners can change roles.

    Requires X-User-ID header. User must be org owner.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header required")

    # Verify owner access (only owners can change roles)
    is_owner = await verify_org_owner(org_id, UUID(x_user_id))
    if not is_owner:
        raise HTTPException(status_code=403, detail="Owner access required to change roles")

    try:
        member = await update_member_role(
            org_id=org_id,
            member_id=member_id,
            new_role=request.role,
            actor_id=UUID(x_user_id)
        )
        return {"success": True, "member": member}
    except AdminError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update role: {str(e)}")


@app.delete("/api/orgs/{org_id}/members/{member_id}")
async def remove_member_endpoint(
    org_id: UUID,
    member_id: UUID,
    delete_account: bool = False,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Remove a member from the organization.

    Requires X-User-ID header. User must be org admin/owner.
    Set delete_account=true to also delete user from Supabase auth.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header required")

    # Verify admin access
    is_admin = await verify_admin_access(org_id, UUID(x_user_id))
    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        await remove_member(
            org_id=org_id,
            member_id=member_id,
            actor_id=UUID(x_user_id),
            delete_account=delete_account
        )
        message = "Member removed and account deleted" if delete_account else "Member removed from organization"
        return {"success": True, "message": message, "account_deleted": delete_account}
    except AdminError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove member: {str(e)}")


@app.post("/api/orgs/{org_id}/members/bulk")
async def bulk_member_action_endpoint(
    org_id: UUID,
    request: BulkMemberRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Perform bulk actions on members.

    Requires X-User-ID header. User must be org owner for role changes, admin for removals.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header required")

    # For role changes, require owner; for removals, require admin
    if request.action == "update_role":
        is_owner = await verify_org_owner(org_id, UUID(x_user_id))
        if not is_owner:
            raise HTTPException(status_code=403, detail="Owner access required for role changes")
    else:
        is_admin = await verify_admin_access(org_id, UUID(x_user_id))
        if not is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")

    try:
        results = await bulk_member_action(
            org_id=org_id,
            member_ids=request.member_ids,
            action=request.action,
            actor_id=UUID(x_user_id),
            role=request.role
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to perform bulk action: {str(e)}")


@app.get("/api/orgs/{org_id}/invites/all")
async def get_all_invites_endpoint(
    org_id: UUID,
    status: Optional[str] = None,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Get all invites including non-pending ones.

    Requires X-User-ID header. User must be org admin/owner.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header required")

    # Verify admin access
    is_admin = await verify_admin_access(org_id, UUID(x_user_id))
    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        invites = await get_all_invites(org_id, status=status)
        return {"invites": invites}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch invites: {str(e)}")


@app.delete("/api/invites/{invite_id}")
async def delete_invite_endpoint(
    invite_id: UUID,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Permanently delete an invite record.

    Requires X-User-ID header.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header required")

    try:
        await delete_invite(invite_id, actor_id=UUID(x_user_id))
        return {"success": True, "message": "Invite deleted"}
    except AdminError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete invite: {str(e)}")


@app.get("/api/orgs/{org_id}/audit-logs")
async def get_audit_logs_endpoint(
    org_id: UUID,
    action: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Get audit logs with filtering and pagination.

    Requires X-User-ID header. User must be org admin/owner.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header required")

    # Verify admin access
    is_admin = await verify_admin_access(org_id, UUID(x_user_id))
    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        logs, total_count = await get_audit_logs(
            org_id=org_id,
            action=action,
            limit=limit,
            offset=offset
        )
        return {
            "logs": logs,
            "total_count": total_count,
            "has_more": offset + len(logs) < total_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch audit logs: {str(e)}")


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
    user_limit: int = 10,
    user_offset: int = 0,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Get usage analytics with time series data.

    Args:
        org_id: Organization ID (omit for platform-wide, requires platform admin)
        time_range: Time range - 7d, 30d, 90d, 1y (default: 30d)
        user_limit: Max users to return (default: 10)
        user_offset: Offset for user pagination (default: 0)

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
        usage = await get_usage_analytics(org_id, time_range, user_limit, user_offset)
        return usage
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get usage analytics: {str(e)}")


@app.get("/api/analytics/costs")
async def get_costs_endpoint(
    org_id: Optional[UUID] = None,
    time_range: str = "30d",
    group_by: str = "model",
    user_limit: int = 10,
    user_offset: int = 0,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Get cost breakdown analytics.

    Args:
        org_id: Organization ID (omit for platform-wide, requires platform admin)
        time_range: Time range - 7d, 30d, 90d, 1y (default: 30d)
        group_by: Grouping - model, user, day (default: model)
        user_limit: Max users to return (default: 10)
        user_offset: Offset for user pagination (default: 0)

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
        costs = await get_cost_analytics(org_id, time_range, group_by, user_limit, user_offset)
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
