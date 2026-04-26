"""AI Decision endpoints."""

from typing import Any, Literal, cast
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone

from src.agents.decision import DecisionAgent, DecisionType as AgentDecisionType, MissingApiKeyError


router = APIRouter()


# ─── Types ──────────────────────────────────────────────────

DecisionType = Literal[
    "ROUTE_OPTIMIZATION",
    "PRICING_ADJUSTMENT",
    "CAPACITY_ALLOCATION",
    "DELIVERY_PRIORITY",
    "RISK_ALERT",
    "CONSOLIDATION",
    "VENDOR_SELECTION",
    "CUSTOMER_OFFER",
]

DecisionStatus = Literal[
    "AI_GENERATED",
    "AI_RECOMMENDED",
    "PENDING_HUMAN_REVIEW",
    "APPROVED",
    "OVERRIDE_ACCEPTED",
    "REJECTED",
    "EXPIRED",
]


# ─── Models ──────────────────────────────────────────────

class DecisionRequest(BaseModel):
    """Request for AI decision."""

    type: DecisionType
    context: dict[str, Any]
    priority: int = 5


class DecisionResponse(BaseModel):
    """AI Decision response."""

    id: str
    type: DecisionType
    status: DecisionStatus
    title: str
    description: str
    confidence: float
    reasoning: str
    actions: list[str]
    context: dict[str, Any]
    metadata: dict[str, Any]
    createdAt: str
    expiresAt: str


class DecisionActionRequest(BaseModel):
    """Action on AI decision."""

    action: Literal["approve", "override", "reject"]
    notes: str = ""


# ─── Routes ────────────────────────────────────────────

@router.get("", response_model=list[DecisionResponse])
async def list_decisions(
    status: DecisionStatus | None = None,
    decision_type: DecisionType | None = None,
    limit: int = 20,
    page: int = 1,
) -> list[DecisionResponse]:
    """List AI decisions."""
    # TODO: Query database
    return []


@router.get("/{decision_id}", response_model=DecisionResponse)
async def get_decision(decision_id: str) -> DecisionResponse:
    """Get a specific AI decision."""
    # TODO: Query database
    raise HTTPException(status_code=404, detail="Decision not found")


@router.post("/generate", response_model=DecisionResponse)
async def generate_decision(request: DecisionRequest) -> DecisionResponse:
    """Generate a new AI decision using Deep Agents (create_deep_agent)."""
    agent = DecisionAgent()
    try:
        raw = await agent.generate_decision(
            cast(AgentDecisionType, request.type),
            request.context,
        )
    except MissingApiKeyError as e:
        raise HTTPException(
            status_code=503,
            detail="AI service is not configured (missing ANTHROPIC_API_KEY).",
        ) from e

    now = datetime.now(timezone.utc)
    expires = now + timedelta(hours=24)
    return DecisionResponse(
        id=raw["id"],
        type=request.type,
        status="AI_RECOMMENDED",
        title=raw["title"],
        description=raw["description"],
        confidence=raw["confidence"],
        reasoning=raw["reasoning"],
        actions=raw["actions"],
        context=request.context,
        metadata=cast(dict[str, Any], raw.get("metadata", {})),
        createdAt=now.isoformat().replace("+00:00", "Z"),
        expiresAt=expires.isoformat().replace("+00:00", "Z"),
    )


@router.post("/{decision_id}/action")
async def action_decision(
    decision_id: str,
    request: DecisionActionRequest,
) -> DecisionResponse:
    """Approve, override, or reject an AI decision."""
    # TODO: Update database with human action
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get("/{decision_id}/reasoning")
async def get_decision_reasoning(decision_id: str) -> dict[str, Any]:
    """Get detailed reasoning for a decision."""
    # TODO: Return full reasoning chain
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get("/stats/summary")
async def decision_stats() -> dict[str, Any]:
    """Get aggregate decision statistics."""
    # TODO: Query database
    return {
        "total": 0,
        "pending": 0,
        "approved": 0,
        "overridden": 0,
        "rejected": 0,
        "avgConfidence": 0.0,
    }