// ─────────────────────────────────────────────────────────────
// AES-256-GCM At-Rest Encryption for Postgres
// Field-level encryption for sensitive shipment data
// (sender/receiver PII, declared values, special instructions).
// Uses authenticated encryption with per-field random IVs.
// ─────────────────────────────────────────────────────────────

import crypto from 'node:crypto';

// ─── Constants ──────────────────────────────────────────────

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag
const KEY_LENGTH = 32; // 256-bit key
const SALT_LENGTH = 16;
const ENCODING = 'base64' as const;

/** Prefix for identifying encrypted fields in DB */
const ENCRYPTED_PREFIX = '$ENC$';

// ─── Types ──────────────────────────────────────────────────

export interface EncryptionConfig {
  /** Base64-encoded 256-bit master key, or raw 32-byte Buffer */
  masterKey: string | Buffer;
  /** Optional AAD context (e.g. "shipment-pii") */
  context?: string;
}

export interface EncryptedField {
  /** Base64-encoded ciphertext */
  ct: string;
  /** Base64-encoded IV */
  iv: string;
  /** Base64-encoded auth tag */
  tag: string;
  /** Key version for rotation support */
  kv: number;
}

/** Fields on the Shipment model that contain PII / sensitive data */
export const SHIPMENT_ENCRYPTED_FIELDS = [
  'senderName',
  'senderPhone',
  'senderAddress',
  'receiverName',
  'receiverPhone',
  'receiverAddress',
  'specialInstructions',
  'declaredValue',
] as const;

export type ShipmentEncryptedField = (typeof SHIPMENT_ENCRYPTED_FIELDS)[number];

// ─── Key derivation ─────────────────────────────────────────

/**
 * Derives a field-specific key from the master key using HKDF.
 * Each field gets a unique derived key, limiting blast radius
 * if a single derived key is compromised.
 */
const deriveFieldKey = (
  masterKey: Buffer,
  fieldName: string,
  context: string,
): Buffer => {
  return crypto.hkdfSync(
    'sha256',
    masterKey,
    Buffer.from(`abc-express:${context}`),
    Buffer.from(`field:${fieldName}`),
    KEY_LENGTH,
  ) as unknown as Buffer;
};

// ─── Core encrypt / decrypt ─────────────────────────────────

export class FieldEncryptor {
  private masterKey: Buffer;
  private context: string;
  private keyVersion = 1;

  constructor(config: EncryptionConfig) {
    if (typeof config.masterKey === 'string') {
      this.masterKey = Buffer.from(config.masterKey, 'base64');
    } else {
      this.masterKey = config.masterKey;
    }

    if (this.masterKey.length !== KEY_LENGTH) {
      throw new Error(
        `Master key must be exactly ${KEY_LENGTH} bytes (got ${this.masterKey.length})`,
      );
    }

    this.context = config.context ?? 'shipment-pii';
  }

