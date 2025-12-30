"""Session domain models."""

from datetime import datetime
from enum import Enum
from typing import Any, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class PhaseType(str, Enum):
    """The four phases of the deliberation process."""

    SETUP = "setup"
    REASONING = "reasoning"
    REVIEW = "review"
    SYNTHESIS = "synthesis"


class PhaseStatus(str, Enum):
    """Status of a phase."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class SessionStatus(str, Enum):
    """Overall session status."""

    DRAFT = "draft"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class PromptConfig(BaseModel):
    """Structured prompt configuration."""

    content: str
    objective: Optional[str] = None
    constraints: list[str] = Field(default_factory=list)
    audience: Optional[str] = None
    context: Optional[str] = None

    def to_full_prompt(self) -> str:
        """Convert structured config to a full prompt string."""
        parts = [self.content]

        if self.objective:
            parts.append(f"\n\nObjective: {self.objective}")

        if self.constraints:
            constraints_text = "\n".join(f"- {c}" for c in self.constraints)
            parts.append(f"\n\nConstraints:\n{constraints_text}")

        if self.audience:
            parts.append(f"\n\nTarget Audience: {self.audience}")

        if self.context:
            parts.append(f"\n\nAdditional Context: {self.context}")

        return "".join(parts)


class PhaseRecord(BaseModel):
    """Record of a phase's execution."""

    phase: PhaseType
    status: PhaseStatus = PhaseStatus.PENDING
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    output_ids: list[UUID] = Field(default_factory=list)
    error: Optional[str] = None

    @property
    def duration_ms(self) -> Optional[int]:
        """Calculate phase duration in milliseconds."""
        if self.started_at and self.completed_at:
            delta = self.completed_at - self.started_at
            return int(delta.total_seconds() * 1000)
        return None


class Session(BaseModel):
    """A deliberation session."""

    id: UUID = Field(default_factory=uuid4)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    title: Optional[str] = None
    prompt: PromptConfig
    council_id: UUID
    current_phase: PhaseType = PhaseType.SETUP
    status: SessionStatus = SessionStatus.DRAFT
    phase_history: list[PhaseRecord] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)

    def model_post_init(self, __context: Any) -> None:
        """Initialize phase history if empty."""
        if not self.phase_history:
            self.phase_history = [
                PhaseRecord(phase=PhaseType.SETUP),
                PhaseRecord(phase=PhaseType.REASONING),
                PhaseRecord(phase=PhaseType.REVIEW),
                PhaseRecord(phase=PhaseType.SYNTHESIS),
            ]

    def get_phase_record(self, phase: PhaseType) -> Optional[PhaseRecord]:
        """Get the record for a specific phase."""
        for record in self.phase_history:
            if record.phase == phase:
                return record
        return None

    def update_phase_status(self, phase: PhaseType, status: PhaseStatus) -> None:
        """Update the status of a phase."""
        record = self.get_phase_record(phase)
        if record:
            record.status = status
            if status == PhaseStatus.RUNNING:
                record.started_at = datetime.utcnow()
            elif status in (PhaseStatus.COMPLETED, PhaseStatus.FAILED):
                record.completed_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def advance_phase(self) -> bool:
        """Advance to the next phase if possible."""
        phase_order = [PhaseType.SETUP, PhaseType.REASONING, PhaseType.REVIEW, PhaseType.SYNTHESIS]
        try:
            current_idx = phase_order.index(self.current_phase)
            if current_idx < len(phase_order) - 1:
                self.current_phase = phase_order[current_idx + 1]
                self.updated_at = datetime.utcnow()
                return True
        except ValueError:
            pass
        return False

    def generate_title(self) -> str:
        """Generate a title from the prompt content."""
        content = self.prompt.content[:50]
        if len(self.prompt.content) > 50:
            content += "..."
        return content
