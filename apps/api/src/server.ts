// ============================================
// ABC Express AIP — Main Server Entry Point
// Express + Socket.IO + @abc/security bootstrap
// ============================================

import http from 'http';
import https from 'https';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { initWebSocket } from './websocket.js';

// ─── Security imports from @abc/security ────────────────────
import {
  // TLS 1.3
  createTlsConfig,
  hstsMiddleware,
  securityHeadersMiddleware,
  // JWT ES256
  JwtEs256Service,
  es256AuthMiddleware,
  generateEs256KeyPair,
  // Encryption
  FieldEncryptor,
  createEncryptionMiddleware,
  // Policy / RBAC
  policyEngine,
  policyMiddleware,
  divisionRateLimitMiddleware,
  // Vault
  createSecretProvider,
  type SecretProvider,
  type RateLimiterDeps,
} from '@abc/security';

import { prisma } from '@abc/db';

// ─── Route imports ──────────────────────────────────────────
import authRoutes, { setJwtService } from './routes/auth.js';
import branchRoutes from './routes/branches.js';
import clientRoutes from './routes/clients.js';
import vehicleRoutes from './routes/vehicles.js';
import shipmentRoutes from './routes/shipments.js';
import invoiceRoutes from './routes/invoices.js';
import costRoutes from './routes/costs.js';
import routeRoutes from './routes/routes.js';
import decisionRoutes from './routes/decisions.js';
import proposalRoutes from './routes/proposals.js';
import dashboardRoutes from './routes/dashboard.js';
import ontologyRoutes from './routes/ontology.js';
import jobRoutes from './routes/jobs.js';
import deepAgentRoutes from './routes/deepAgent.js';
import trackingRoutes from './routes/tracking.js';

/** In-memory Redis subset for division rate limits when no Redis client is wired. */
function createInMemoryRateLimitRedis(): RateLimiterDeps['redis'] {
  const buckets = new Map<string, { count: number; expiresAt: number }>();
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, row] of buckets) {
      if (row.expiresAt <= now) buckets.delete(key);
    }
  }, 60_000);
  cleanup.unref();
  return {
    async incr(key: string) {
      const now = Date.now();
      let b = buckets.get(key);
      if (!b || b.expiresAt <= now) {
        b = { count: 0, expiresAt: now + 3_600_000 };
        buckets.set(key, b);
      }
      b.count += 1;
      return b.count;
    },
    async expire(key: string, seconds: number) {
      const row = buckets.get(key);
      if (row) {
        row.expiresAt = Date.now() + seconds * 1000;
      }
    },
    async ttl(key: string) {
      const row = buckets.get(key);
      if (!row) return -1;
      const sec = Math.ceil((row.expiresAt - Date.now()) / 1000);
      return sec > 0 ? sec : -1;
    },
  };
}

// ─── Bootstrap ──────────────────────────────────────────────

