"""FastAPI dependencies for dependency injection."""

from functools import lru_cache

from app.config import get_settings
from app.storage.base import JsonFileStorage
from app.storage.repositories.council_repo import CouncilRepository
from app.storage.repositories.session_repo import SessionRepository


@lru_cache
def get_storage() -> JsonFileStorage:
    """Get the storage instance."""
    settings = get_settings()
    return JsonFileStorage(settings.data_dir)


def get_session_repository() -> SessionRepository:
    """Get the session repository."""
    return SessionRepository(get_storage())


def get_council_repository() -> CouncilRepository:
    """Get the council repository."""
    return CouncilRepository(get_storage())
