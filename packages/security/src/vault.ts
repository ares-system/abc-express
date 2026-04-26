// ─────────────────────────────────────────────────────────────
// HashiCorp Vault Integration — Secret Management
// Go SDK-style pattern adapted for Node.js.
// Manages API keys (Claude/Anthropic, Neo4j), encryption
// master keys, JWT signing keys, and database credentials.
// Supports KV v2, transit engine, and lease renewal.
// ─────────────────────────────────────────────────────────────

import crypto from 'node:crypto';

// ─── Types ──────────────────────────────────────────────────

export interface VaultConfig {
  /** Vault server address (e.g. https://vault.abc-express.internal:8200) */
  address: string;
  /** Authentication method */
  auth:
    | { method: 'token'; token: string }
    | { method: 'approle'; roleId: string; secretId: string }
    | { method: 'kubernetes'; role: string; jwt?: string };
  /** KV v2 mount path (default: "secret") */
  kvMount?: string;
  /** Secret path prefix (default: "abc-express") */
  pathPrefix?: string;
  /** Token renewal interval in ms (default: 300000 = 5 min) */
  renewIntervalMs?: number;
  /** Connection timeout in ms */
  timeoutMs?: number;
  /** TLS CA cert for Vault server (PEM string or path) */
  caCert?: string;
  /** Namespace (Vault Enterprise) */
  namespace?: string;
}

export interface SecretResult<T = Record<string, string>> {
  data: T;
  metadata: {
    version: number;
    createdTime: string;
    deletionTime: string;
    destroyed: boolean;
  };
}

export interface VaultHealthStatus {
  initialized: boolean;
  sealed: boolean;
  standby: boolean;
  serverTimeUtc: number;
  version: string;
}

/** Well-known secret paths for ABC Express AIP */
export const SECRET_PATHS = {
  ANTHROPIC_API_KEY: 'ai/anthropic',
  NEO4J_CREDENTIALS: 'db/neo4j',
  POSTGRES_CREDENTIALS: 'db/postgres',
  ENCRYPTION_MASTER_KEY: 'crypto/master-key',
  JWT_SIGNING_KEYS: 'crypto/jwt-es256',
  REDIS_CREDENTIALS: 'db/redis',
  SMTP_CREDENTIALS: 'integrations/smtp',
  WEBHOOK_SECRETS: 'integrations/webhooks',
} as const;

type SecretPath = (typeof SECRET_PATHS)[keyof typeof SECRET_PATHS];

// ─── Vault Client ───────────────────────────────────────────

export class VaultClient {
  private address: string;
  private token: string | null = null;
  private kvMount: string;
  private pathPrefix: string;
  private renewTimer: ReturnType<typeof setInterval> | null = null;
  private config: VaultConfig;
  private headers: Record<string, string> = {};

  /** In-memory cache with TTL */
  private cache = new Map<
    string,
    { data: any; expiresAt: number }
  >();
  private cacheTtlMs = 300_000; // 5 min default

  constructor(config: VaultConfig) {
    this.config = config;
    this.address = config.address.replace(/\/+$/, '');
    this.kvMount = config.kvMount ?? 'secret';
    this.pathPrefix = config.pathPrefix ?? 'abc-express';

    if (config.namespace) {
      this.headers['X-Vault-Namespace'] = config.namespace;
    }
  }

  // ─── Lifecycle ──────────────────────────────────────────

  /**
   * Authenticate to Vault and start token renewal loop.
   */
  async init(): Promise<void> {
    await this.authenticate();
    this.startRenewal();
  }

  /**
   * Stop renewal loop and clear cache.
   */
  destroy(): void {
    if (this.renewTimer) {
      clearInterval(this.renewTimer);
      this.renewTimer = null;
    }
    this.cache.clear();
    this.token = null;
  }

  // ─── Authentication ─────────────────────────────────────

  private async authenticate(): Promise<void> {
    const auth = this.config.auth;

    switch (auth.method) {
      case 'token':
        this.token = auth.token;
        break;

      case 'approle': {
        const resp = await this.rawRequest('POST', '/v1/auth/approle/login', {
          role_id: auth.roleId,
          secret_id: auth.secretId,
        });
        this.token = resp.auth.client_token;
        break;
      }

      case 'kubernetes': {
        const jwt =
          auth.jwt ??
          (await this.readServiceAccountToken());
        const resp = await this.rawRequest('POST', '/v1/auth/kubernetes/login', {
          role: auth.role,
          jwt,
        });
        this.token = resp.auth.client_token;
        break;
      }
    }
  }

