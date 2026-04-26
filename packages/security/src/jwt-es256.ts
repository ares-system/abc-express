// ─────────────────────────────────────────────────────────────
// JWT ES256 (ECDSA P-256) Authentication Module
// Replaces RS256 with ES256 for smaller tokens, faster
// verification, and forward-secure key material.
// Uses `jose` for standards-compliant JWT operations.
// ─────────────────────────────────────────────────────────────

import * as jose from 'jose';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// ─── Types ──────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  branchId?: string | null;
  /** Agent identifier for machine-to-machine auth */
  agentId?: string;
  /** Audience scope */
  aud?: string | string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

export interface JwtEs256Config {
  /** PEM-encoded EC private key (P-256), or path to file */
  privateKey: string;
  /** PEM-encoded EC public key (P-256), or path to file */
  publicKey: string;
  /** Issuer claim (default: "abc-express-aip") */
  issuer?: string;
  /** Access token TTL (default: "1h") */
  accessTtl?: string;
  /** Refresh token TTL (default: "7d") */
  refreshTtl?: string;
  /** Audience (default: "abc-express") */
  audience?: string;
}

// ─── Key generation utility ─────────────────────────────────

/**
 * Generates a new ECDSA P-256 key pair in PEM format.
 * Use this for initial setup or key rotation.
 */
export const generateEs256KeyPair = (): {
  privateKey: string;
  publicKey: string;
} => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { privateKey, publicKey };
};

/**
 * Generates and writes key pair to disk. Returns paths.
 */
export const generateAndSaveKeyPair = (
  dir: string,
): { privateKeyPath: string; publicKeyPath: string } => {
  const { privateKey, publicKey } = generateEs256KeyPair();
  const privPath = path.join(dir, 'ec-private.pem');
  const pubPath = path.join(dir, 'ec-public.pem');

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(privPath, privateKey, { mode: 0o600 });
  fs.writeFileSync(pubPath, publicKey, { mode: 0o644 });

  return { privateKeyPath: privPath, publicKeyPath: pubPath };
};

// ─── Main ES256 JWT service ─────────────────────────────────

export class JwtEs256Service {
  private privateKey!: jose.KeyLike;
  private publicKey!: jose.KeyLike;
  private issuer: string;
  private audience: string;
  private accessTtl: string;
  private refreshTtl: string;
  private initialized = false;

  constructor(private readonly config: JwtEs256Config) {
    this.issuer = config.issuer ?? 'abc-express-aip';
    this.audience = config.audience ?? 'abc-express';
    this.accessTtl = config.accessTtl ?? '1h';
    this.refreshTtl = config.refreshTtl ?? '7d';
  }

  // ─── Lazy init (async key import) ─────────────────────

  async init(): Promise<void> {
    if (this.initialized) return;

    const privPem = this.resolveKey(this.config.privateKey);
    const pubPem = this.resolveKey(this.config.publicKey);

    this.privateKey = await jose.importPKCS8(privPem, 'ES256');
    this.publicKey = await jose.importSPKI(pubPem, 'ES256');
    this.initialized = true;
  }

  private resolveKey(keyOrPath: string): string {
    if (keyOrPath.includes('-----BEGIN')) return keyOrPath;
    const resolved = path.resolve(keyOrPath);
    return fs.readFileSync(resolved, 'utf-8');
  }

  private ensureInit(): void {
    if (!this.initialized) {
      throw new Error('JwtEs256Service not initialized — call init() first');
    }
  }

  // ─── Token generation ─────────────────────────────────

  /**
   * Signs a full access + refresh token pair.
   */
  async signTokenPair(payload: JwtPayload): Promise<TokenPair> {
    this.ensureInit();

    const now = Math.floor(Date.now() / 1000);
    const jti = crypto.randomUUID();

    const accessToken = await new jose.SignJWT({
      sub: payload.userId,
      email: payload.email,
      role: payload.role,
      branchId: payload.branchId ?? null,
      agentId: payload.agentId,
      type: 'access',
    })
      .setProtectedHeader({ alg: 'ES256', typ: 'JWT', kid: 'abc-aip-v1' })
      .setIssuer(this.issuer)
      .setAudience(this.audience)
      .setIssuedAt(now)
      .setJti(jti)
      .setExpirationTime(this.accessTtl)
      .sign(this.privateKey);

    const refreshToken = await new jose.SignJWT({
      sub: payload.userId,
      type: 'refresh',
      jti: crypto.randomUUID(),
      parentJti: jti,
    })
      .setProtectedHeader({ alg: 'ES256', typ: 'JWT', kid: 'abc-aip-v1' })
      .setIssuer(this.issuer)
      .setAudience(this.audience)
      .setIssuedAt(now)
      .setExpirationTime(this.refreshTtl)
      .sign(this.privateKey);

    // Calculate expiry timestamp from access token
    const decoded = jose.decodeJwt(accessToken);
    const expiresAt = (decoded.exp as number) ?? now + 3600;

    return { accessToken, refreshToken, expiresAt };
  }

