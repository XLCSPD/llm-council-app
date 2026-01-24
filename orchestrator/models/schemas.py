"""Pydantic schemas for API requests and responses."""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class RunStatus(str, Enum):
    """Status of a deliberation run."""
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELED = "canceled"


class ModelRole(str, Enum):
    """Role assigned to a model in the council."""
    THINKER = "thinker"
    CRITIC = "critic"
    DEVILS_ADVOCATE = "devils_advocate"
    CHAIR = "chair"


class ModelStatus(str, Enum):
    """Status of an individual model in a run."""
    PENDING = "pending"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


# Request schemas

class CouncilMemberConfig(BaseModel):
    """Configuration for a council member."""
    model_key: str = Field(..., description="Model identifier (e.g., 'openai/gpt-4o')")
    display_name: str = Field(..., description="Human-readable model name")
    role: ModelRole = Field(default=ModelRole.THINKER)
    weight: float = Field(default=1.0, ge=0.0, le=1.0)
    token_limit: Optional[int] = Field(default=None, description="Max output tokens")


class CouncilConfig(BaseModel):
    """Council configuration for a run."""
    members: List[CouncilMemberConfig] = Field(..., min_length=2)
    chairman_model_key: Optional[str] = Field(
        default=None,
        description="Model to use for synthesis. Defaults to first member."
    )

    @field_validator("members")
    @classmethod
    def validate_max_one_chair(cls, v: List[CouncilMemberConfig]) -> List[CouncilMemberConfig]:
        """Ensure at most one chair in the council."""
        chair_count = sum(1 for m in v if m.role == ModelRole.CHAIR)
        if chair_count > 1:
            raise ValueError("Council can have at most 1 chair")
        return v


class PromptAttachment(BaseModel):
    """Attachment for a prompt (image or PDF)."""
    id: str
    type: str = Field(..., description="Attachment type: 'image' or 'pdf'")
    filename: str
    storage_path: str
    public_url: str
    mime_type: str
    size_bytes: int
    extracted_text: Optional[str] = None


class PromptConfig(BaseModel):
    """Prompt configuration for a run."""
    content: str = Field(..., min_length=1)
    objective: Optional[str] = None
    constraints: List[str] = Field(default_factory=list)
    audience: Optional[str] = None
    context: Optional[str] = None
    attachments: List[PromptAttachment] = Field(default_factory=list)


class RunCreate(BaseModel):
    """Request to create a new deliberation run."""
    session_id: UUID
    prompt: PromptConfig
    council: CouncilConfig
    auto_balance: bool = Field(
        default=True,
        description="Automatically add critic role if missing. If False, returns error for unbalanced councils."
    )


# Response schemas

class ModelOutputResponse(BaseModel):
    """Output from a model for a specific phase."""
    id: UUID
    phase: int
    content: str
    metadata: dict = Field(default_factory=dict)
    created_at: datetime


class RunModelResponse(BaseModel):
    """Model participation in a run."""
    id: UUID
    model_key: str
    display_name: str
    role: ModelRole
    weight: float
    status: ModelStatus
    latency_ms: Optional[int] = None
    cost_usd: Optional[float] = None
    outputs: List[ModelOutputResponse] = Field(default_factory=list)


class PhaseStatus(BaseModel):
    """Status of a specific phase."""
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class PeerReviewResponse(BaseModel):
    """Peer review from one model to another."""
    id: UUID
    run_id: UUID
    reviewer_run_model_id: UUID
    reviewed_run_model_id: UUID
    score: float
    rationale: Optional[str] = None
    created_at: datetime


class RunResponse(BaseModel):
    """Response for a deliberation run."""
    id: UUID
    session_id: UUID
    prompt_id: UUID
    status: RunStatus
    current_phase: int = Field(ge=1, le=4)
    phase_status: Dict[str, PhaseStatus] = Field(default_factory=dict)
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    error: Optional[dict] = None
    cost_usd: Optional[float] = None
    models: List[RunModelResponse] = Field(default_factory=list)
    peer_reviews: List[PeerReviewResponse] = Field(default_factory=list)
    created_at: datetime

    class Config:
        from_attributes = True


class BalanceChangeResponse(BaseModel):
    """Record of a change made during council auto-balancing."""
    type: str = Field(..., description="Type of change: 'auto_assigned_critic' or 'injected_critic'")
    model_key: str = Field(..., description="Model that was affected")
    original_role: Optional[str] = Field(None, description="Original role before change (if reassigned)")
    new_role: str = Field(..., description="New role assigned")
    reason: str = Field(..., description="Explanation of why the change was made")


class SuggestedFixResponse(BaseModel):
    """Suggested fix for an unbalanced council when auto-balance is disabled."""
    type: str = Field(..., description="Type of fix: 'assign_role' or 'inject_model'")
    model_key: str = Field(..., description="Model to modify or inject")
    recommended_role: str = Field(..., description="Recommended role to assign")


class RunStatusResponse(BaseModel):
    """Simplified run status response."""
    id: UUID
    status: RunStatus
    current_phase: int
    message: Optional[str] = None
    balance_changes: Optional[List[BalanceChangeResponse]] = Field(
        default=None,
        description="Changes made by auto-balancing (if any)"
    )
