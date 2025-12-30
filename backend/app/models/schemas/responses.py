"""API response schemas."""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.domain.council import CouncilPreset, RoleType
from app.models.domain.session import PhaseStatus, PhaseType, SessionStatus


class MemberResponse(BaseModel):
    """Response for a council member."""

    id: UUID
    model_id: str
    role: RoleType
    weight: float
    token_limit: Optional[int]
    enabled: bool
    display_name: Optional[str]


class CouncilSummary(BaseModel):
    """Summary of a council."""

    id: UUID
    name: str
    member_count: int
    preset: Optional[CouncilPreset]


class CouncilResponse(BaseModel):
    """Full council response."""

    id: UUID
    name: str
    description: Optional[str]
    members: list[MemberResponse]
    chairman_id: Optional[UUID]
    preset: Optional[CouncilPreset]
    created_at: datetime
    is_template: bool


class PhaseRecordResponse(BaseModel):
    """Response for a phase record."""

    phase: PhaseType
    status: PhaseStatus
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    duration_ms: Optional[int]


class PromptConfigResponse(BaseModel):
    """Response for prompt configuration."""

    content: str
    objective: Optional[str]
    constraints: list[str]
    audience: Optional[str]
    context: Optional[str]


class SessionSummary(BaseModel):
    """Summary of a session for listing."""

    id: UUID
    title: Optional[str]
    status: SessionStatus
    current_phase: PhaseType
    created_at: datetime
    council_name: str


class SessionResponse(BaseModel):
    """Full session response."""

    id: UUID
    title: Optional[str]
    status: SessionStatus
    current_phase: PhaseType
    created_at: datetime
    updated_at: datetime
    prompt: PromptConfigResponse
    council: CouncilResponse
    phase_history: list[PhaseRecordResponse]
    metadata: dict[str, Any]


class OutputResponse(BaseModel):
    """Response for a model output."""

    id: UUID
    member_id: UUID
    model_id: str
    role: RoleType
    content: str
    token_count: int
    latency_ms: int
    created_at: datetime


class ModelInfo(BaseModel):
    """Information about an available LLM model."""

    id: str
    provider: str
    display_name: str
    context_window: int
    cost_per_1k_input: float
    cost_per_1k_output: float
    supports_streaming: bool
    recommended_roles: list[RoleType]


class AnalyticsResponse(BaseModel):
    """Analytics data for visualizations."""

    rankings_matrix: list[list[int]]  # NxN matrix for heatmap
    aggregate_rankings: list[dict[str, Any]]
    agreement_score: float
    consensus_breakdown: dict[str, float]
