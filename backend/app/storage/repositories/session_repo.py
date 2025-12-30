"""Session repository for persistence."""

from typing import Optional
from uuid import UUID

from app.models.domain.session import PhaseStatus, PhaseType, Session, SessionStatus
from app.storage.base import JsonFileStorage


class SessionRepository:
    """Repository for session persistence."""

    def __init__(self, storage: JsonFileStorage):
        self.storage = storage
        self.entity_type = "sessions"

    async def create(self, session: Session) -> Session:
        """Create a new session."""
        await self.storage.save(self.entity_type, session.id, session.model_dump())
        return session

    async def get(self, id: UUID) -> Optional[Session]:
        """Get a session by ID."""
        data = await self.storage.load(self.entity_type, id)
        if data:
            return Session.model_validate(data)
        return None

    async def update(self, session: Session) -> Session:
        """Update an existing session."""
        await self.storage.save(self.entity_type, session.id, session.model_dump())
        return session

    async def delete(self, id: UUID) -> bool:
        """Delete a session."""
        return await self.storage.delete(self.entity_type, id)

    async def list_all(
        self,
        status: Optional[SessionStatus] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Session]:
        """List sessions with optional filtering."""
        all_data = await self.storage.list_all(self.entity_type)
        sessions = [Session.model_validate(d) for d in all_data]

        # Filter by status if provided
        if status:
            sessions = [s for s in sessions if s.status == status]

        # Sort by created_at descending (newest first)
        sessions.sort(key=lambda s: s.created_at, reverse=True)

        # Apply pagination
        return sessions[offset : offset + limit]

    async def exists(self, id: UUID) -> bool:
        """Check if a session exists."""
        return await self.storage.exists(self.entity_type, id)

    async def update_phase_status(
        self, session_id: UUID, phase: PhaseType, status: PhaseStatus
    ) -> Optional[Session]:
        """Update the status of a specific phase."""
        session = await self.get(session_id)
        if session:
            session.update_phase_status(phase, status)
            await self.update(session)
            return session
        return None

    async def advance_phase(self, session_id: UUID) -> Optional[Session]:
        """Advance the session to the next phase."""
        session = await self.get(session_id)
        if session and session.advance_phase():
            await self.update(session)
            return session
        return None
