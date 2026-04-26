// ============================================
// ABC Express AIP — Read-only ontology + function invoke
// ============================================

import { Router } from 'express';
import { ONTOLOGY_MANIFEST, type FunctionDefinition } from '@abc/ontology-engine';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { z } from 'zod';
import { sendSuccess, sendError } from '../utils/response.js';
import { invokeOntologyFunction } from '../services/ontologyFunctionHandlers.js';

const router = Router();

const invokeFunctionSchema = z.object({
  params: z.record(z.unknown()).optional().default({}),
});

const ontologyFunctions = ONTOLOGY_MANIFEST.functions;

/**
 * GET /api/ontology
 * Full manifest (object types, links, action types, functions)
 */
router.get('/', authenticate, authorize('ADMIN', 'OPS_MANAGER', 'DISPATCHER', 'VIEWER', 'BRANCH_STAFF', 'FINANCE_MANAGER'), async (_req, res, next) => {
  try {
    sendSuccess(res, ONTOLOGY_MANIFEST);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/ontology/functions
 * List function definitions only (lightweight for agents)
 */
router.get('/functions', authenticate, authorize('ADMIN', 'OPS_MANAGER', 'DISPATCHER', 'VIEWER', 'FINANCE_MANAGER'), async (_req, res, next) => {
  try {
    sendSuccess(res, { functions: ontologyFunctions, version: ONTOLOGY_MANIFEST.version });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ontology/functions/:apiName/invoke
 * Run a read-only aggregation / KPI function
 */
router.post(
  '/functions/:apiName/invoke',
  authenticate,
  authorize('ADMIN', 'OPS_MANAGER', 'DISPATCHER', 'FINANCE_MANAGER', 'BRANCH_STAFF', 'VIEWER'),
  validateBody(invokeFunctionSchema),
  async (req, res, next) => {
    try {
      const apiName = String(req.params.apiName);
      const def = ontologyFunctions.find((f: FunctionDefinition) => f.apiName === apiName);
      if (!def) {
        sendError(res, 404, `Function not in ontology: ${apiName}`);
        return;
      }
      if (!def.allowedRoles.includes(req.user!.role)) {
        sendError(res, 403, 'Role cannot invoke this function');
        return;
      }
      const params = (req.body?.params as Record<string, unknown>) ?? {};
      const result = await invokeOntologyFunction(apiName, params);
      sendSuccess(res, { apiName, result, cachedTtlHintSeconds: def.cacheTtlSeconds });
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Unknown function')) {
        sendError(res, 404, err.message);
        return;
      }
      next(err);
    }
  }
);

export default router;
