"""API request schemas."""

from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.domain.council import CouncilPreset, RoleType


class PromptConfigRequest(BaseModel):
    """Request body for prompt configuration."""

    content: str = Field(min_length=1)
    objective: Optional[str] = None
    constraints: list[str] = Field(default_factory=list)
    audience: Optional[str] = None
    context: Optional[str] = None


class AddMemberRequest(BaseModel):
    """Request to add a member to a council."""

    model_id: str
    role: RoleType = RoleType.THINKER
    weight: float = Field(default=1.0, ge=0.0, le=1.0)
    token_limit: Optional[int] = Field(default=None, ge=100, le=32000)
    display_name: Optional[str] = None


class CreateCouncilRequest(BaseModel):
    """Request to create a new council."""

    name: str = "New Council"
    description: Optional[str] = None
    members: list[AddMemberRequest] = Field(default_factory=list)
    chairman_model_id: Optional[str] = None
    preset: Optional[CouncilPreset] = None


class UpdateCouncilMemberRequest(BaseModel):
    """Request to update a council member."""

    role: Optional[RoleType] = None
    weight: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    token_limit: Optional[int] = Field(default=None, ge=100, le=32000)
    enabled: Optional[bool] = None
    display_name: Optional[str] = None


class CreateSessionRequest(BaseModel):
    """Request to create a new session."""

    prompt: PromptConfigRequest
    council_id: Optional[UUID] = None  # Use existing council
    council: Optional[CreateCouncilRequest] = None  # Create inline council
    template_id: Optional[UUID] = None  # Use template


class StartDeliberationRequest(BaseModel):
    """Request to start a deliberation."""

    skip_phases: list[str] = Field(default_factory=list)
