// ============================================
// Enqueue jobs from API or other services
// ============================================

import { getAipQueue } from './queue.js';
import { AIP_JOB_NAME } from './types.js';
import type { AipJobPayload } from './types.js';

export async function enqueueAipJob(
  data: AipJobPayload,
  opts?: { delay?: number; jobId?: string }
): Promise<{ id: string }> {
  const queue = getAipQueue();
  const job = await queue.add(AIP_JOB_NAME, data, {
    delay: opts?.delay,
    jobId: opts?.jobId,
  });
  return { id: String(job.id) };
}
