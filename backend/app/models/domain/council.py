"""Council domain models."""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class RoleType(str, Enum):
    """Roles that council members can take on."""

    THINKER = "thinker"
    CRITIC = "critic"
    DEVILS_ADVOCATE = "devils_advocate"
    SYNTHESIZER = "synthesizer"


class CouncilPreset(str, Enum):
    """Pre-configured council setups."""

    FAST = "fast"  # 3 models, low token limits, fastest models
    BALANCED = "balanced"  # 4 models, moderate settings
    DEEP_ANALYSIS = "deep_analysis"  # 5+ models, high token limits
    EXECUTIVE_DECISION = "executive"  # Premium models, maximum deliberation


class CouncilMember(BaseModel):
    """A member of the council with its configuration."""

    id: UUID = Field(default_factory=uuid4)
    model_id: str  # OpenRouter model identifier (e.g., "openai/gpt-4o")
    role: RoleType = RoleType.THINKER
    weight: float = Field(default=1.0, ge=0.0, le=1.0)
    token_limit: Optional[int] = Field(default=None, ge=100, le=32000)
    enabled: bool = True
    display_name: Optional[str] = None

    @property
    def name(self) -> str:
        """Get display name or derive from model_id."""
        if self.display_name:
            return self.display_name
        # Extract model name from model_id (e.g., "openai/gpt-4o" -> "GPT-4o")
        parts = self.model_id.split("/")
        return parts[-1].upper() if parts else self.model_id


class Council(BaseModel):
    """A council configuration with its members."""

    id: UUID = Field(default_factory=uuid4)
    name: str = "Default Council"
    description: Optional[str] = None
    members: list[CouncilMember] = Field(default_factory=list)
    chairman_id: Optional[UUID] = None  # Reference to the synthesizer member
    preset: Optional[CouncilPreset] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_template: bool = False

    @property
    def chairman(self) -> Optional[CouncilMember]:
        """Get the chairman member if set."""
        if not self.chairman_id:
            return None
        for member in self.members:
            if member.id == self.chairman_id:
                return member
        return None

    @property
    def active_members(self) -> list[CouncilMember]:
        """Get all enabled members."""
        return [m for m in self.members if m.enabled]

    def get_member(self, member_id: UUID) -> Optional[CouncilMember]:
        """Get a member by ID."""
        for member in self.members:
            if member.id == member_id:
                return member
        return None

    def add_member(self, member: CouncilMember) -> None:
        """Add a member to the council."""
        self.members.append(member)

    def remove_member(self, member_id: UUID) -> bool:
        """Remove a member from the council."""
        for i, member in enumerate(self.members):
            if member.id == member_id:
                self.members.pop(i)
                if self.chairman_id == member_id:
                    self.chairman_id = None
                return True
        return False

    def set_chairman(self, member_id: UUID) -> bool:
        """Set a member as the chairman."""
        member = self.get_member(member_id)
        if member:
            self.chairman_id = member_id
            return True
        return False
