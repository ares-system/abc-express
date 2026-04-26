// ============================================
// BullMQ Worker — run in separate process: pnpm --filter @abc/api worker
// ============================================

import { Worker } from 'bullmq';
import { getRedisConnection } from './redisConnection.js';
import { processAipJobPayload } from './processJob.js';
import type { AipJobPayload } from './types.js';
import { QUEUE_NAME } from './queue.js';
import { logger } from '../utils/logger.js';

let worker: Worker | null = null;

export function startAipWorker(): Worker {
  if (worker) {
    return worker;
  }
  worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const data = job.data as AipJobPayload;
      return processAipJobPayload(data);
    },
    {
      connection: getRedisConnection(),
      concurrency: parseInt(process.env.WORKER_CONCURRENCY ?? '5', 10),
    }
  );

  worker.on('completed', (job, result) => {
    logger.debug(`Job ${job.id} completed`, { returnvalue: result });
  });
  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed`, { err: err.message, stack: err.stack });
  });
  worker.on('error', (err) => {
    logger.error('Worker error', { err: err.message });
  });

  logger.info(`AIP job worker listening on queue "${QUEUE_NAME}"`);
  return worker;
}

export async function stopAipWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
}
