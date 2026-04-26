"""Deep Agents (LangGraph) — logistics decision graph via create_deep_agent."""

from __future__ import annotations

import json
import logging
import uuid
from dataclasses import dataclass
from typing import Any, AsyncIterator, Literal, cast

from deepagents import create_deep_agent
from langchain_anthropic import ChatAnthropic
from langgraph.graph.state import CompiledStateGraph
from pydantic import BaseModel, Field

from src.agents.sandbox_backend import get_sandbox_backend
from src.config import Settings, get_settings
from src.skill_catalog import build_decision_system

logger = logging.getLogger(__name__)

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

DECISION_SYSTEM = """You are ABC Express logistics AI. You receive a decision_type and a JSON "context" object.
Analyze the context and return a single recommendation.

Use the built-in tools (todos, files, execute when sandbox is available) only if you need scratch space.
Your final output must match the structured response schema. Be concise."""


class LogisticsDecisionOutput(BaseModel):
    """Structured final answer from the agent."""

    title: str = Field(description="Short display title for this recommendation")
    description: str = Field(description="Plain-language summary a dispatcher can act on")
    confidence: float = Field(ge=0.0, le=1.0, description="0–1 confidence in this recommendation")
    reasoning: str = Field(description="Why you recommend this, key factors")
    recommended_actions: list[str] = Field(
        default_factory=list,
        description="Concrete next steps (e.g. assign vehicle, re-quote, notify client)",
    )


class MissingApiKeyError(ValueError):
    """Raised when ANTHROPIC_API_KEY is missing."""


@dataclass
class _GraphHolder:
    graph: CompiledStateGraph[Any, Any, Any, Any] | None = None


_holder = _GraphHolder()
# Separate graphs when DecisionAgent(model=...) overrides the default model.
_override_graphs: dict[str, CompiledStateGraph[Any, Any, Any, Any]] = {}


def _build_graph(settings: Settings) -> CompiledStateGraph[Any, Any, Any, Any]:
    if not (settings.anthropic_api_key or "").strip():
        raise MissingApiKeyError(
            "ANTHROPIC_API_KEY is not set. Add it to the environment for the AI service."
        )

    model_kw: dict[str, Any] = {
        "model": settings.anthropic_model,
        "api_key": settings.anthropic_api_key,
        "temperature": settings.temperature,
        "max_tokens": settings.max_tokens,
    }
    if settings.anthropic_base_url:
        model_kw["base_url"] = settings.anthropic_base_url

    model = ChatAnthropic(**model_kw)
    backend = get_sandbox_backend(settings)
    if backend is not None:
        logger.info("Deep agent using sandbox backend (provider=%s)", settings.sandbox_provider)

    return create_deep_agent(
        model=model,
        system_prompt=build_decision_system(DECISION_SYSTEM),
        backend=backend,
        response_format=LogisticsDecisionOutput,
        name="abc_logistics_decision",
    )


def get_decision_graph(settings: Settings | None = None) -> CompiledStateGraph[Any, Any, Any, Any]:
    """Singleton compiled graph for the process (rebuild on process restart / deploy)."""
    if _holder.graph is None:
        s = settings or get_settings()
        _holder.graph = _build_graph(s)
    return _holder.graph


def _get_override_graph(model_name: str) -> CompiledStateGraph[Any, Any, Any, Any]:
    if model_name not in _override_graphs:
        s = get_settings().model_copy(update={"anthropic_model": model_name})
        _override_graphs[model_name] = _build_graph(s)
    return _override_graphs[model_name]


def reset_decision_graph() -> None:
    """Clear cached graph (tests / reload)."""
    _holder.graph = None
    _override_graphs.clear()


def _extract_structured(
    result: dict[str, Any],
) -> LogisticsDecisionOutput:
    raw = result.get("structured_response")
    if raw is None:
        raise RuntimeError("Agent completed without structured_response; check model / response_format support.")
    if isinstance(raw, LogisticsDecisionOutput):
        return raw
    if isinstance(raw, BaseModel):
        return LogisticsDecisionOutput.model_validate(raw.model_dump())
    if isinstance(raw, dict):
        return LogisticsDecisionOutput.model_validate(raw)
    raise RuntimeError(f"Unexpected structured_response type: {type(raw)}")


