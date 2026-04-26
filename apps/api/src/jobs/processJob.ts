// ============================================
// Execute one job payload (shared by Worker)
// ============================================

import { clearOntologyFunctionCache } from '../services/ontologyFunctionHandlers.js';
import { logger } from '../utils/logger.js';
import type { AipJobPayload } from './types.js';

export async function processAipJobPayload(data: AipJobPayload): Promise<unknown> {
  switch (data.kind) {
    case 'ping':
      return { ok: true, at: new Date().toISOString(), echo: data.payload ?? {} };
    case 'recompute_ontology_cache':
      clearOntologyFunctionCache();
      return { cleared: true, at: new Date().toISOString() };
    case 'pipeline_transform':
      logger.info('pipeline_transform (placeholder — attach LLM / rules here)', {
        transform: data.transform,
        entityType: data.entityType,
        entityId: data.entityId,
        sourceRef: data.sourceRef,
      });
      return {
        status: 'accepted',
        message: 'Transform queued for future LLM integration; no side effects yet.',
        transform: data.transform,
        entityType: data.entityType,
        entityId: data.entityId,
      };
    default: {
      const _x: never = data;
      return _x;
    }
  }
}
