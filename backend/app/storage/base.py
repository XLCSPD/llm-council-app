"""Base storage interface."""

import json
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Optional, TypeVar
from uuid import UUID

from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class StorageInterface(ABC):
    """Abstract interface for data storage."""

    @abstractmethod
    async def save(self, entity_type: str, id: UUID, data: dict[str, Any]) -> None:
        """Save an entity."""
        pass

    @abstractmethod
    async def load(self, entity_type: str, id: UUID) -> Optional[dict[str, Any]]:
        """Load an entity by ID."""
        pass

    @abstractmethod
    async def delete(self, entity_type: str, id: UUID) -> bool:
        """Delete an entity."""
        pass

    @abstractmethod
    async def list_all(self, entity_type: str) -> list[dict[str, Any]]:
        """List all entities of a type."""
        pass

    @abstractmethod
    async def exists(self, entity_type: str, id: UUID) -> bool:
        """Check if an entity exists."""
        pass


class JsonFileStorage(StorageInterface):
    """JSON file-based storage implementation."""

    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self._ensure_directories()

    def _ensure_directories(self) -> None:
        """Ensure all required directories exist."""
        directories = ["sessions", "councils", "templates", "templates/presets"]
        for dir_name in directories:
            (self.base_dir / dir_name).mkdir(parents=True, exist_ok=True)

    def _get_path(self, entity_type: str, id: UUID) -> Path:
        """Get the file path for an entity."""
        return self.base_dir / entity_type / f"{id}.json"

    async def save(self, entity_type: str, id: UUID, data: dict[str, Any]) -> None:
        """Save an entity to a JSON file."""
        path = self._get_path(entity_type, id)
        path.parent.mkdir(parents=True, exist_ok=True)

        # Convert UUID objects to strings for JSON serialization
        serializable_data = self._make_serializable(data)

        # Write to temp file first, then rename for atomicity
        temp_path = path.with_suffix(".tmp")
        with open(temp_path, "w") as f:
            json.dump(serializable_data, f, indent=2, default=str)
        temp_path.rename(path)

    async def load(self, entity_type: str, id: UUID) -> Optional[dict[str, Any]]:
        """Load an entity from a JSON file."""
        path = self._get_path(entity_type, id)
        if not path.exists():
            return None

        with open(path) as f:
            return json.load(f)

    async def delete(self, entity_type: str, id: UUID) -> bool:
        """Delete an entity's JSON file."""
        path = self._get_path(entity_type, id)
        if path.exists():
            path.unlink()
            return True
        return False

    async def list_all(self, entity_type: str) -> list[dict[str, Any]]:
        """List all entities of a type."""
        dir_path = self.base_dir / entity_type
        if not dir_path.exists():
            return []

        entities = []
        for file_path in dir_path.glob("*.json"):
            with open(file_path) as f:
                entities.append(json.load(f))

        return entities

    async def exists(self, entity_type: str, id: UUID) -> bool:
        """Check if an entity's file exists."""
        return self._get_path(entity_type, id).exists()

    def _make_serializable(self, obj: Any) -> Any:
        """Recursively convert objects to JSON-serializable types."""
        if isinstance(obj, dict):
            return {k: self._make_serializable(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._make_serializable(v) for v in obj]
        elif isinstance(obj, UUID):
            return str(obj)
        elif hasattr(obj, "model_dump"):
            return self._make_serializable(obj.model_dump())
        elif hasattr(obj, "isoformat"):
            return obj.isoformat()
        return obj
