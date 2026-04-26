// ─────────────────────────────────────────────────────────────
// TLS 1.3 Configuration — Gin + cert-manager compatible
// Enforces TLS 1.3 minimum, strong cipher suites only,
// HSTS headers, and certificate hot-reload support.
// ─────────────────────────────────────────────────────────────

import tls from 'node:tls';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// ─── Types ──────────────────────────────────────────────────

export interface TlsConfig {
  /** Path to PEM-encoded certificate (or cert-manager mount) */
  certPath: string;
  /** Path to PEM-encoded private key */
  keyPath: string;
  /** Optional CA bundle for client verification */
  caPath?: string;
  /** Enable client certificate verification (for mTLS) */
  requireClientCert?: boolean;
  /** Hot-reload interval in ms (default: 60000 = 1 min) */
  reloadIntervalMs?: number;
}

export interface TlsResult {
  secureContext: tls.SecureContext;
  tlsOptions: tls.TlsOptions;
  /** Call to start hot-reload watcher; returns cleanup fn */
  startReloader: () => () => void;
  /** SHA-256 fingerprint of the loaded cert */
  certFingerprint: string;
}

// ─── Allowed ciphers (TLS 1.3 only) ────────────────────────

const TLS_13_CIPHERS = [
  'TLS_AES_256_GCM_SHA384',
  'TLS_CHACHA20_POLY1305_SHA256',
  'TLS_AES_128_GCM_SHA256',
].join(':');

// ─── Helpers ────────────────────────────────────────────────

const readFileIfExists = (filePath: string | undefined): Buffer | undefined => {
  if (!filePath) return undefined;
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`TLS file not found: ${resolved}`);
  }
  return fs.readFileSync(resolved);
};

const computeFingerprint = (certPem: Buffer): string =>
  crypto.createHash('sha256').update(certPem).digest('hex');

// ─── Main factory ───────────────────────────────────────────

export const createTlsConfig = (cfg: TlsConfig): TlsResult => {
  const certPem = readFileIfExists(cfg.certPath)!;
  const keyPem = readFileIfExists(cfg.keyPath)!;
  const caPem = readFileIfExists(cfg.caPath);

  const baseOptions: tls.TlsOptions = {
    cert: certPem,
    key: keyPem,
    ca: caPem,

    // Enforce TLS 1.3 minimum
    minVersion: 'TLSv1.3',
    maxVersion: 'TLSv1.3',
    ciphers: TLS_13_CIPHERS,

    // Client cert settings
    requestCert: cfg.requireClientCert ?? false,
    rejectUnauthorized: cfg.requireClientCert ?? false,

    // Security hardening
    honorCipherOrder: true,
    sessionTimeout: 300, // 5 min session tickets

    // ECDH curves — prefer X25519 then P-256
    ecdhCurve: 'X25519:prime256v1',
  };

  const secureContext = tls.createSecureContext(baseOptions);
  let currentFingerprint = computeFingerprint(certPem);

  // ─── Hot-reload (cert-manager rotations) ────────────────

  const startReloader = (): (() => void) => {
    const intervalMs = cfg.reloadIntervalMs ?? 60_000;
    let timer: ReturnType<typeof setInterval> | null = null;

    timer = setInterval(() => {
      try {
        const newCert = fs.readFileSync(path.resolve(cfg.certPath));
        const newFingerprint = computeFingerprint(newCert);

        if (newFingerprint !== currentFingerprint) {
          const newKey = fs.readFileSync(path.resolve(cfg.keyPath));
          const newCa = cfg.caPath
            ? fs.readFileSync(path.resolve(cfg.caPath))
            : undefined;

          // Atomic context swap
          const newCtx = tls.createSecureContext({
            ...baseOptions,
            cert: newCert,
            key: newKey,
            ca: newCa,
          });

          // Update the shared context (Node allows this for SNICallback)
          Object.assign(secureContext, newCtx);
          currentFingerprint = newFingerprint;

          console.info(
            `[tls] Certificate rotated — new fingerprint: ${newFingerprint.slice(0, 16)}...`,
          );
        }
      } catch (err) {
        console.error('[tls] Certificate reload failed:', err);
      }
    }, intervalMs);

    return () => {
      if (timer) clearInterval(timer);
    };
  };

  return {
    secureContext,
    tlsOptions: baseOptions,
    startReloader,
    certFingerprint: currentFingerprint,
  };
};

// ─── HSTS middleware (Express-compatible) ───────────────────

export interface HstsOptions {
  /** Max-age in seconds (default: 63072000 = 2 years) */
  maxAge?: number;
  includeSubDomains?: boolean;
  preload?: boolean;
}

/**
 * Returns an Express middleware that sets Strict-Transport-Security
 * and redirects HTTP → HTTPS.
 */
export const hstsMiddleware = (opts: HstsOptions = {}) => {
  const maxAge = opts.maxAge ?? 63_072_000;
  const directives = [
    `max-age=${maxAge}`,
    opts.includeSubDomains !== false ? 'includeSubDomains' : '',
    opts.preload ? 'preload' : '',
  ]
    .filter(Boolean)
    .join('; ');

  return (req: any, res: any, next: any) => {
    // Redirect HTTP → HTTPS in production
    if (
      req.headers['x-forwarded-proto'] === 'http' &&
      process.env.NODE_ENV === 'production'
    ) {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }

    res.setHeader('Strict-Transport-Security', directives);
    next();
  };
};

// ─── Security headers middleware ────────────────────────────

/**
 * Additional hardening headers beyond what helmet provides.
 */
export const securityHeadersMiddleware = () => {
  return (_req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '0'); // Modern CSP preferred
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()',
    );
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    next();
  };
};
