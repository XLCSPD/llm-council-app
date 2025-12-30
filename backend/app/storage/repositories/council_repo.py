"""Council repository for persistence."""

from typing import Optional
from uuid import UUID

from app.models.domain.council import Council, CouncilMember, CouncilPreset, RoleType
from app.storage.base import JsonFileStorage


class CouncilRepository:
    """Repository for council persistence."""

    def __init__(self, storage: JsonFileStorage):
        self.storage = storage
        self.entity_type = "councils"

    async def create(self, council: Council) -> Council:
        """Create a new council."""
        await self.storage.save(self.entity_type, council.id, council.model_dump())
        return council

    async def get(self, id: UUID) -> Optional[Council]:
        """Get a council by ID."""
        data = await self.storage.load(self.entity_type, id)
        if data:
            return Council.model_validate(data)
        return None

    async def update(self, council: Council) -> Council:
        """Update an existing council."""
        await self.storage.save(self.entity_type, council.id, council.model_dump())
        return council

    async def delete(self, id: UUID) -> bool:
        """Delete a council."""
        return await self.storage.delete(self.entity_type, id)

    async def list_all(self, templates_only: bool = False) -> list[Council]:
        """List all councils."""
        all_data = await self.storage.list_all(self.entity_type)
        councils = [Council.model_validate(d) for d in all_data]

        if templates_only:
            councils = [c for c in councils if c.is_template]

        # Sort by created_at descending
        councils.sort(key=lambda c: c.created_at, reverse=True)
        return councils

    async def exists(self, id: UUID) -> bool:
        """Check if a council exists."""
        return await self.storage.exists(self.entity_type, id)

    async def add_member(self, council_id: UUID, member: CouncilMember) -> Optional[Council]:
        """Add a member to a council."""
        council = await self.get(council_id)
        if council:
            council.add_member(member)
            await self.update(council)
            return council
        return None

    async def remove_member(self, council_id: UUID, member_id: UUID) -> Optional[Council]:
        """Remove a member from a council."""
        council = await self.get(council_id)
        if council and council.remove_member(member_id):
            await self.update(council)
            return council
        return None

    async def update_member(
        self,
        council_id: UUID,
        member_id: UUID,
        role: Optional[RoleType] = None,
        weight: Optional[float] = None,
        token_limit: Optional[int] = None,
        enabled: Optional[bool] = None,
    ) -> Optional[Council]:
        """Update a member's configuration."""
        council = await self.get(council_id)
        if not council:
            return None

        member = council.get_member(member_id)
        if not member:
            return None

        if role is not None:
            member.role = role
        if weight is not None:
            member.weight = weight
        if token_limit is not None:
            member.token_limit = token_limit
        if enabled is not None:
            member.enabled = enabled

        await self.update(council)
        return council

    async def set_chairman(self, council_id: UUID, member_id: UUID) -> Optional[Council]:
        """Set a member as the chairman."""
        council = await self.get(council_id)
        if council and council.set_chairman(member_id):
            await self.update(council)
            return council
        return None

    def get_preset_council(self, preset: CouncilPreset) -> Council:
        """Get a pre-configured council based on preset."""
        from app.config import get_settings

        settings = get_settings()

        if preset == CouncilPreset.FAST:
            members = [
                CouncilMember(
                    model_id="openai/gpt-4o-mini",
                    role=RoleType.THINKER,
                    token_limit=1000,
                ),
                CouncilMember(
                    model_id="anthropic/claude-3-haiku",
                    role=RoleType.CRITIC,
                    token_limit=1000,
                ),
                CouncilMember(
                    model_id="google/gemini-2.0-flash-exp",
                    role=RoleType.SYNTHESIZER,
                    token_limit=1500,
                ),
            ]
        elif preset == CouncilPreset.BALANCED:
            members = [
                CouncilMember(
                    model_id="openai/gpt-4o",
                    role=RoleType.THINKER,
                    token_limit=2000,
                ),
                CouncilMember(
                    model_id="anthropic/claude-3.5-sonnet",
                    role=RoleType.CRITIC,
                    token_limit=2000,
                ),
                CouncilMember(
                    model_id="google/gemini-2.0-flash-exp",
                    role=RoleType.DEVILS_ADVOCATE,
                    token_limit=2000,
                ),
                CouncilMember(
                    model_id="anthropic/claude-3.5-sonnet",
                    role=RoleType.SYNTHESIZER,
                    token_limit=3000,
                ),
            ]
        elif preset == CouncilPreset.DEEP_ANALYSIS:
            members = [
                CouncilMember(
                    model_id="openai/gpt-4o",
                    role=RoleType.THINKER,
                    token_limit=4000,
                ),
                CouncilMember(
                    model_id="anthropic/claude-3.5-sonnet",
                    role=RoleType.THINKER,
                    token_limit=4000,
                ),
                CouncilMember(
                    model_id="google/gemini-2.0-flash-exp",
                    role=RoleType.CRITIC,
                    token_limit=4000,
                ),
                CouncilMember(
                    model_id="meta-llama/llama-3.3-70b-instruct",
                    role=RoleType.DEVILS_ADVOCATE,
                    token_limit=4000,
                ),
                CouncilMember(
                    model_id="anthropic/claude-3.5-sonnet",
                    role=RoleType.SYNTHESIZER,
                    token_limit=6000,
                ),
            ]
        else:  # EXECUTIVE_DECISION
            members = [
                CouncilMember(
                    model_id="openai/gpt-4o",
                    role=RoleType.THINKER,
                    token_limit=8000,
                ),
                CouncilMember(
                    model_id="anthropic/claude-3.5-sonnet",
                    role=RoleType.THINKER,
                    token_limit=8000,
                ),
                CouncilMember(
                    model_id="openai/gpt-4o",
                    role=RoleType.CRITIC,
                    token_limit=8000,
                ),
                CouncilMember(
                    model_id="anthropic/claude-3.5-sonnet",
                    role=RoleType.DEVILS_ADVOCATE,
                    token_limit=8000,
                ),
                CouncilMember(
                    model_id="anthropic/claude-3.5-sonnet",
                    role=RoleType.SYNTHESIZER,
                    token_limit=12000,
                ),
            ]

        council = Council(
            name=f"{preset.value.replace('_', ' ').title()} Council",
            description=f"Pre-configured {preset.value} council preset",
            members=members,
            preset=preset,
        )

        # Set the last synthesizer as chairman
        for member in reversed(members):
            if member.role == RoleType.SYNTHESIZER:
                council.set_chairman(member.id)
                break

        return council
