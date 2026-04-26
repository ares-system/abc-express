// ─────────────────────────────────────────────────────────────
// @abc/security — Barrel Export
// Single entry point for all security modules.
// ─────────────────────────────────────────────────────────────

// ─── TLS 1.3 ────────────────────────────────────────────────
export {
  createTlsConfig,
  hstsMiddleware,
  securityHeadersMiddleware,
  type TlsConfig,
  type TlsResult,
  type HstsOptions,
} from './tls.js';

// ─── JWT ES256 (ECDSA P-256) ────────────────────────────────
export {
  JwtEs256Service,
  es256AuthMiddleware,
  generateEs256KeyPair,
  generateAndSaveKeyPair,
  type JwtPayload,
  type TokenPair,
  type JwtEs256Config,
  type AuthMiddlewareOptions,
} from './jwt-es256.js';

// ─── AES-256-GCM Field Encryption ──────────────────────────
export {
  FieldEncryptor,
  createEncryptionMiddleware,
  createKeyRotationScheduler,
  generateMasterKey,
  SHIPMENT_ENCRYPTED_FIELDS,
  type EncryptionConfig,
  type EncryptedField,
  type ShipmentEncryptedField,
  type KeyRotationSchedule,
  type KeyRotationDeps,
} from './encryption.js';

// ─── OPA-Style Policy Engine ────────────────────────────────
export {
  PolicyEngine,
  policyEngine,
  policyMiddleware,
  divisionRateLimitMiddleware,
  type Role,
  type Resource,
  type Action,
  type PolicyInput,
  type PolicyDecision,
  type RateLimitTier,
  type PolicyMiddlewareOptions,
  type RateLimiterDeps,
} from './policy.js';

// ─── HashiCorp Vault ────────────────────────────────────────
export {
  VaultClient,
  VaultError,
  EnvSecretProvider,
  createSecretProvider,
  SECRET_PATHS,
  type VaultConfig,
  type SecretResult,
  type VaultHealthStatus,
  type SecretProvider,
} from './vault.js';

// ─── mTLS for gRPC ──────────────────────────────────────────
export {
  createMtlsGrpcServer,
  createMtlsGrpcChannel,
  createMtlsGrpcClient,
  generateDevCertificates,
  COORDINATOR_PROTO,
  type MtlsConfig,
  type GrpcServerOptions,
  type GrpcChannelOptions,
  type CertBundle,
  type CertGenOptions,
} from './mtls.js';
