// ============================================
// ABC Express AIP — Ontology Engine
// Core type definitions for the ontology layer
// Mirrors Palantir Foundry's four-fold ontology:
//   Objects, Links, Actions, Functions
// ============================================

// ─── Object Type Definition ─────────────────────────────────
// An ObjectType maps a domain entity (e.g. Shipment, Vehicle)
// to its data source, properties, search config, and permissions.

/** Primitive and extended property kinds (structured, semantic text, media). */
export type PropertyValueType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'enum'
  | 'json'
  | 'array'
  | 'text'
  | 'richText'
  | 'media'
  | 'geopoint';

export interface PropertySemanticSearchConfig {
  /** Enable full-text or vector-backed search over this field (implementation may be staged). */
  enabled: boolean;
  /** Optional index or model identifier when embeddings are used. */
  embeddingIndexOrModel?: string;
}

export interface PropertyMediaConfig {
  allowedKinds: Array<'image' | 'video' | 'document' | 'audio'>;
  maxBytes?: number;
  /** e.g. s3:// or https URL pattern for stored blobs */
  storagePatternHint?: string;
}

/** Extra constraints and context for value types (currency, ranges, regex). */
export interface PropertyValueConstraints {
  min?: number;
  max?: number;
  pattern?: string;
  unit?: string;
  currency?: string;
  /** Link to an ontology enum or reference table */
  referenceEnumName?: string;
}

export interface PropertyDefinition {
  /** Property key on the object */
  key: string;
  /** Display label */
  label: string;
  /** Data type (core scalars, JSON, and extended primitives) */
  type: PropertyValueType;
  /** Enum values if type is 'enum' */
  enumValues?: string[];
  /** Whether this property is required */
  required?: boolean;
  /** Whether this property is searchable (column / FT index) */
  searchable?: boolean;
  /** When type is 'text' or 'richText', optional semantic/vector search */
  semanticSearch?: PropertySemanticSearchConfig;
  /** When type is 'media' */
  media?: PropertyMediaConfig;
  /** Value constraints and units */
  constraints?: PropertyValueConstraints;
  /** Whether this property is sortable */
  sortable?: boolean;
  /** Whether this property is filterable */
  filterable?: boolean;
  /** Human-readable description */
  description?: string;
  /** Default unit of measurement (e.g. 'kg', 'km', 'IDR') */
  unit?: string;
  /** Whether this is a primary key */
  primaryKey?: boolean;
  /** Display format hint */
  displayFormat?: string;
}

export interface ObjectTypeDefinition {
  /** Unique API name (e.g. 'shipment', 'vehicle') */
  apiName: string;
  /** Human-readable display name */
  displayName: string;
  /** Plural display name */
  pluralName: string;
  /** Description */
  description: string;
  /** Icon identifier for UI */
  icon: string;
  /** The Prisma model name this maps to */
  dataSource: string;
  /** Primary key property */
  primaryKeyProperty: string;
  /** Title property (used for display) */
  titleProperty: string;
  /** Properties schema */
  properties: PropertyDefinition[];
  /** Which roles can read this object type */
  readRoles: string[];
  /** Which roles can write (create/update) this object type */
  writeRoles: string[];
  /** Tags for categorization */
  tags: string[];
}

// ─── Link Type Definition ───────────────────────────────────
// A LinkType defines a relationship between two ObjectTypes.

export type LinkCardinality = 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';

export interface LinkTypeDefinition {
  /** Unique API name (e.g. 'shipment_has_origin_branch') */
  apiName: string;
  /** Display name */
  displayName: string;
  /** Description */
  description: string;
  /** Source object type apiName */
  sourceObjectType: string;
  /** Target object type apiName */
  targetObjectType: string;
  /** Cardinality */
  cardinality: LinkCardinality;
  /** Foreign key property on source that references target */
  foreignKeyProperty: string;
  /** Reverse link display name (viewed from target side) */
  reverseDisplayName: string;
  /** Whether this link is required */
  required?: boolean;
}

// ─── Action Type Definition ─────────────────────────────────
// An ActionType defines a mutation that can be performed on
// one or more objects. Actions are the write API of the ontology.

export interface ActionParameterDefinition {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'enum' | 'objectReference';
  required: boolean;
  description?: string;
  enumValues?: string[];
  /** If objectReference, which object type */
  referencedObjectType?: string;
  defaultValue?: unknown;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export type ActionTrigger = 'MANUAL' | 'AI_RECOMMENDED' | 'AUTOMATED' | 'SCHEDULED';

export interface ActionTypeDefinition {
  /** Unique API name (e.g. 'update_shipment_status') */
  apiName: string;
  /** Display name */
  displayName: string;
  /** Description */
  description: string;
  /** Which object type(s) this action operates on */
  objectTypes: string[];
  /** Parameters the action accepts */
  parameters: ActionParameterDefinition[];
  /** How this action can be triggered */
  triggers: ActionTrigger[];
  /** Roles that can execute this action */
  allowedRoles: string[];
  /** Whether this action requires human approval when AI-triggered */
  requiresApproval: boolean;
  /** Confidence threshold below which AI must escalate to human */
  aiConfidenceThreshold?: number;
  /** Side effects description (for audit) */
  sideEffects: string[];
  /** API endpoint this maps to */
  endpoint: string;
  /** HTTP method */
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}

// ─── Function Definition ────────────────────────────────────
// A Function is a read-only computation over ontology objects.
// Used for derived metrics, aggregations, scoring.

export interface FunctionParameterDefinition {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'objectReference';
  required: boolean;
  description?: string;
}

export type FunctionReturnType = 'number' | 'string' | 'boolean' | 'object' | 'array';

export interface FunctionDefinition {
  /** Unique API name */
  apiName: string;
  /** Display name */
  displayName: string;
  /** Description */
  description: string;
  /** Input parameters */
  parameters: FunctionParameterDefinition[];
  /** Return type */
  returnType: FunctionReturnType;
  /** Object types this function queries */
  inputObjectTypes: string[];
  /** Whether this is an aggregation function */
  isAggregation: boolean;
  /** Roles that can invoke this function */
  allowedRoles: string[];
  /** Caching TTL in seconds (0 = no cache) */
  cacheTtlSeconds: number;
}

// ─── Ontology Manifest ──────────────────────────────────────
// The complete ontology definition for the platform.

export interface OntologyManifest {
  version: string;
  name: string;
  description: string;
  objectTypes: ObjectTypeDefinition[];
  linkTypes: LinkTypeDefinition[];
  actionTypes: ActionTypeDefinition[];
  functions: FunctionDefinition[];
}