class DecisionAgent:
    """Logistics decision agent backed by `create_deep_agent` (planning, tools, structured output)."""

    def __init__(self, model: str | None = None) -> None:
        self.model = model
        self._settings = get_settings()
        if model:
            self._settings = self._settings.model_copy(update={"anthropic_model": model})

    def _graph(self) -> CompiledStateGraph[Any, Any, Any, Any]:
        if self.model:
            return _get_override_graph(self.model)
        return get_decision_graph()

    async def generate_decision(
        self,
        decision_type: DecisionType,
        context: dict[str, Any],
    ) -> dict[str, Any]:
        payload = json.dumps(
            {"decision_type": decision_type, "context": context},
            default=str,
        )
        user_message = f"Propose a logistics decision for the following input:\n{payload}"

        graph = self._graph()
        thread_id = f"decision-{uuid.uuid4()}"
        try:
            result = await graph.ainvoke(
                {"messages": [{"role": "user", "content": user_message}]},
                config={"configurable": {"thread_id": thread_id}},
            )
        except MissingApiKeyError:
            raise
        except Exception:
            if not (self._settings.anthropic_api_key or "").strip():
                raise MissingApiKeyError(
                    "ANTHROPIC_API_KEY is not set. Add it to the environment for the AI service."
                ) from None
            raise

        result_dict = cast(dict[str, Any], result)
        out = _extract_structured(result_dict)
        rec_id = f"dec_{decision_type.lower()}_{context.get('shipmentId', 'unknown')}"

        return {
            "id": rec_id,
            "type": decision_type,
            "status": "AI_RECOMMENDED",
            "title": out.title,
            "description": out.description,
            "confidence": out.confidence,
            "reasoning": out.reasoning,
            "actions": ["approve", "override", "reject"],
            "metadata": {
                "model": self._settings.anthropic_model,
                "recommended_actions": out.recommended_actions,
                "threadId": thread_id,
            },
        }

    async def stream_reasoning(
        self,
        decision_type: DecisionType,
        context: dict[str, Any],
    ) -> AsyncIterator[dict[str, Any]]:
        """Stream coarse progress from the graph (updates mode)."""
        payload = json.dumps(
            {"decision_type": decision_type, "context": context},
            default=str,
        )
        user_message = f"Propose a logistics decision for the following input:\n{payload}"
        graph = self._graph()
        thread_id = f"decision-stream-{uuid.uuid4()}"
        config: dict[str, Any] = {"configurable": {"thread_id": thread_id}}
        n = 0.0
        try:
            async for chunk in graph.astream(
                {"messages": [{"role": "user", "content": user_message}]},
                config,
                stream_mode="updates",
            ):
                n = min(0.95, n + 0.12)
                keys = list(chunk.keys()) if isinstance(chunk, dict) else ["update"]
                yield {"step": "agent_update", "progress": n, "keys": keys}
            yield {"step": "finalizing", "progress": 1.0}
        except Exception as e:
            logger.exception("stream_reasoning failed: %s", e)
            yield {"step": "error", "progress": 1.0, "message": str(e)}


def create_route_optimization_agent() -> DecisionAgent:
    return DecisionAgent(model="claude-sonnet-4-20250514")


def create_pricing_agent() -> DecisionAgent:
    return DecisionAgent(model="claude-sonnet-4-20250514")


def create_capacity_agent() -> DecisionAgent:
    return DecisionAgent(model="claude-sonnet-4-20250514")


__all__ = [
    "DecisionAgent",
    "DecisionType",
    "MissingApiKeyError",
    "LogisticsDecisionOutput",
    "get_decision_graph",
    "reset_decision_graph",
    "create_route_optimization_agent",
    "create_pricing_agent",
    "create_capacity_agent",
]
