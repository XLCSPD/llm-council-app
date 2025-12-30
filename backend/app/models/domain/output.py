"""Output domain models."""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from app.models.domain.session import PhaseType


class Output(BaseModel):
    """An output from a council member during a phase."""

    id: UUID = Field(default_factory=uuid4)
    session_id: UUID
    phase: PhaseType
    member_id: UUID
    content: str
    token_count: int = 0
    latency_ms: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = Field(default_factory=dict)


class SynthesisOutput(Output):
    """Extended output for the synthesis phase with additional fields."""

    confidence_level: float = Field(default=0.0, ge=0.0, le=1.0)
    key_agreements: list[str] = Field(default_factory=list)
    key_disagreements: list[str] = Field(default_factory=list)
    reasoning_summary: str = ""
    minority_opinions: list[str] = Field(default_factory=list)

    @classmethod
    def from_output(
        cls,
        output: Output,
        confidence_level: float = 0.0,
        key_agreements: Optional[list[str]] = None,
        key_disagreements: Optional[list[str]] = None,
        reasoning_summary: str = "",
        minority_opinions: Optional[list[str]] = None,
    ) -> "SynthesisOutput":
        """Create a SynthesisOutput from a base Output."""
        return cls(
            id=output.id,
            session_id=output.session_id,
            phase=output.phase,
            member_id=output.member_id,
            content=output.content,
            token_count=output.token_count,
            latency_ms=output.latency_ms,
            created_at=output.created_at,
            metadata=output.metadata,
            confidence_level=confidence_level,
            key_agreements=key_agreements or [],
            key_disagreements=key_disagreements or [],
            reasoning_summary=reasoning_summary,
            minority_opinions=minority_opinions or [],
        )