  /**
   * Encrypts a plaintext value for a specific field.
   * Returns a compact string: $ENC$<base64-json>
   */
  encrypt(fieldName: string, plaintext: string): string {
    if (!plaintext || plaintext.startsWith(ENCRYPTED_PREFIX)) {
      return plaintext; // Already encrypted or empty
    }

    const fieldKey = deriveFieldKey(this.masterKey, fieldName, this.context);
    const iv = crypto.randomBytes(IV_LENGTH);
    const aad = Buffer.from(`${this.context}:${fieldName}:v${this.keyVersion}`);

    const cipher = crypto.createCipheriv(ALGORITHM, fieldKey, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    cipher.setAAD(aad);

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf-8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    const envelope: EncryptedField = {
      ct: encrypted.toString(ENCODING),
      iv: iv.toString(ENCODING),
      tag: authTag.toString(ENCODING),
      kv: this.keyVersion,
    };

    return `${ENCRYPTED_PREFIX}${Buffer.from(JSON.stringify(envelope)).toString(ENCODING)}`;
  }

  /**
   * Decrypts an encrypted field value.
   * Returns plaintext. Passes through unencrypted values.
   */
  decrypt(fieldName: string, ciphertext: string): string {
    if (!ciphertext || !ciphertext.startsWith(ENCRYPTED_PREFIX)) {
      return ciphertext; // Not encrypted
    }

    const envelopeStr = Buffer.from(
      ciphertext.slice(ENCRYPTED_PREFIX.length),
      ENCODING,
    ).toString('utf-8');

    const envelope: EncryptedField = JSON.parse(envelopeStr);
    const fieldKey = deriveFieldKey(this.masterKey, fieldName, this.context);
    const iv = Buffer.from(envelope.iv, ENCODING);
    const authTag = Buffer.from(envelope.tag, ENCODING);
    const encrypted = Buffer.from(envelope.ct, ENCODING);
    const aad = Buffer.from(`${this.context}:${fieldName}:v${envelope.kv}`);

    const decipher = crypto.createDecipheriv(ALGORITHM, fieldKey, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAAD(aad);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf-8');
  }

  // ─── Batch operations (for Prisma middleware) ───────────

  /**
   * Encrypts all sensitive fields on a shipment record.
   */
  encryptShipmentFields<T extends Record<string, any>>(data: T): T {
    const result = { ...data };
    for (const field of SHIPMENT_ENCRYPTED_FIELDS) {
      if (field in result && typeof result[field] === 'string') {
        (result as any)[field] = this.encrypt(field, result[field]);
      } else if (field in result && typeof result[field] === 'number') {
        // declaredValue is numeric — encrypt as string
        (result as any)[field] = this.encrypt(field, String(result[field]));
      }
    }
    return result;
  }

  /**
   * Decrypts all sensitive fields on a shipment record.
   */
  decryptShipmentFields<T extends Record<string, any>>(data: T): T {
    const result = { ...data };
    for (const field of SHIPMENT_ENCRYPTED_FIELDS) {
      if (field in result && typeof result[field] === 'string') {
        const decrypted = this.decrypt(field, result[field]);
        // Restore numeric type for declaredValue
        if (field === 'declaredValue') {
          (result as any)[field] = parseFloat(decrypted) || 0;
        } else {
          (result as any)[field] = decrypted;
        }
      }
    }
    return result;
  }

  // ─── Key rotation support ─────────────────────────────

  /**
   * Re-encrypts a field with the current key version.
   * Use during key rotation to migrate old ciphertexts.
   */
  rotateField(fieldName: string, ciphertext: string): string {
    const plaintext = this.decrypt(fieldName, ciphertext);
    return this.encrypt(fieldName, plaintext);
  }

  /**
   * Sets a new master key and increments version.
   * After calling this, all new encryptions use the new key.
   * Old ciphertexts must be re-encrypted via rotateField().
   */
  rotateKey(newMasterKey: string | Buffer): void {
    if (typeof newMasterKey === 'string') {
      this.masterKey = Buffer.from(newMasterKey, 'base64');
    } else {
      this.masterKey = newMasterKey;
    }
    this.keyVersion++;
  }
}

// ─── Prisma middleware factory ───────────────────────────────

/**
 * Returns Prisma middleware that auto-encrypts on write
 * and auto-decrypts on read for the Shipment model.
 *
 * Usage:
 *   prisma.$use(createEncryptionMiddleware(encryptor));
 */
export const createEncryptionMiddleware = (encryptor: FieldEncryptor) => {
  return async (params: any, next: any) => {
    // Only intercept Shipment operations
    if (params.model !== 'Shipment') return next(params);

    // ─── Encrypt on write ───────────────────────────────
    if (['create', 'update', 'upsert'].includes(params.action)) {
      if (params.args.data) {
        params.args.data = encryptor.encryptShipmentFields(params.args.data);
      }
      if (params.args.create) {
        params.args.create = encryptor.encryptShipmentFields(params.args.create);
      }
      if (params.args.update) {
        params.args.update = encryptor.encryptShipmentFields(params.args.update);
      }
    }

    const result = await next(params);

    // ─── Decrypt on read ────────────────────────────────
    if (result === null || result === undefined) return result;

    if (Array.isArray(result)) {
      return result.map((r: any) =>
        r && typeof r === 'object' ? encryptor.decryptShipmentFields(r) : r,
      );
    }

    if (typeof result === 'object') {
      return encryptor.decryptShipmentFields(result);
    }

    return result;
  };
};

// ─── Master key generation utility ──────────────────────────

/**
 * Generates a cryptographically secure 256-bit master key.
 * Store this in Vault, never in code or .env in production.
 */
export const generateMasterKey = (): string =>
  crypto.randomBytes(KEY_LENGTH).toString('base64');

// ─── Key rotation cron job ──────────────────────────────────

export interface KeyRotationSchedule {
  /** Interval in days (default: 90 days / quarterly) */
  intervalDays?: number;
  /** Hour of day to run rotation (0-23, default: 2 = 2 AM) */
  hour?: number;
  /** Minute of hour (default: 0) */
  minute?: number;
}

export interface KeyRotationDeps {
  /** Get the current master key version from storage */
  getCurrentKeyVersion: () => Promise<number>;
  /** Store the new master key with version */
  storeMasterKey: (key: string, version: number) => Promise<void>;
  /** Fetch all shipments with encrypted fields */
  fetchEncryptedShipments: (batchSize: number, keyVersion?: number) => Promise<Array<{ id: string; _encryptedFields: Record<string, string> }>>;
  /** Update shipment with re-encrypted fields */
  updateShipment: (id: string, data: Record<string, string>) => Promise<void>;
  /** Log rotation events */
  log: (level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, any>) => void;
}

/**
 * Creates a key rotation scheduler.
 * Returns start/stop functions and a method to trigger immediate rotation.
 *
 * Usage:
 *   const { start, stop, rotateNow } = createKeyRotationScheduler({
 *     getCurrentKeyVersion: async () => db.get('kv'),
 *     storeMasterKey: async (k, v) => db.set('key', k).set('kv', v),
 *     fetchEncryptedShipments: async (b, kv) => db.query('SELECT * FROM shipment WHERE...', [b, kv]),
 *     updateShipment: async (id, data) => db.update('shipment', id, data),
 *     log: (l, m, meta) => consolel
 */
export const createKeyRotationScheduler = (deps: KeyRotationDeps) => {
  const schedule: KeyRotationSchedule = { intervalDays: 90, hour: 2, minute: 0 };
  let intervalId: NodeJS.Timeout | undefined;
  let isRunning = false;

  const rotateBatch = async (
    encryptor: FieldEncryptor,
    batchSize: number,
  ): Promise<{ rotated: number; errors: number }> => {
    let rotated = 0;
    let errors = 0;

    try {
      // Get current key version
      const currentKv = await deps.getCurrentKeyVersion();

      // Fetch shipments encrypted with older key versions
      const shipments = await deps.fetchEncryptedShipments(batchSize);

      for (const shipment of shipments) {
        try {
          // Decrypt with old key, re-encrypt with new key
          const decrypted = encryptor.decryptShipmentFields(shipment as any);
          const reEncrypted = encryptor.encryptShipmentFields(decrypted);

          // Update with new ciphertexts
          await deps.updateShipment(
            shipment.id,
            reEncrypted as Record<string, string>,
          );

          rotated++;
        } catch (err) {
          errors++;
          deps.log('error', 'Key rotation failed for shipment', {
            shipmentId: shipment.id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    } catch (err) {
      deps.log('error', 'Key rotation batch failed', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return { rotated, errors };
  };

  const performRotation = async (
    encryptor: FieldEncryptor,
    newKey: string,
  ): Promise<{ migrated: number; errors: number }> => {
    const batchSize = 100;
    let totalMigrated = 0;
    let totalErrors = 0;

    // Store new master key
    const newVersion = encryptor['keyVersion'] + 1;
    await deps.storeMasterKey(newKey, newVersion);

    // Rotate encryptor to use new key
    encryptor.rotateKey(newKey);

    // Migrate in batches until all old ciphertexts are rotated
    while (true) {
      const { rotated, errors } = await rotateBatch(encryptor, batchSize);
      totalMigrated += rotated;
      totalErrors += errors;

      if (rotated === 0) break; // All done
    }

    return { migrated: totalMigrated, errors: totalErrors };
  };

  const scheduleNext = (callback: (newKey: string) => Promise<void>) => {
    const now = new Date();
    const next = new Date(now);

    // Set to target hour/minute
    next.setHours(schedule.hour ?? 2, schedule.minute ?? 0, 0, 0);

    // If past target time today, schedule for tomorrow
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    // Add interval days
    next.setDate(next.getDate() + (schedule.intervalDays ?? 90));

    const msUntilNext = next.getTime() - now.getTime();

    deps.log('info', 'Key rotation scheduled', {
      nextRun: next.toISOString(),
      intervalDays: schedule.intervalDays,
    });

    intervalId = setTimeout(async () => {
      try {
        // Generate new key (in prod, fetch from Vault)
        const newKey = generateMasterKey();
        await callback(newKey);

        // Schedule next rotation
        scheduleNext(callback);
      } catch (err) {
        deps.log('error', 'Key rotation failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }, msUntilNext);
  };

  return {
    /**
     * Starts the key rotation scheduler.
     * The callback receives the new key and should store it in Vault.
     */
    start: (callback: (newKey: string) => Promise<void>) => {
      if (isRunning) return;
      isRunning = true;
      scheduleNext(callback);
    },

    /**
     * Stops the key rotation scheduler.
     */
    stop: () => {
      if (intervalId) {
        clearTimeout(intervalId);
        intervalId = undefined;
      }
      isRunning = false;
    },

    /**
     * Triggers an immediate key rotation.
     * Returns migration statistics.
     */
    rotateNow: async (
      encryptor: FieldEncryptor,
      newKey: string,
    ): Promise<{ migrated: number; errors: number }> => {
      return performRotation(encryptor, newKey);
    },

    /**
     * Updates the rotation schedule.
     */
    configure: (newSchedule: Partial<KeyRotationSchedule>) => {
      Object.assign(schedule, newSchedule);
    },

    /**
     * Returns whether the scheduler is running.
     */
    isRunning: () => isRunning,
  };
};
