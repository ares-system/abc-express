// ============================================
// ABC Express AIP — Prisma Client Export
// ============================================

import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load env before Prisma reads DATABASE_URL (route modules may import this before apps/api config).
const _clientDir = path.dirname(fileURLToPath(import.meta.url));
for (const rel of ['../../../../.env', '../../../.env', '../../.env'] as const) {
  const p = path.join(_clientDir, rel);
  if (existsSync(p)) {
    dotenv.config({ path: p });
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { PrismaClient };
export * from '@prisma/client';
