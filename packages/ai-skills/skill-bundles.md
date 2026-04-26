# ABC Express — skills.sh & MCP skill bundles (reference)

This document wires **ABC Express AI** (Python `apps/ai` Deep Agents and Node `packages/deep-agent` / `POST /api/ai/deep-agent`) to a curated set of [skills.sh](https://skills.sh) registries. Install in **Claude Code / Cursor** (or any client that uses Agent Skills) with the commands below. Runtime agents receive the condensed text from `packages/ai-skills/inject.md` in their system prompt.

## Registries

### anthropics/knowledge-work-plugins

- **Page:** <https://skills.sh/anthropics/knowledge-work-plugins>
- **Install:** `npx skills add anthropics/knowledge-work-plugins`
- **Use:** Broad “knowledge work” — code review, documentation, analysis, task management, dashboards, and similar.

### anthropics/financial-services-plugins

- **Page:** <https://skills.sh/anthropics/financial-services-plugins>
- **Install:** `npx skills add anthropics/financial-services-plugins`
- **Use:** Equity research, DCF, comps, 3-statement models, rates/macro, pitch decks, audit-style spreadsheet workflows.

### shopmeskills/mcp — logistics-tracking

- **Page:** <https://skills.sh/shopmeskills/mcp/logistics-tracking>
- **Install:** `npx skills add https://github.com/shopmeskills/mcp --skill logistics-tracking`
- **Runtime:** MCP server (`@shopmeagent/logistics-tracking-mcp`). Optional: `TRACK17_API_KEY` for 17Track API. HTTP deploy possible so end users do not need a key (see skills.sh page).

### personamanagmentlayer/pcl — domain experts (GitHub: pcl)

| Skill | skills.sh | Install |
|-------|-----------|--------|
| logistics-expert | <https://skills.sh/personamanagmentlayer/pcl/logistics-expert> | `npx skills add https://github.com/personamanagmentlayer/pcl --skill logistics-expert` |
| accountant-expert | <https://skills.sh/personamanagmentlayer/pcl/accountant-expert> | `npx skills add https://github.com/personamanagmentlayer/pcl --skill accountant-expert` |
| data-science-expert | <https://skills.sh/personamanagmentlayer/pcl/data-science-expert> | `npx skills add https://github.com/personamanagmentlayer/pcl --skill data-science-expert` |
| research-expert | <https://skills.sh/personamanagmentlayer/pcl/research-expert> | `npx skills add https://github.com/personamanagmentlayer/pcl --skill research-expert` |
| finops-expert | <https://skills.sh/personamanagmentlayer/pcl/finops-expert> | `npx skills add https://github.com/personamanagmentlayer/pcl --skill finops-expert` |
| audit-expert | <https://skills.sh/personamanagmentlayer/pcl/audit-expert> | `npx skills add https://github.com/personamanagmentlayer/pcl --skill audit-expert` |
| data-mesh-expert | <https://skills.sh/personamanagmentlayer/pcl/data-mesh-expert> | `npx skills add https://github.com/personamanagmentlayer/pcl --skill data-mesh-expert` |

### robdtaylor/personal-ai-infrastructure — Shippinglogistics

- **Page:** <https://skills.sh/robdtaylor/personal-ai-infrastructure/shippinglogistics>
- **Install:** `npx skills add https://github.com/robdtaylor/personal-ai-infrastructure --skill Shippinglogistics`
- **Use:** UK / US / CA shipping, customs, duties, automotive—includes required dual-perspective (conservative vs aggressive) for many trade questions.

### k-dense-ai/claude-scientific-skills

- **Page:** <https://skills.sh/k-dense-ai/claude-scientific-skills>
- **Install:** `npx skills add k-dense-ai/claude-scientific-skills`
- **Use:** Large library of scientific / academic / tool-specific skills (stats, HPC, bio, etc.).

## Environment (optional)

- **`TRACK17_API_KEY`:** For 17Track-backed MCP or API flows (see logistics-tracking).
- **Anthropic (already used by AI services):** `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ANTHROPIC_BASE_URL` — shared across `apps/ai` and the JS Deep Agent when enabled.

## Internal wiring

- **Condensed model instructions:** `packages/ai-skills/inject.md` (loaded into JS + Python agent system prompts).
- **Disable in-process inject (optional):** set `ABC_AI_SKILLS_INJECT=0` in the environment to omit the block (useful for tests or minimal prompts).
