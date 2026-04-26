"""Load shared ABC Express skill-registry inject text (packages/ai-skills/inject.md)."""

from __future__ import annotations

import os
from pathlib import Path

_inject_cache: str | None = None


def _find_repo_root() -> Path:
    here = Path(__file__).resolve()
    for p in (here, *here.parents):
        if (p / "packages" / "ai-skills" / "inject.md").is_file():
            return p
    # apps/ai/src/... → repo root
    return Path(__file__).resolve().parents[3]


def load_abc_skill_inject() -> str:
    """Return contents of packages/ai-skills/inject.md, or empty if disabled / missing."""
    global _inject_cache
    if os.environ.get("ABC_AI_SKILLS_INJECT", "1").lower() in ("0", "false", "no"):
        return ""
    if _inject_cache is not None:
        return _inject_cache
    path = _find_repo_root() / "packages" / "ai-skills" / "inject.md"
    if not path.is_file():
        _inject_cache = (
            "Use logistics-first answers; for trade/customs, note conservative vs aggressive angles. "
            "Full catalog: packages/ai-skills/skill-bundles.md"
        )
        return _inject_cache
    _inject_cache = path.read_text(encoding="utf-8")
    return _inject_cache


def clear_skill_inject_cache() -> None:
    global _inject_cache
    _inject_cache = None


def build_decision_system(base: str) -> str:
    extra = load_abc_skill_inject().strip()
    if not extra:
        return base
    return f"""{base}

---

{extra}"""
