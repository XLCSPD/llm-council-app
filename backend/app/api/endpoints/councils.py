"""Council API endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_council_repository
from app.models.domain.council import Council, CouncilMember, CouncilPreset
from app.models.schemas.requests import (
    AddMemberRequest,
    CreateCouncilRequest,
    UpdateCouncilMemberRequest,
)
from app.models.schemas.responses import CouncilResponse, CouncilSummary, MemberResponse
from app.storage.repositories.council_repo import CouncilRepository

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


@router.get("", response_model=list[CouncilSummary])
async def list_councils(
    templates_only: bool = False,
    council_repo: CouncilRepository = Depends(get_council_repository),
) -> list[CouncilSummary]:
    """List all councils."""
    councils = await council_repo.list_all(templates_only=templates_only)
    return [
        CouncilSummary(
            id=c.id,
            name=c.name,
            member_count=len(c.members),
            preset=c.preset,
        )
        for c in councils
    ]


@router.post("", response_model=CouncilResponse)
async def create_council(
    request: CreateCouncilRequest,
    council_repo: CouncilRepository = Depends(get_council_repository),
) -> CouncilResponse:
    """Create a new council."""
    # If preset is specified, start with preset council
    if request.preset:
        council = council_repo.get_preset_council(request.preset)
        council.name = request.name
        council.description = request.description
    else:
        members = [
            CouncilMember(
                model_id=m.model_id,
                role=m.role,
                weight=m.weight,
                token_limit=m.token_limit,
                display_name=m.display_name,
            )
            for m in request.members
        ]

        council = Council(
            name=request.name,
            description=request.description,
            members=members,
        )

        # Set chairman if specified
        if request.chairman_model_id:
            for member in council.members:
                if member.model_id == request.chairman_model_id:
                    council.set_chairman(member.id)
                    break

    council = await council_repo.create(council)
    return _council_to_response(council)


@router.get("/presets", response_model=list[CouncilResponse])
async def get_presets(
    council_repo: CouncilRepository = Depends(get_council_repository),
) -> list[CouncilResponse]:
    """Get all preset council configurations."""
    presets = []
    for preset in CouncilPreset:
        council = council_repo.get_preset_council(preset)
        presets.append(_council_to_response(council))
    return presets


@router.get("/{council_id}", response_model=CouncilResponse)
async def get_council(
    council_id: UUID,
    council_repo: CouncilRepository = Depends(get_council_repository),
) -> CouncilResponse:
    """Get a council by ID."""
    council = await council_repo.get(council_id)
    if not council:
        raise HTTPException(status_code=404, detail="Council not found")
    return _council_to_response(council)


@router.delete("/{council_id}")
async def delete_council(
    council_id: UUID,
    council_repo: CouncilRepository = Depends(get_council_repository),
) -> dict:
    """Delete a council."""
    deleted = await council_repo.delete(council_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Council not found")
    return {"status": "deleted", "id": str(council_id)}


@router.post("/{council_id}/members", response_model=CouncilResponse)
async def add_member(
    council_id: UUID,
    request: AddMemberRequest,
    council_repo: CouncilRepository = Depends(get_council_repository),
) -> CouncilResponse:
    """Add a member to a council."""
    member = CouncilMember(
        model_id=request.model_id,
        role=request.role,
        weight=request.weight,
        token_limit=request.token_limit,
        display_name=request.display_name,
    )

    council = await council_repo.add_member(council_id, member)
    if not council:
        raise HTTPException(status_code=404, detail="Council not found")

    return _council_to_response(council)


@router.put("/{council_id}/members/{member_id}", response_model=CouncilResponse)
async def update_member(
    council_id: UUID,
    member_id: UUID,
    request: UpdateCouncilMemberRequest,
    council_repo: CouncilRepository = Depends(get_council_repository),
) -> CouncilResponse:
    """Update a council member's configuration."""
    council = await council_repo.update_member(
        council_id=council_id,
        member_id=member_id,
        role=request.role,
        weight=request.weight,
        token_limit=request.token_limit,
        enabled=request.enabled,
    )

    if not council:
        raise HTTPException(status_code=404, detail="Council or member not found")

    return _council_to_response(council)


@router.delete("/{council_id}/members/{member_id}", response_model=CouncilResponse)
async def remove_member(
    council_id: UUID,
    member_id: UUID,
    council_repo: CouncilRepository = Depends(get_council_repository),
) -> CouncilResponse:
    """Remove a member from a council."""
    council = await council_repo.remove_member(council_id, member_id)
    if not council:
        raise HTTPException(status_code=404, detail="Council or member not found")

    return _council_to_response(council)


@router.put("/{council_id}/chairman/{member_id}", response_model=CouncilResponse)
async def set_chairman(
    council_id: UUID,
    member_id: UUID,
    council_repo: CouncilRepository = Depends(get_council_repository),
) -> CouncilResponse:
    """Set a member as the council chairman."""
    council = await council_repo.set_chairman(council_id, member_id)
    if not council:
        raise HTTPException(status_code=404, detail="Council or member not found")

    return _council_to_response(council)


@router.post("/{council_id}/save-as-template", response_model=CouncilResponse)
async def save_as_template(
    council_id: UUID,
    name: str = "My Template",
    council_repo: CouncilRepository = Depends(get_council_repository),
) -> CouncilResponse:
    """Save a council as a reusable template."""
    council = await council_repo.get(council_id)
    if not council:
        raise HTTPException(status_code=404, detail="Council not found")

    # Create a copy as template
    template = Council(
        name=name,
        description=f"Template based on {council.name}",
        members=[m.model_copy() for m in council.members],
        chairman_id=council.chairman_id,
        preset=council.preset,
        is_template=True,
    )

    template = await council_repo.create(template)
    return _council_to_response(template)
