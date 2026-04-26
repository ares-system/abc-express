// ============================================
// ABC Express AIP — API Configuration
// Extended with security module settings.
// ============================================

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Resolve from this file (not cwd) so DATABASE_URL and JWT work from monorepo root when turbo/cwd vary.
const _configDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(_configDir, '../../../.env') });
dotenv.config({ path: path.join(_configDir, '../../.env') });

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isDev = nodeEnv === 'development';

export const config = {
  port: parseInt(process.env.API_PORT ?? '4000', 10),
  nodeEnv,
  isDev,

  // ─── Legacy JWT (kept for migration; auth routes still
  //     issue HS256 tokens in dev until ES256 keys are set) ──
  jwt: {
    secret: process.env.JWT_SECRET ?? 'abc-express-dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  // ─── ES256 JWT (production auth) ──────────────────────────
  jwtEs256: {
    privateKey: process.env.JWT_ES256_PRIVATE_KEY ?? '',
    publicKey: process.env.JWT_ES256_PUBLIC_KEY ?? '',
    issuer: process.env.JWT_ISSUER ?? 'abc-express-aip',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '1h',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },

  cors: {
    origins: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  },

  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },

  // ─── Global rate limit (fallback; division limits override) ─
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
  },

  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100,
  },

  // ─── Encryption ───────────────────────────────────────────
  encryption: {
    masterKey: process.env.ENCRYPTION_MASTER_KEY ?? '',
    /** Set to true to enable Prisma field-level encryption */
    enabled: process.env.ENCRYPTION_ENABLED === 'true',
  },

  // ─── TLS ──────────────────────────────────────────────────
  tls: {
    enabled: process.env.TLS_ENABLED === 'true',
    certPath: process.env.TLS_CERT_PATH ?? '/etc/certs/tls.crt',
    keyPath: process.env.TLS_KEY_PATH ?? '/etc/certs/tls.key',
    caPath: process.env.TLS_CA_PATH ?? '',
  },

  // ─── Vault ────────────────────────────────────────────────
  vault: {
    enabled: process.env.VAULT_ENABLED === 'true',
    address: process.env.VAULT_ADDR ?? 'https://vault.abc-express.internal:8200',
    token: process.env.VAULT_TOKEN ?? '',
    kvMount: process.env.VAULT_KV_MOUNT ?? 'secret',
    pathPrefix: process.env.VAULT_PATH_PREFIX ?? 'abc-express',
    namespace: process.env.VAULT_NAMESPACE ?? '',
  },

  // ─── HSTS ─────────────────────────────────────────────────
  hsts: {
    enabled: !isDev,
    maxAge: 63_072_000, // 2 years
    includeSubDomains: true,
    preload: true,
  },

  // ─── Deep Agent (JS) — @abc/deep-agent + Anthropic ─────────
  deepAgent: {
    enabled: process.env.DEEP_AGENT_ENABLED === 'true',
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
    anthropicApiUrl: process.env.ANTHROPIC_BASE_URL?.trim() || undefined,
  },
} as const;