  /**
   * Signs a short-lived agent token (machine-to-machine).
   */
  async signAgentToken(
    agentId: string,
    scopes: string[],
    ttl = '15m',
  ): Promise<string> {
    this.ensureInit();

    return new jose.SignJWT({
      sub: agentId,
      type: 'agent',
      scopes,
    })
      .setProtectedHeader({ alg: 'ES256', typ: 'JWT', kid: 'abc-aip-v1' })
      .setIssuer(this.issuer)
      .setAudience(this.audience)
      .setIssuedAt()
      .setJti(crypto.randomUUID())
      .setExpirationTime(ttl)
      .sign(this.privateKey);
  }

  // ─── Token verification ───────────────────────────────

  /**
   * Verifies and returns the decoded payload.
   * Throws on invalid, expired, or wrong audience/issuer.
   */
  async verify(token: string): Promise<jose.JWTPayload & JwtPayload> {
    this.ensureInit();

    const { payload } = await jose.jwtVerify(token, this.publicKey, {
      issuer: this.issuer,
      audience: this.audience,
      algorithms: ['ES256'],
      clockTolerance: 15, // 15s clock skew tolerance
    });

    return {
      ...payload,
      userId: payload.sub as string,
      email: (payload as any).email,
      role: (payload as any).role,
      branchId: (payload as any).branchId,
      agentId: (payload as any).agentId,
    };
  }

  /**
   * Verifies a refresh token and returns sub + jti.
   */
  async verifyRefreshToken(
    token: string,
  ): Promise<{ userId: string; jti: string; parentJti: string }> {
    this.ensureInit();

    const { payload } = await jose.jwtVerify(token, this.publicKey, {
      issuer: this.issuer,
      audience: this.audience,
      algorithms: ['ES256'],
    });

    if ((payload as any).type !== 'refresh') {
      throw new Error('Token is not a refresh token');
    }

    return {
      userId: payload.sub as string,
      jti: payload.jti as string,
      parentJti: (payload as any).parentJti,
    };
  }

  // ─── Utility ──────────────────────────────────────────

  /**
   * Decode without verifying (for logging/debugging only).
   */
  decode(token: string): jose.JWTPayload {
    return jose.decodeJwt(token);
  }

  /**
   * Export the public key as JWK (for JWKS endpoint).
   */
  async exportPublicJwk(): Promise<jose.JWK> {
    this.ensureInit();
    const jwk = await jose.exportJWK(this.publicKey);
    return { ...jwk, kid: 'abc-aip-v1', alg: 'ES256', use: 'sig' };
  }
}

// ─── Express middleware factory ─────────────────────────────

export interface AuthMiddlewareOptions {
  jwtService: JwtEs256Service;
  /** Roles that are allowed (empty = any authenticated user) */
  roles?: string[];
  /** Allow agent tokens */
  allowAgents?: boolean;
  /** Required scopes for agent tokens */
  requiredScopes?: string[];
}

/**
 * Express middleware that verifies ES256 JWT tokens.
 * Replaces the old HS256/RS256 `authenticate` + `authorize`.
 */
export const es256AuthMiddleware = (opts: AuthMiddlewareOptions) => {
  return async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_MISSING',
      });
    }

    const token = authHeader.slice(7);

    try {
      const payload = await opts.jwtService.verify(token);

      // Agent token scope check
      if (payload.agentId && (payload as any).type === 'agent') {
        if (!opts.allowAgents) {
          return res.status(403).json({
            success: false,
            error: 'Agent tokens not allowed for this endpoint',
            code: 'AUTH_AGENT_DENIED',
          });
        }
        if (opts.requiredScopes?.length) {
          const tokenScopes: string[] = (payload as any).scopes ?? [];
          const missing = opts.requiredScopes.filter(
            (s) => !tokenScopes.includes(s),
          );
          if (missing.length > 0) {
            return res.status(403).json({
              success: false,
              error: `Missing scopes: ${missing.join(', ')}`,
              code: 'AUTH_SCOPE_DENIED',
            });
          }
        }
      }

      // Role check
      if (opts.roles?.length && !opts.roles.includes(payload.role)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'AUTH_ROLE_DENIED',
        });
      }

      req.user = payload;
      next();
    } catch (err: any) {
      const code =
        err?.code === 'ERR_JWT_EXPIRED' ? 'AUTH_EXPIRED' : 'AUTH_INVALID';
      return res.status(401).json({
        success: false,
        error: code === 'AUTH_EXPIRED' ? 'Token expired' : 'Invalid token',
        code,
      });
    }
  };
};
