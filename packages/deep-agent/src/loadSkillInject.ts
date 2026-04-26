import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Minimal fallback if inject.md is missing (e.g. mis-packaged build). */
const FALLBACK_INJECT = `Use logistics-first, operations-focused answers. For trade/customs, note conservative vs aggressive compliance angles; for finance and audit, separate controls from advice. See packages/ai-skills/skill-bundles.md in the monorepo.`;

/**
 * Path to `packages/ai-skills/inject.md` from both `src/` and `dist/` layouts.
 */
function resolveInjectPath(): string | null {
  const candidates = [
    join(__dirname, '../../ai-skills/inject.md'),
    join(__dirname, '../ai-skills/inject.md'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      return p;
    }
  }
  return null;
}

let cached: string | null = null;

export function loadAbcSkillInject(): string {
  if (process.env.ABC_AI_SKILLS_INJECT === '0' || process.env.ABC_AI_SKILLS_INJECT === 'false') {
    return '';
  }
  if (cached !== null) {
    return cached;
  }
  const path = resolveInjectPath();
  cached = path ? readFileSync(path, 'utf8') : FALLBACK_INJECT;
  return cached;
}

export function clearSkillInjectCache(): void {
  cached = null;
}
