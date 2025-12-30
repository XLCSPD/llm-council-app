"""Orchestrator configuration from environment variables."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment."""

    # Supabase
    supabase_url: str
    supabase_service_role_key: str

    # OpenRouter
    openrouter_api_key: str
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # App settings
    app_name: str = "LLM Council Orchestrator"
    debug: bool = False

    # Execution settings
    max_concurrent_models: int = 10
    default_timeout_seconds: int = 120

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
