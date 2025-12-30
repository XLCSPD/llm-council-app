"""Session API endpoints."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_council_repository, get_session_repository
from app.models.domain.council import Council, CouncilMember
from app.models.domain.session import PromptConfig, Session, SessionStatus
from app.models.schemas.requests import CreateSessionRequest
from app.models.schemas.responses import (
    CouncilResponse,
    MemberResponse,
    PhaseRecordResponse,
    PromptConfigResponse,
    SessionResponse,
    SessionSummary,
)
from app.storage.repositories.council_repo import CouncilRepository
from app.storage.repositories.session_repo import SessionRepository

router = APIRouter()


def _council_to_response(council: Council) -> CouncilResponse:
    """Convert a Council domain model to a response."""
    return CouncilResponse(
        id=council.id,
        name=council.name,
        description=council.description,
        members=[
            MemberResponse(
                id=m.id,
                model_id=m.model_id,
                role=m.role,
                weight=m.weight,
                token_limit=m.token_limit,
                enabled=m.enabled,
                display_name=m.display_name,
            )
            for m in council.members
        ],
        chairman_id=council.chairman_id,
        preset=council.preset,
        created_at=council.created_at,
        is_template=council.is_template,
    )


def _session_to_response(session: Session, council: Council) -> SessionResponse:
    """Convert a Session domain model to a response."""
    return SessionResponse(
        id=session.id,
        title=session.title,
        status=session.status,
        current_phase=session.current_phase,
        created_at=session.created_at,
        updated_at=session.updated_at,
        prompt=PromptConfigResponse(
            content=session.prompt.content,
            objective=session.prompt.objective,
            constraints=session.prompt.constraints,
            audience=session.prompt.audience,
            context=session.prompt.context,
        ),
        council=_council_to_response(council),
        phase_history=[
            PhaseRecordResponse(
                phase=pr.phase,
                status=pr.status,
                started_at=pr.started_at,
                completed_at=pr.completed_at,
                duration_ms=pr.duration_ms,
            )
            for pr in session.phase_history
        ],
        metadata=session.metadata,
    )


@router.get("", response_model=list[SessionSummary])
async def list_sessions(
    status: Optional[SessionStatus] = None,
    limit: int = 50,
    offset: int = 0,
    session_repo: SessionRepository = Depends(get_session_repository),
    council_repo: CouncilRepository = Depends(get_council_repository),
) -> list[SessionSummary]:
    """List all sessions."""
    sessions = await session_repo.list_all(status=status, limit=limit, offset=offset)

    summaries = []
    for session in sessions:
        council = await council_repo.get(session.council_id)
        council_name = council.name if council else "Unknown"
        summaries.append(
            SessionSummary(
                id=session.id,
                title=session.title or session.generate_title(),
                status=session.status,
                current_phase=session.current_phase,
                created_at=session.created_at,
                council_name=council_name,
            )
        )

    return summaries


@router.post("", response_model=SessionResponse)
async def create_session(
    request: CreateSessionRequest,
    session_repo: SessionRepository = Depends(get_session_repository),
    council_repo: CouncilRepository = Depends(get_council_repository),
) -> SessionResponse:
    """Create a new session."""
    # Determine which council to use
    council: Optional[Council] = None

    if request.council_id:
        # Use existing council
        council = await council_repo.get(request.council_id)
        if not council:
            raise HTTPException(status_code=404, detail="Council not found")

    elif request.council:
        # Create inline council
        members = [
            CouncilMember(
                model_id=m.model_id,
                role=m.role,
                weight=m.weight,
                token_limit=m.token_limit,
                display_name=m.display_name,
            )
            for m in request.council.members
        ]

        council = Council(
            name=request.council.name,
            description=request.council.description,
            members=members,
            preset=request.council.preset,
        )

        # Set chairman if specified
        if request.council.chairman_model_id:
            for member in council.members:
                if member.model_id == request.council.chairman_model_id:
                    council.set_chairman(member.id)
                    break

        council = await council_repo.create(council)

    elif request.template_id:
        # Use template (copy it)
        template = await council_repo.get(request.template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")

        council = Council(
            name=template.name,
            description=template.description,
            members=template.members.copy(),
            chairman_id=template.chairman_id,
            preset=template.preset,
        )
        council = await council_repo.create(council)

    else:
        # Create default council
        council = council_repo.get_preset_council(
            request.council.preset if request.council else None
        )
        council = await council_repo.create(council)

    # Create the session
    prompt_config = PromptConfig(
        content=request.prompt.content,
        objective=request.prompt.objective,
        constraints=request.prompt.constraints,
        audience=request.prompt.audience,
        context=request.prompt.context,
    )

    session = Session(
        prompt=prompt_config,
        council_id=council.id,
        title=prompt_config.content[:50] + ("..." if len(prompt_config.content) > 50 else ""),
    )

    session = await session_repo.create(session)

    return _session_to_response(session, council)


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: UUID,
    session_repo: SessionRepository = Depends(get_session_repository),
    council_repo: CouncilRepository = Depends(get_council_repository),
) -> SessionResponse:
    """Get a session by ID."""
    session = await session_repo.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    council = await council_repo.get(session.council_id)
    if not council:
        raise HTTPException(status_code=404, detail="Council not found")

    return _session_to_response(session, council)


@router.delete("/{session_id}")
async def delete_session(
    session_id: UUID,
    session_repo: SessionRepository = Depends(get_session_repository),
) -> dict:
    """Delete a session."""
    deleted = await session_repo.delete(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "deleted", "id": str(session_id)}
