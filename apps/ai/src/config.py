"""AI Service configuration."""

from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """AI Service settings."""

    app_name: str = "abc-ai-service"
    debug: bool = False

    # Server
    host: str = "0.0.0.0"
    port: int = 3334

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/abcexpress"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Anthropic (Deep Agents)
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-20250514"
    anthropic_base_url: str | None = None
    max_tokens: int = 4096
    temperature: float = 0.1

    # Optional remote sandbox for Deep Agents (install: pip install -e ".[sandbox]")
    # When enabled, filesystem + execute tools use the provider (e.g. Daytona).
    sandbox_enabled: bool = False
    sandbox_provider: str = "none"  # none | daytona

    # Deep Agents harness
    agent_timeout: int = 300
    max_iterations: int = 50
    planning_enabled: bool = True

    # WebSocket
    ws_heartbeat_interval: int = 30

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()