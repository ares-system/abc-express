// ============================================
// Standalone worker process (no HTTP server)
// Usage: pnpm --filter @abc/api worker
// Requires Redis at REDIS_URL
// ============================================

import { config } from './config.js';
import { logger } from './utils/logger.js';
import { startAipWorker, stopAipWorker } from './jobs/worker.js';
import { closeRedisConnection } from './jobs/redisConnection.js';

logger.info(`Starting AIP job worker (env=${config.nodeEnv})`);

startAipWorker();

const shutdown = async (signal: string) => {
  logger.info(`${signal} received, closing worker...`);
  await stopAipWorker();
  await closeRedisConnection();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
