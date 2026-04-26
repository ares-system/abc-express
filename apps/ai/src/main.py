"""ABC Express AI Service.

FastAPI-based microservice that powers the AI decision engine using Deep Agents
(`create_deep_agent` from the `deepagents` package on LangGraph).
Handles route optimization, pricing recommendations, and operational insights.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings

from .routes import decisions, health, ontology, websocket


class Settings(BaseSettings):
    """Application settings."""

    app_name: str = "abc-ai-service"
    debug: bool = False
    api_host: str = "0.0.0.0"
    api_port: int = 3334
    cors_origins: list[str] = ["http://localhost:3000"]
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/abcexpress"
    redis_url: str = "redis://localhost:6379/0"
    anthropic_api_key: str = ""  # Set via env ANTHROPIC_API_KEY
    anthropic_model: str = "claude-3-5-sonnet-20241022"
    max_tokens: int = 4096
    temperature: float = 0.1

    class Config:
        env_file = ".env"
        env_fileEncoding = "utf-8"


settings = Settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    app.state.settings = settings
    yield
    # Shutdown
    pass


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        description="ABC Express AI Decision Service (Deep Agents / LangGraph)",
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routes
    app.include_router(health.router, tags=["Health"])
    app.include_router(decisions.router, prefix="/decisions", tags=["Decisions"])
    app.include_router(ontology.router, prefix="/ontology", tags=["Ontology"])
    app.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])

    return app


app = create_app()