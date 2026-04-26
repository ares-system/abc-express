"""Health check endpoints."""

from fastapi import APIRouter, Response
from pydantic import BaseModel


router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    service: str
    version: str


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        service="abc-ai-service",
        version="0.1.0",
    )


@router.get("/health/ready")
async def readiness_check() -> Response:
    """Readiness check for Kubernetes."""
    # TODO: Check database and Redis connectivity
    return Response(status_code=200)


@router.get("/health/live")
async def liveness_check() -> Response:
    """Liveness check for Kubernetes."""
    return Response(status_code=200)