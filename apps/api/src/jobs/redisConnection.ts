// ============================================
// Shared Redis connection for BullMQ (must set maxRetriesPerRequest: null)
// ============================================

import IORedis from 'ioredis';
import { config } from '../config.js';

let shared: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!shared) {
    shared = new IORedis(config.redis.url, {
      maxRetriesPerRequest: null,
    });
  }
  return shared;
}

export function closeRedisConnection(): Promise<void> {
  if (!shared) return Promise.resolve();
  const c = shared;
  shared = null;
  return c.quit().then(() => undefined);
}