  private async readServiceAccountToken(): Promise<string> {
    const fs = await import('node:fs');
    return fs.readFileSync(
      '/var/run/secrets/kubernetes.io/serviceaccount/token',
      'utf-8',
    );
  }

  private startRenewal(): void {
    const intervalMs = this.config.renewIntervalMs ?? 300_000;
    this.renewTimer = setInterval(async () => {
      try {
        await this.rawRequest('POST', '/v1/auth/token/renew-self', {});
      } catch (err) {
        console.error('[vault] Token renewal failed, re-authenticating:', err);
        try {
          await this.authenticate();
        } catch (reAuthErr) {
          console.error('[vault] Re-authentication failed:', reAuthErr);
        }
      }
    }, intervalMs);
  }

  // ─── KV v2 Operations ──────────────────────────────────

  /**
   * Read a secret from KV v2. Uses cache if fresh.
   */
  async getSecret<T = Record<string, string>>(
    secretPath: string,
  ): Promise<SecretResult<T>> {
    const fullPath = `${this.pathPrefix}/${secretPath}`;
    const cacheKey = `kv:${fullPath}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const resp = await this.rawRequest(
      'GET',
      `/v1/${this.kvMount}/data/${fullPath}`,
    );

    const result: SecretResult<T> = {
      data: resp.data.data as T,
      metadata: resp.data.metadata,
    };

    // Cache it
    this.cache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + this.cacheTtlMs,
    });

    return result;
  }

  /**
   * Write a secret to KV v2.
   */
  async putSecret(
    secretPath: string,
    data: Record<string, string>,
  ): Promise<{ version: number }> {
    const fullPath = `${this.pathPrefix}/${secretPath}`;

    const resp = await this.rawRequest(
      'POST',
      `/v1/${this.kvMount}/data/${fullPath}`,
      { data },
    );

    // Invalidate cache
    this.cache.delete(`kv:${fullPath}`);

    return { version: resp.data.version };
  }

  /**
   * Delete a secret version (soft delete).
   */
  async deleteSecret(
    secretPath: string,
    versions?: number[],
  ): Promise<void> {
    const fullPath = `${this.pathPrefix}/${secretPath}`;

    if (versions?.length) {
      await this.rawRequest(
        'POST',
        `/v1/${this.kvMount}/delete/${fullPath}`,
        { versions },
      );
    } else {
      await this.rawRequest(
        'DELETE',
        `/v1/${this.kvMount}/data/${fullPath}`,
      );
    }

    this.cache.delete(`kv:${fullPath}`);
  }

  // ─── Convenience: typed secret getters ──────────────────

  async getAnthropicApiKey(): Promise<string> {
    const secret = await this.getSecret<{ api_key: string }>(
      SECRET_PATHS.ANTHROPIC_API_KEY,
    );
    return secret.data.api_key;
  }

  async getNeo4jCredentials(): Promise<{
    uri: string;
    username: string;
    password: string;
  }> {
    const secret = await this.getSecret<{
      uri: string;
      username: string;
      password: string;
    }>(SECRET_PATHS.NEO4J_CREDENTIALS);
    return secret.data;
  }

  async getEncryptionMasterKey(): Promise<string> {
    const secret = await this.getSecret<{ master_key: string }>(
      SECRET_PATHS.ENCRYPTION_MASTER_KEY,
    );
    return secret.data.master_key;
  }

  async getJwtSigningKeys(): Promise<{
    private_key: string;
    public_key: string;
  }> {
    const secret = await this.getSecret<{
      private_key: string;
      public_key: string;
    }>(SECRET_PATHS.JWT_SIGNING_KEYS);
    return secret.data;
  }

  async getPostgresCredentials(): Promise<{
    url: string;
    username: string;
    password: string;
  }> {
    const secret = await this.getSecret<{
      url: string;
      username: string;
      password: string;
    }>(SECRET_PATHS.POSTGRES_CREDENTIALS);
    return secret.data;
  }

  // ─── Transit Engine (encrypt/decrypt via Vault) ─────────

  /**
   * Encrypt data using Vault's transit engine.
   * Returns ciphertext prefixed with "vault:v1:".
   */
  async transitEncrypt(
    keyName: string,
    plaintext: string,
  ): Promise<string> {
    const b64 = Buffer.from(plaintext, 'utf-8').toString('base64');
    const resp = await this.rawRequest(
      'POST',
      `/v1/transit/encrypt/${keyName}`,
      { plaintext: b64 },
    );
    return resp.data.ciphertext;
  }

  /**
   * Decrypt data using Vault's transit engine.
   */
  async transitDecrypt(
    keyName: string,
    ciphertext: string,
  ): Promise<string> {
    const resp = await this.rawRequest(
      'POST',
      `/v1/transit/decrypt/${keyName}`,
      { ciphertext },
    );
    return Buffer.from(resp.data.plaintext, 'base64').toString('utf-8');
  }

  // ─── Health ─────────────────────────────────────────────

  async health(): Promise<VaultHealthStatus> {
    const resp = await this.rawRequest('GET', '/v1/sys/health');
    return {
      initialized: resp.initialized,
      sealed: resp.sealed,
      standby: resp.standby,
      serverTimeUtc: resp.server_time_utc,
      version: resp.version,
    };
  }

  // ─── HTTP transport ─────────────────────────────────────

  private async rawRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    urlPath: string,
    body?: Record<string, any>,
  ): Promise<any> {
    const url = `${this.address}${urlPath}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.headers,
    };

