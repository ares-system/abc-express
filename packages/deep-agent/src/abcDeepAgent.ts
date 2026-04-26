import { ChatAnthropic } from '@langchain/anthropic';
import { createDeepAgent, type DeepAgent } from 'deepagents';
import { HumanMessage } from '@langchain/core/messages';

import { clearSkillInjectCache, loadAbcSkillInject } from './loadSkillInject.js';

const ABC_LOGISTICS_BASE = `You are ABC Express logistics AI (JavaScript Deep Agent).
You help with operational questions: shipments, routes, vehicles, and branches.
Be concise. Use built-in planning and file tools when multi-step work is needed; for simple questions, answer directly.`;

function buildAbcLogisticsSystem(): string {
  const extra = loadAbcSkillInject();
  if (!extra.trim()) {
    return ABC_LOGISTICS_BASE;
  }
  return `${ABC_LOGISTICS_BASE}

---

${extra}`;
}

export type CreateAbcDeepAgentOptions = {
  apiKey: string;
  model?: string;
  /** e.g. https://api.anthropic.com or a compatible proxy (see ANTHROPIC_BASE_URL) */
  anthropicApiUrl?: string;
  temperature?: number;
};

export type AbcSessionContext = {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  branchName?: string;
};

let cached: DeepAgent | null = null;
let cacheKey = '';

/**
 * Build (or return cached) Deep Agent for ABC Express, backed by Anthropic.
 */
export function getAbcDeepAgent(options: CreateAbcDeepAgentOptions): DeepAgent {
  const { apiKey, model = 'claude-sonnet-4-20250514', anthropicApiUrl, temperature = 0.2 } = options;
  const key = `${apiKey.slice(0, 8)}:${model}:${anthropicApiUrl ?? ''}`;

  if (cached && cacheKey === key) {
    return cached;
  }

  const llm = new ChatAnthropic({
    apiKey,
    model,
    temperature,
    ...(anthropicApiUrl ? { anthropicApiUrl } : {}),
  });

  const agent = createDeepAgent({
    model: llm,
    systemPrompt: buildAbcLogisticsSystem(),
    name: 'abc_express_deep_agent',
  });

  cached = agent;
  cacheKey = key;
  return agent;
}

export function resetAbcDeepAgentCache() {
  cached = null;
  cacheKey = '';
  clearSkillInjectCache();
}

/**
 * Run one agent turn. Optional `context` is prepended to the user message (not persisted in system prompt).
 */
export async function invokeAbcDeepAgent(
  options: CreateAbcDeepAgentOptions,
  input: { message: string; threadId?: string; context?: AbcSessionContext },
) {
  const agent = getAbcDeepAgent(options);
  const body =
    input.context && Object.keys(input.context).length > 0
      ? `Session context: ${JSON.stringify(input.context)}\n\nUser: ${input.message}`
      : input.message;

  const message = new HumanMessage(body);

  return agent.invoke(
    { messages: [message] },
    {
      configurable: { thread_id: input.threadId ?? `abc-${Date.now()}` },
    } as { configurable: { thread_id: string } },
  );
}
