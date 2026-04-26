// ============================================
// ABC Express — LangChain JavaScript Deep Agent
// POST /api/ai/deep-agent  (ANTHROPIC_API_KEY + DEEP_AGENT_ENABLED)
// ============================================

import { Router } from 'express';
import { invokeAbcDeepAgent } from '@abc/deep-agent';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { deepAgentInvokeSchema } from '../schemas.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * POST /api/ai/deep-agent
 * Run one turn of the in-process Deep Agent (planning, filesystem, subagents) via Anthropic.
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'OPS_MANAGER', 'DISPATCHER', 'FINANCE_MANAGER'),
  validateBody(deepAgentInvokeSchema),
  async (req, res, next) => {
    try {
      if (!config.deepAgent.enabled) {
        sendError(
          res,
          503,
          'Deep Agent is disabled. Set DEEP_AGENT_ENABLED=true and ANTHROPIC_API_KEY in the environment.',
        );
        return;
      }
      if (!config.deepAgent.apiKey.trim()) {
        sendError(res, 503, 'ANTHROPIC_API_KEY is not set.');
        return;
      }

      const { message, threadId } = req.body as { message: string; threadId?: string };
      const u = req.user!;

      const result = await invokeAbcDeepAgent(
        {
          apiKey: config.deepAgent.apiKey,
          model: config.deepAgent.model,
          anthropicApiUrl: config.deepAgent.anthropicApiUrl,
        },
        {
          message,
          threadId: threadId ?? `user-${u.userId}-${Date.now()}`,
          context: {
            userId: u.userId,
            userEmail: u.email,
            userRole: u.role,
          },
        },
      );

      sendSuccess(res, { result }, 200, 'Deep Agent completed');
    } catch (err) {
      logger.error('[deep-agent] invoke failed', err);
      next(err);
    }
  },
);

export default router;
