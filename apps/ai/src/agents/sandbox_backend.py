"""Optional remote sandbox backend for Deep Agents (Pattern 2: sandbox as tool)."""

from __future__ import annotations

import logging
from typing import Any

from src.config import Settings

logger = logging.getLogger(__name__)

# One sandbox per process when enabled; keeps sessions warm.
_daytona_sdk: Any = None
_daytona_sandbox: Any = None
_daytona_backend: Any = None


def get_sandbox_backend(settings: Settings) -> Any:
    """
    Return a backend for create_deep_agent(..., backend=...), or None for default in-process state.
    When None, the `execute` tool is disabled by Deep Agents (no SandboxBackendProtocol).
    """
    if not settings.sandbox_enabled:
        return None
    provider = (settings.sandbox_provider or "none").strip().lower()
    if provider in ("", "none", "off", "false", "0"):
        return None
    if provider == "daytona":
        return _get_daytona_backend()
    msg = f"Unknown sandbox_provider={settings.sandbox_provider!r} (use 'daytona' or 'none')"
    raise ValueError(msg)


def _get_daytona_backend() -> Any:
    global _daytona_sdk, _daytona_sandbox, _daytona_backend
    if _daytona_backend is not None:
        return _daytona_backend
    try:
        from daytona import Daytona
        from langchain_daytona import DaytonaSandbox
    except ImportError as e:
        raise RuntimeError(
            "sandbox_provider=daytona requires optional dependencies. "
            "Install: pip install 'abc-ai-service[sandbox]' "
            "or: pip install langchain-daytona (and the Daytona Python SDK it pulls in)."
        ) from e

    logger.info("Creating Daytona sandbox for Deep Agents")
    _daytona_sdk = Daytona()
    _daytona_sandbox = _daytona_sdk.create()
    _daytona_backend = DaytonaSandbox(sandbox=_daytona_sandbox)
    return _daytona_backend
