// ============================================
// BullMQ queue — producer side (API enqueues here)
// ============================================

import { Queue } from 'bullmq';
import { getRedisConnection } from './redisConnection.js';

const QUEUE_NAME = 'aip-jobs';

let queue: Queue | null = null;

export function getAipQueue(): Queue {
  if (!queue) {
    queue = new Queue(QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 500 },
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    });
  }
  return queue;
}

export { QUEUE_NAME };
