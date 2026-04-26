// ============================================
// ABC Express AIP — Background job API (enqueue + inspect)
// ============================================

import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { sendSuccess, sendNotFound } from '../utils/response.js';
import { enqueueAipJob } from '../jobs/enqueue.js';
import { getAipQueue } from '../jobs/queue.js';

const router = Router();

const jobPayloadSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('ping'), payload: z.record(z.unknown()).optional() }),
  z.object({ kind: z.literal('recompute_ontology_cache'), payload: z.record(z.unknown()).optional() }),
  z.object({
    kind: z.literal('pipeline_transform'),
    transform: z.string().min(1).max(64),
    entityType: z.string().min(1).max(64),
    entityId: z.string().uuid(),
    sourceRef: z.string().max(500).optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
]);

const enqueueRequestSchema = z.intersection(
  z.object({ delay: z.coerce.number().int().min(0).max(7 * 24 * 60 * 60 * 1000).optional() }),
  jobPayloadSchema
);

/**
 * POST /api/jobs
 * Enqueue a background job (Redis + BullMQ). Requires Redis and a running worker.
 */
router.post('/', authenticate, authorize('ADMIN', 'OPS_MANAGER'), validateBody(enqueueRequestSchema), async (req, res, next) => {
  try {
    const parsed = req.body as z.infer<typeof enqueueRequestSchema>;
    const { delay, ...data } = parsed;
    const { id } = await enqueueAipJob(data, delay !== undefined ? { delay } : undefined);
    sendSuccess(res, { jobId: id, status: 'queued' }, 202);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/jobs/:jobId
 */
router.get('/:jobId', authenticate, authorize('ADMIN', 'OPS_MANAGER', 'DISPATCHER'), async (req, res, next) => {
  try {
    const jobId = String(req.params.jobId);
    const queue = getAipQueue();
    const job = await queue.getJob(jobId);
    if (!job) {
      sendNotFound(res, 'Job');
      return;
    }
    const state = await job.getState();
    sendSuccess(res, {
      id: job.id,
      name: job.name,
      data: job.data,
      state,
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
      failedReason: job.failedReason,
      returnvalue: job.returnvalue,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
