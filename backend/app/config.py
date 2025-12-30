"""Application configuration and environment settings."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API Settings
    app_name: str = "LLM Council API"
    debug: bool = False

    # OpenRouter API
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # Storage
    data_dir: Path = Path("data")

    # CORS
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Default Models for Council
    default_models: list[str] = [
        "openai/gpt-4o",
        "anthropic/claude-3.5-sonnet",
        "google/gemini-2.0-flash-exp",
        "meta-llama/llama-3.3-70b-instruct",
    ]

    # Chairman model for synthesis
    chairman_model: str = "anthropic/claude-3.5-sonnet"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    @property
    def sessions_dir(self) -> Path:
        return self.data_dir / "sessions"

    @property
    def councils_dir(self) -> Path:
        return self.data_dir / "councils"

    @property
    def templates_dir(self) -> Path:
        return self.data_dir / "templates"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
