// ─────────────────────────────────────────────────────────────
// mTLS for gRPC Inter-Service Communication
// Mutual TLS between coordinator and subagent services.
// Handles certificate loading, verification, and gRPC
// channel/server creation with identity enforcement.
// ─────────────────────────────────────────────────────────────

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// ─── Types ──────────────────────────────────────────────────

export interface MtlsConfig {
  /** PEM-encoded CA certificate (shared trust root) */
  caCertPath: string;
  /** PEM-encoded server/client certificate */
  certPath: string;
  /** PEM-encoded private key */
  keyPath: string;
  /** Expected peer CN or SAN for verification */
  expectedPeerIdentity?: string;
  /** gRPC keepalive interval in ms (default: 30000) */
  keepaliveMs?: number;
  /** Certificate reload interval in ms (default: 300000 = 5 min) */
  reloadIntervalMs?: number;
}

export interface GrpcServerOptions extends MtlsConfig {
  /** Host:port to bind (default: "0.0.0.0:50051") */
  bindAddress?: string;
  /** Max message size in bytes (default: 4MB) */
  maxMessageSize?: number;
}

export interface GrpcChannelOptions extends MtlsConfig {
  /** Target host:port */
  target: string;
  /** Max message size in bytes (default: 4MB) */
  maxMessageSize?: number;
  /** Connection timeout in ms */
  connectTimeoutMs?: number;
}

// ─── Certificate loader ─────────────────────────────────────

export interface CertBundle {
  caCert: Buffer;
  cert: Buffer;
  key: Buffer;
  fingerprint: string;
}

const loadCerts = (config: MtlsConfig): CertBundle => {
  const caCert = fs.readFileSync(path.resolve(config.caCertPath));
  const cert = fs.readFileSync(path.resolve(config.certPath));
  const key = fs.readFileSync(path.resolve(config.keyPath));

  const fingerprint = crypto
    .createHash('sha256')
    .update(cert)
    .digest('hex')
    .slice(0, 16);

  return { caCert, cert, key, fingerprint };
};

// ─── Peer identity verification ─────────────────────────────

// @grpc/grpc-js doesn't export CheckServerIdentityCallback, so we define our own.
// Using 'any' for cert to avoid type conflicts with grpc-js internal types.
type GrpcCheckServerIdentityCallback = (
  hostname: string,
  cert: any
) => Error | undefined;

/**
 * Custom certificate check that validates the peer's CN/SAN
 * against an expected identity string.
 */
const createPeerVerifier = (
  expectedIdentity: string | undefined,
): GrpcCheckServerIdentityCallback | undefined => {
  if (!expectedIdentity) return undefined;

  return (hostname: string, cert: any): Error | undefined => {
    // Check CN
    if (cert.subject?.CN === expectedIdentity) return undefined;

    // Check SANs
    const sans: string[] = cert.subjectaltname
      ?.split(',')
      .map((s: string) => s.trim().replace(/^DNS:/, '')) ?? [];

    if (sans.includes(expectedIdentity)) return undefined;

    return new Error(
      `mTLS peer identity mismatch: expected "${expectedIdentity}", ` +
        `got CN="${cert.subject?.CN}", SANs=[${sans.join(', ')}]`,
    );
  };
};

// ─── gRPC Server (mTLS) ─────────────────────────────────────

/**
 * Creates a gRPC server with mTLS enforcement.
 * Only clients with valid certificates signed by the shared CA
 * can connect.
 */