    if (this.token) {
      headers['X-Vault-Token'] = this.token;
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.timeoutMs ?? 10_000,
    );

    try {
      const resp = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!resp.ok) {
        const errBody = await resp.text().catch(() => '');
        throw new VaultError(
          `Vault ${method} ${urlPath} failed: ${resp.status} ${resp.statusText}`,
          resp.status,
          errBody,
        );
      }

      if (
        resp.status === 204 ||
        resp.headers.get('content-length') === '0'
      ) {
        return {};
      }

      return resp.json();
    } finally {
      clearTimeout(timeout);
    }
  }
}

// ─── Error class ────────────────────────────────────────────

export class VaultError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly body: string,
  ) {
    super(message);
    this.name = 'VaultError';
  }
}

// ─── Fallback: env-based secrets (dev / no Vault) ───────────

/**
 * For development environments without Vault,
 * reads secrets from environment variables with a
 * consistent interface.
 */
export class EnvSecretProvider {
  async getAnthropicApiKey(): Promise<string> {
    return this.require('ANTHROPIC_API_KEY');
  }

  async getNeo4jCredentials(): Promise<{
    uri: string;
    username: string;
    password: string;
  }> {
    return {
      uri: this.require('NEO4J_URI'),
      username: process.env.NEO4J_USERNAME ?? 'neo4j',
      password: this.require('NEO4J_PASSWORD'),
    };
  }

  async getEncryptionMasterKey(): Promise<string> {
    const key = process.env.ENCRYPTION_MASTER_KEY;
    if (!key) {
      // Auto-generate for dev (logged as warning)
      const generated = crypto.randomBytes(32).toString('base64');
      console.warn(
        '[secrets] No ENCRYPTION_MASTER_KEY set — generated ephemeral key (data will be lost on restart)',
      );
      return generated;
    }
    return key;
  }

  async getJwtSigningKeys(): Promise<{
    private_key: string;
    public_key: string;
  }> {
    const priv = process.env.JWT_ES256_PRIVATE_KEY;
    const pub = process.env.JWT_ES256_PUBLIC_KEY;
    if (!priv || !pub) {
      throw new Error(
        'JWT_ES256_PRIVATE_KEY and JWT_ES256_PUBLIC_KEY must be set',
      );
    }
    return { private_key: priv, public_key: pub };
  }

  async getPostgresCredentials(): Promise<{
    url: string;
    username: string;
    password: string;
  }> {
    return {
      url: this.require('DATABASE_URL'),
      username: process.env.DB_USERNAME ?? 'abc_user',
      password: process.env.DB_PASSWORD ?? 'abc_pass',
    };
  }

  private require(envVar: string): string {
    const val = process.env[envVar];
    if (!val) throw new Error(`Required env var ${envVar} is not set`);
    return val;
  }
}

// ─── Factory ────────────────────────────────────────────────

export type SecretProvider = VaultClient | EnvSecretProvider;

/**
 * Creates the appropriate secret provider based on environment.
 * Uses Vault in production, env vars in development.
 */
export const createSecretProvider = (
  vaultConfig?: VaultConfig,
): SecretProvider => {
  if (vaultConfig && process.env.NODE_ENV === 'production') {
    return new VaultClient(vaultConfig);
  }
  return new EnvSecretProvider();
};
