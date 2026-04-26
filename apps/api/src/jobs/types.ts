// ============================================
// ABC Express AIP — Job payloads (queue + worker)
// ============================================

/** BullMQ job name (single processor entry for all AIP jobs). */
export const AIP_JOB_NAME = 'aip.task' as const;

export const AIP_JOB_KINDS = ['ping', 'recompute_ontology_cache', 'pipeline_transform'] as const;
export type AipJobKind = (typeof AIP_JOB_KINDS)[number];

export type AipJobPayload =
  | { kind: 'ping'; payload?: Record<string, unknown> }
  | { kind: 'recompute_ontology_cache'; payload?: Record<string, unknown> }
  | {
      kind: 'pipeline_transform';
      /** e.g. classify, summarize, entity_extract — LLM wiring comes later */
      transform: string;
      entityType: string;
      entityId: string;
      /** Source document id, S3 key, or raw text ref */
      sourceRef?: string;
      metadata?: Record<string, unknown>;
    };