export const createMtlsGrpcServer = (
  opts: GrpcServerOptions,
): {
  server: grpc.Server;
  credentials: grpc.ServerCredentials;
  start: () => Promise<void>;
  stop: () => Promise<void>;
} => {
  const certs = loadCerts(opts);

  const credentials = grpc.ServerCredentials.createSsl(
    certs.caCert,
    [
      {
        cert_chain: certs.cert,
        private_key: certs.key,
      },
    ],
    true, // requireClientCert — enforces mutual TLS
  );

  const server = new grpc.Server({
    'grpc.max_receive_message_length': opts.maxMessageSize ?? 4 * 1024 * 1024,
    'grpc.max_send_message_length': opts.maxMessageSize ?? 4 * 1024 * 1024,
    'grpc.keepalive_time_ms': opts.keepaliveMs ?? 30_000,
    'grpc.keepalive_timeout_ms': 10_000,
    'grpc.keepalive_permit_without_calls': 1,
    'grpc.http2.min_ping_interval_without_data_ms': 10_000,
  });

  const bindAddress = opts.bindAddress ?? '0.0.0.0:50051';

  const start = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      server.bindAsync(bindAddress, credentials, (err, port) => {
        if (err) return reject(err);
        console.info(
          `[grpc] mTLS server listening on ${bindAddress} (cert: ${certs.fingerprint}...)`,
        );
        resolve();
      });
    });
  };

  const stop = (): Promise<void> => {
    return new Promise((resolve) => {
      server.tryShutdown(() => {
        console.info('[grpc] Server shut down gracefully');
        resolve();
      });
    });
  };

  return { server, credentials, start, stop };
};

// ─── gRPC Channel (mTLS client) ─────────────────────────────

/**
 * Creates a gRPC channel with mTLS for connecting to
 * another microservice (e.g. coordinator → subagent).
 */
export const createMtlsGrpcChannel = (
  opts: GrpcChannelOptions,
): grpc.ChannelCredentials => {
  const certs = loadCerts(opts);

  const channelCredentials = grpc.ChannelCredentials.createSsl(
    certs.caCert,
    certs.key,
    certs.cert,
    {
      checkServerIdentity: createPeerVerifier(opts.expectedPeerIdentity),
    },
  );

  return channelCredentials;
};

/**
 * Creates a gRPC client with mTLS for a given proto service.
 */
export const createMtlsGrpcClient = <T>(
  protoPath: string,
  packageName: string,
  serviceName: string,
  opts: GrpcChannelOptions,
): T => {
  const packageDef = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const proto = grpc.loadPackageDefinition(packageDef);
  const credentials = createMtlsGrpcChannel(opts);

  // Navigate to the service constructor
  const parts = packageName.split('.');
  let ns: any = proto;
  for (const part of parts) {
    ns = ns[part];
    if (!ns) throw new Error(`Package ${packageName} not found in proto`);
  }

  const ServiceConstructor = ns[serviceName];
  if (!ServiceConstructor) {
    throw new Error(`Service ${serviceName} not found in ${packageName}`);
  }

  return new ServiceConstructor(opts.target, credentials, {
    'grpc.max_receive_message_length': opts.maxMessageSize ?? 4 * 1024 * 1024,
    'grpc.max_send_message_length': opts.maxMessageSize ?? 4 * 1024 * 1024,
    'grpc.keepalive_time_ms': opts.keepaliveMs ?? 30_000,
    'grpc.initial_reconnect_backoff_ms': 1000,
    'grpc.max_reconnect_backoff_ms': 10_000,
  }) as T;
};

// ─── Proto definition for coordinator ↔ subagent ────────────