const bootstrap = async () => {
  // ─── 1. Secret provider (Vault in prod, env in dev) ─────
  let secretProvider: SecretProvider | null = null;

  if (config.vault.enabled) {
    secretProvider = createSecretProvider({
      address: config.vault.address,
      auth: { method: 'token', token: config.vault.token },
      kvMount: config.vault.kvMount,
      pathPrefix: config.vault.pathPrefix,
      namespace: config.vault.namespace || undefined,
    });

    // Init Vault connection (authenticate + start renewal)
    if ('init' in secretProvider) {
      await secretProvider.init();
      logger.info('[security] Vault connected and authenticated');
    }
  }

  // ─── 2. JWT ES256 service ───────────────────────────────
  let jwtService: JwtEs256Service | null = null;
  let privateKey = config.jwtEs256.privateKey;
  let publicKey = config.jwtEs256.publicKey;

  // Try loading keys from Vault first
  if (secretProvider && config.vault.enabled) {
    try {
      const keys = await secretProvider.getJwtSigningKeys();
      privateKey = keys.private_key;
      publicKey = keys.public_key;
      logger.info('[security] JWT ES256 keys loaded from Vault');
    } catch {
      logger.warn('[security] JWT keys not in Vault, falling back to env');
    }
  }

  // If keys are available, init ES256; otherwise dev falls back to HS256
  if (privateKey && publicKey) {
    jwtService = new JwtEs256Service({
      privateKey,
      publicKey,
      issuer: config.jwtEs256.issuer,
      accessTtl: config.jwtEs256.accessTtl,
      refreshTtl: config.jwtEs256.refreshTtl,
    });
    await jwtService.init();
    logger.info('[security] JWT ES256 service initialized (ECDSA P-256)');

    // Wire JWT service to auth routes for token refresh
    setJwtService(jwtService);
  } else if (config.isDev) {
    logger.warn(
      '[security] No ES256 keys configured — using legacy HS256 JWT (dev only)',
    );
  } else {
    throw new Error(
      'JWT_ES256_PRIVATE_KEY and JWT_ES256_PUBLIC_KEY must be set in production',
    );
  }

  // ─── 3. Field encryption (AES-256-GCM) ─────────────────
  if (config.encryption.enabled) {
    let masterKey = config.encryption.masterKey;

    // Try loading master key from Vault
    if (secretProvider && config.vault.enabled) {
      try {
        masterKey = await secretProvider.getEncryptionMasterKey();
        logger.info('[security] Encryption master key loaded from Vault');
      } catch {
        logger.warn('[security] Master key not in Vault, using env');
      }
    }

    if (masterKey) {
      const encryptor = new FieldEncryptor({ masterKey });
      const encryptionMiddleware = createEncryptionMiddleware(encryptor);
      // Hack for Prisma v6 middleware compatibility (extensions are preferred but for now we cast to any)
      (prisma as any).$use(encryptionMiddleware);
      logger.info(
        '[security] AES-256-GCM field encryption enabled for shipment PII',
      );
    }
  }

  // ─── 4. Express app ─────────────────────────────────────
  const app = express();

  // ─── 5. HTTP or HTTPS server ────────────────────────────
  let server: http.Server | https.Server;

  if (config.tls.enabled) {
    const tlsResult = createTlsConfig({
      certPath: config.tls.certPath,
      keyPath: config.tls.keyPath,
      caPath: config.tls.caPath || undefined,
    });
    server = https.createServer(tlsResult.tlsOptions, app);
    const stopReload = tlsResult.startReloader();
    // Store cleanup fn for graceful shutdown
    (server as any).__tlsCleanup = stopReload;
    logger.info('[security] TLS 1.3 enabled with cert hot-reload');
  } else {
    server = http.createServer(app);
    if (!config.isDev) {
      logger.warn(
        '[security] TLS disabled — ensure a reverse proxy handles TLS termination',
      );
    }
  }

  // ─── 6. WebSocket ───────────────────────────────────────
  initWebSocket(server);

  // ─── 7. Global middleware chain ─────────────────────────

  // 7a. Helmet (base security headers)
  app.use(helmet({
    contentSecurityPolicy: config.isDev ? false : undefined,
  }));

  // 7b. Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
  app.use(securityHeadersMiddleware());

  // 7c. HSTS (production only)
  if (config.hsts.enabled) {
    app.use(
      hstsMiddleware({
        maxAge: config.hsts.maxAge,
        includeSubDomains: config.hsts.includeSubDomains,
        preload: config.hsts.preload,
      }),
    );
  }

  // 7d. Compression
  app.use(compression());

  // 7e. CORS
  app.use(
    cors({
      origin: config.cors.origins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    }),
  );

  // 7f. Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 7g. Global rate limiting (fallback; division limits below are stricter)
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 429,
        message: 'Too many requests, please try again later.',
      },
    },
  });
  app.use('/api/', limiter);

  // 7h. Division-aware rate limiting (ops: 500/min, finance: 200/min, etc.)
  app.use(
    '/api/',
    divisionRateLimitMiddleware({
      redis: createInMemoryRateLimitRedis(),
    }),
  );

  // 7i. Request logging
  app.use((req, _res, next) => {
    logger.http(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('user-agent')?.slice(0, 80),
    });
    next();
  });

  // ─── 8. Health check ────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'abc-express-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      security: {
        tls: config.tls.enabled,
        jwt: jwtService ? 'ES256' : 'HS256',
        encryption: config.encryption.enabled,
        vault: config.vault.enabled,
        hsts: config.hsts.enabled,
        policyEngine: 'active',
      },
    });
  });

  // ─── 9. JWKS endpoint (public keys for token validation) ─
  if (jwtService) {
    app.get('/.well-known/jwks.json', async (_req, res) => {
      try {
        const jwk = await jwtService!.exportPublicJwk();
        res.json({ keys: [jwk] });
      } catch (err) {
        res.status(500).json({ error: 'Failed to export JWKS' });
      }
    });
  }

  // ─── 10. API routes ─────────────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/branches', branchRoutes);
  app.use('/api/clients', clientRoutes);
  app.use('/api/vehicles', vehicleRoutes);
  app.use('/api/shipments', shipmentRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/costs', costRoutes);
  app.use('/api/routes', routeRoutes);
  app.use('/api/decisions', decisionRoutes);
  app.use('/api/proposals', proposalRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/ontology', ontologyRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/ai/deep-agent', deepAgentRoutes);
  app.use('/api/track', trackingRoutes);

  // ─── 11. Error handling ─────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  // ─── 12. Start server ───────────────────────────────────
  const PORT = config.port;
  const proto = config.tls.enabled ? 'https' : 'http';

  server.listen(PORT, () => {
    logger.info(`
  ┌─────────────────────────────────────────────────┐
  │     ABC Express AIP — API Server                │
  │                                                 │
  │     ${proto.toUpperCase().padEnd(6)}    ${proto}://localhost:${PORT}        │
  │     WebSocket: ws${config.tls.enabled ? 's' : ''}://localhost:${PORT}         │
  │     Health:    ${proto}://localhost:${PORT}/health  │
  │     Env:       ${config.nodeEnv.padEnd(12)}                  │
  │                                                 │
  │     Security:                                   │
  │       TLS 1.3:    ${(config.tls.enabled ? 'ON' : 'OFF (proxy)').padEnd(12)}              │
  │       JWT:        ${(jwtService ? 'ES256' : 'HS256 (dev)').padEnd(12)}              │
  │       Encryption: ${(config.encryption.enabled ? 'AES-256-GCM' : 'OFF').padEnd(12)}              │
  │       Vault:      ${(config.vault.enabled ? 'Connected' : 'OFF (env)').padEnd(12)}              │
  │       RBAC:       Active                        │
  │       HSTS:       ${(config.hsts.enabled ? 'ON (2yr)' : 'OFF (dev)').padEnd(12)}              │
  └─────────────────────────────────────────────────┘
    `);
  });

  // ─── 13. Graceful shutdown ──────────────────────────────
  const shutdown = (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);

    // Stop TLS cert reload if active
    if ((server as any).__tlsCleanup) {
      (server as any).__tlsCleanup();
    }

    // Destroy Vault client if active
    if (secretProvider && 'destroy' in secretProvider) {
      (secretProvider as any).destroy();
    }

    server.close(() => {
      logger.info('HTTP server closed');
      prisma.$disconnect().then(() => {
        logger.info('Database connections closed');
        process.exit(0);
      });
    });

    // Force shutdown after 10s
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection:', reason);
  });
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    process.exit(1);
  });

  // Export for testing
  return { app, server, jwtService, secretProvider };
};

// ─── Run ────────────────────────────────────────────────────
const instance = bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { instance };