export const COORDINATOR_PROTO = `
syntax = "proto3";

package abc.aip;

// Coordinator ↔ SubAgent communication
service AgentCoordinator {
  // Dispatch a task to a subagent
  rpc DispatchTask (TaskRequest) returns (TaskResponse);

  // Stream task progress updates
  rpc StreamProgress (TaskRequest) returns (stream ProgressUpdate);

  // Health check
  rpc HealthCheck (HealthRequest) returns (HealthResponse);

  // Cancel a running task
  rpc CancelTask (CancelRequest) returns (CancelResponse);
}

message TaskRequest {
  string task_id = 1;
  string agent_type = 2;        // e.g. "route-optimizer", "cost-analyzer"
  string payload_json = 3;      // JSON-encoded task payload
  string requester_id = 4;      // User or agent ID
  int32 priority = 5;           // 1=low, 5=critical
  int32 timeout_seconds = 6;    // Max execution time
  map<string, string> metadata = 7;
}

message TaskResponse {
  string task_id = 1;
  string status = 2;            // "accepted", "rejected", "completed", "failed"
  string result_json = 3;       // JSON-encoded result
  string error_message = 4;
  double confidence = 5;        // AI confidence score [0,1]
  int64 duration_ms = 6;
}

message ProgressUpdate {
  string task_id = 1;
  string stage = 2;             // e.g. "analyzing", "optimizing", "complete"
  double progress = 3;          // 0.0 to 1.0
  string message = 4;
  int64 timestamp_ms = 5;
}

message HealthRequest {
  string service_name = 1;
}

message HealthResponse {
  string status = 1;            // "healthy", "degraded", "unhealthy"
  string version = 2;
  int64 uptime_seconds = 3;
  map<string, string> checks = 4;
}

message CancelRequest {
  string task_id = 1;
  string reason = 2;
}

message CancelResponse {
  bool acknowledged = 1;
  string message = 2;
}
`;

// ─── Certificate generation utility (dev/testing) ───────────

export interface CertGenOptions {
  /** Output directory */
  outputDir: string;
  /** CA common name */
  caCommonName?: string;
  /** Server CN */
  serverCN?: string;
  /** Client CN */
  clientCN?: string;
  /** Validity in days */
  validityDays?: number;
}

/**
 * Generates a self-signed CA + server + client certificate set
 * for development/testing. NOT for production use.
 *
 * For production, use cert-manager or an internal PKI.
 */
export const generateDevCertificates = (opts: CertGenOptions): void => {
  const { execSync } = require('node:child_process');
  const dir = path.resolve(opts.outputDir);
  const days = opts.validityDays ?? 365;
  const caCN = opts.caCommonName ?? 'ABC Express Dev CA';
  const serverCN = opts.serverCN ?? 'coordinator.abc-express.internal';
  const clientCN = opts.clientCN ?? 'subagent.abc-express.internal';

  fs.mkdirSync(dir, { recursive: true });

  // Generate CA
  execSync(
    `openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 ` +
      `-keyout "${dir}/ca-key.pem" -out "${dir}/ca-cert.pem" ` +
      `-days ${days} -nodes -subj "/CN=${caCN}"`,
    { stdio: 'pipe' },
  );

  // Generate server cert signed by CA
  execSync(
    `openssl req -newkey ec -pkeyopt ec_paramgen_curve:P-256 ` +
      `-keyout "${dir}/server-key.pem" -out "${dir}/server-csr.pem" ` +
      `-nodes -subj "/CN=${serverCN}"`,
    { stdio: 'pipe' },
  );
  execSync(
    `openssl x509 -req -in "${dir}/server-csr.pem" ` +
      `-CA "${dir}/ca-cert.pem" -CAkey "${dir}/ca-key.pem" ` +
      `-CAcreateserial -out "${dir}/server-cert.pem" -days ${days}`,
    { stdio: 'pipe' },
  );

  // Generate client cert signed by CA
  execSync(
    `openssl req -newkey ec -pkeyopt ec_paramgen_curve:P-256 ` +
      `-keyout "${dir}/client-key.pem" -out "${dir}/client-csr.pem" ` +
      `-nodes -subj "/CN=${clientCN}"`,
    { stdio: 'pipe' },
  );
  execSync(
    `openssl x509 -req -in "${dir}/client-csr.pem" ` +
      `-CA "${dir}/ca-cert.pem" -CAkey "${dir}/ca-key.pem" ` +
      `-CAcreateserial -out "${dir}/client-cert.pem" -days ${days}`,
    { stdio: 'pipe' },
  );

  // Clean up CSRs
  fs.unlinkSync(`${dir}/server-csr.pem`);
  fs.unlinkSync(`${dir}/client-csr.pem`);

  console.info(`[mtls] Dev certificates generated in ${dir}`);
};
