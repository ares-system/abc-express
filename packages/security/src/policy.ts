// ─────────────────────────────────────────────────────────────
// OPA-Style Policy Engine — RBAC + Rate Limiting per Divisi
// Embedded policy evaluator (no external OPA server needed).
// Supports declarative policies for role→resource→action
// and division-level rate limiting.
// ─────────────────────────────────────────────────────────────

// ─── Types ──────────────────────────────────────────────────

export type Role =
  | 'ADMIN'
  | 'OPS_MANAGER'
  | 'FINANCE_MANAGER'
  | 'DISPATCHER'
  | 'BRANCH_STAFF'
  | 'VIEWER';

export type Resource =
  | 'shipments'
  | 'vehicles'
  | 'routes'
  | 'branches'
  | 'clients'
  | 'invoices'
  | 'costs'
  | 'decisions'
  | 'dashboard'
  | 'settings'
  | 'users'
  | 'ontology'
  | 'jobs';

export type Action = 'read' | 'create' | 'update' | 'delete' | 'approve' | 'export';

export interface PolicyInput {
  subject: {
    role: Role;
    userId: string;
    branchId?: string | null;
    agentId?: string;
    divisi?: string; // Division for rate limiting
  };
  resource: Resource;
  action: Action;
  context?: {
    /** Target branch for branch-scoped access */
    targetBranchId?: string;
    /** Request path for rate limit key */
    requestPath?: string;
    /** IP address */
    ip?: string;
  };
}

export interface PolicyDecision {
  allowed: boolean;
  reason: string;
  /** Applicable rate limit tier */
  rateLimit?: RateLimitTier;
  /** Data filter constraints (e.g. branch scoping) */
  filters?: Record<string, any>;
}

export interface RateLimitTier {
  /** Max requests */
  maxRequests: number;
  /** Window in seconds */
  windowSec: number;
  /** Rate limit key suffix */
  keyPrefix: string;
}

// ─── RBAC Policy Matrix ─────────────────────────────────────

type PermissionMatrix = Record<Role, Partial<Record<Resource, Action[]>>>;

const RBAC_MATRIX: PermissionMatrix = {
  ADMIN: {
    shipments: ['read', 'create', 'update', 'delete', 'export'],
    vehicles: ['read', 'create', 'update', 'delete'],
    routes: ['read', 'create', 'update', 'delete'],
    branches: ['read', 'create', 'update', 'delete'],
    clients: ['read', 'create', 'update', 'delete'],
    invoices: ['read', 'create', 'update', 'delete', 'export'],
    costs: ['read', 'create', 'update', 'delete', 'export'],
    decisions: ['read', 'create', 'update', 'approve'],
    dashboard: ['read', 'export'],
    settings: ['read', 'update'],
    users: ['read', 'create', 'update', 'delete'],
    ontology: ['read'],
    jobs: ['read', 'create'],
  },

  OPS_MANAGER: {
    shipments: ['read', 'create', 'update', 'export'],
    vehicles: ['read', 'create', 'update'],
    routes: ['read', 'create', 'update'],
    branches: ['read', 'update'],
    clients: ['read', 'create', 'update'],
    invoices: ['read', 'export'],
    costs: ['read', 'create', 'export'],
    decisions: ['read', 'create', 'update', 'approve'],
    dashboard: ['read', 'export'],
    ontology: ['read'],
    jobs: ['read', 'create'],
  },

  FINANCE_MANAGER: {
    shipments: ['read', 'export'],
    vehicles: ['read'],
    routes: ['read'],
    branches: ['read'],
    clients: ['read', 'update'],
    invoices: ['read', 'create', 'update', 'export'],
    costs: ['read', 'create', 'update', 'delete', 'export'],
    decisions: ['read', 'approve'],
    dashboard: ['read', 'export'],
    ontology: ['read'],
  },

  DISPATCHER: {
    shipments: ['read', 'create', 'update'],
    vehicles: ['read', 'update'],
    routes: ['read'],
    branches: ['read'],
    clients: ['read'],
    invoices: ['read'],
    costs: ['read'],
    decisions: ['read'],
    dashboard: ['read'],
    ontology: ['read'],
  },

  BRANCH_STAFF: {
    shipments: ['read', 'create', 'update'],
    vehicles: ['read'],
    routes: ['read'],
    branches: ['read'],
    clients: ['read'],
    invoices: ['read'],
    costs: ['read'],
    decisions: ['read'],
    dashboard: ['read'],
  },

  VIEWER: {
    shipments: ['read'],
    vehicles: ['read'],
    routes: ['read'],
    branches: ['read'],
    clients: ['read'],
    invoices: ['read'],
    costs: ['read'],
    decisions: ['read'],
    dashboard: ['read'],
  },
};

// ─── Rate Limit Tiers per Division ──────────────────────────

type DivisionRateLimits = Record<string, RateLimitTier>;

const DIVISION_RATE_LIMITS: DivisionRateLimits = {
  // Operations division — high throughput
  operations: {
    maxRequests: 500,
    windowSec: 60,
    keyPrefix: 'rl:ops',
  },
  // Finance division — moderate
  finance: {
    maxRequests: 200,
    windowSec: 60,
    keyPrefix: 'rl:fin',
  },
  // Branch staff — conservative
  branch: {
    maxRequests: 100,
    windowSec: 60,
    keyPrefix: 'rl:branch',
  },
  // AI agents — burst-friendly, lower sustained
  agent: {
    maxRequests: 300,
    windowSec: 60,
    keyPrefix: 'rl:agent',
  },
  // Default / viewer
  default: {
    maxRequests: 60,
    windowSec: 60,
    keyPrefix: 'rl:default',
  },
};

// Map roles → default divisions
const ROLE_DIVISION_MAP: Record<Role, string> = {
  ADMIN: 'operations',
  OPS_MANAGER: 'operations',
  FINANCE_MANAGER: 'finance',
  DISPATCHER: 'operations',
  BRANCH_STAFF: 'branch',
  VIEWER: 'default',
};

// ─── Policy Engine ──────────────────────────────────────────

export class PolicyEngine {
  private customPolicies: Array<(input: PolicyInput) => PolicyDecision | null> =
    [];

  /**
   * Register a custom policy rule. Evaluated before default RBAC.
   * Return null to fall through to next policy.
   */
  addPolicy(fn: (input: PolicyInput) => PolicyDecision | null): void {
    this.customPolicies.push(fn);
  }

  /**
   * Evaluate a policy decision for the given input.
   */
  evaluate(input: PolicyInput): PolicyDecision {
    // 1. Check custom policies first
    for (const policy of this.customPolicies) {
      const result = policy(input);
      if (result !== null) return result;
    }

    // 2. RBAC matrix check
    const rolePerms = RBAC_MATRIX[input.subject.role];
    if (!rolePerms) {
      return {
        allowed: false,
        reason: `Unknown role: ${input.subject.role}`,
      };
    }

    const resourcePerms = rolePerms[input.resource];
    if (!resourcePerms) {
      return {
        allowed: false,
        reason: `Role ${input.subject.role} has no access to ${input.resource}`,
      };
    }

    if (!resourcePerms.includes(input.action)) {
      return {
        allowed: false,
        reason: `Role ${input.subject.role} cannot ${input.action} on ${input.resource}`,
      };
    }

    // 3. Branch scoping for BRANCH_STAFF and DISPATCHER
    const filters: Record<string, any> = {};
    if (
      ['BRANCH_STAFF', 'DISPATCHER'].includes(input.subject.role) &&
      input.subject.branchId
    ) {
      // These roles can only see data from their own branch
      if (
        input.context?.targetBranchId &&
        input.context.targetBranchId !== input.subject.branchId
      ) {
        return {
          allowed: false,
          reason: `Branch-scoped access denied: user branch ${input.subject.branchId} cannot access branch ${input.context.targetBranchId}`,
        };
      }
      filters.branchId = input.subject.branchId;
    }

    // 4. Determine rate limit tier
    const divisi =
      input.subject.divisi ??
      (input.subject.agentId
        ? 'agent'
        : ROLE_DIVISION_MAP[input.subject.role] ?? 'default');

    const rateLimit =
      DIVISION_RATE_LIMITS[divisi] ?? DIVISION_RATE_LIMITS.default;

    return {
      allowed: true,
      reason: 'Allowed by RBAC policy',
      rateLimit,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    };
  }

  /**
   * Quick boolean check — convenience wrapper.
   */
  isAllowed(input: PolicyInput): boolean {
    return this.evaluate(input).allowed;
  }
}

// ─── Express middleware factory ──────────────────────────────

export interface PolicyMiddlewareOptions {
  engine: PolicyEngine;
  resource: Resource;
  action: Action;
}

/**
 * Express middleware that enforces OPA-style policy decisions.
 * Requires req.user to be set (run after auth middleware).
 * Attaches req.policyDecision for downstream use.
 */
export const policyMiddleware = (opts: PolicyMiddlewareOptions) => {
  return (req: any, res: any, next: any) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required for policy evaluation',
        code: 'POLICY_NO_AUTH',
      });
    }

    const input: PolicyInput = {
      subject: {
        role: user.role as Role,
        userId: user.userId ?? user.sub,
        branchId: user.branchId,
        agentId: user.agentId,
      },
      resource: opts.resource,
      action: opts.action,
      context: {
        targetBranchId: req.params.branchId ?? req.query.branchId,
        requestPath: req.path,
        ip: req.ip,
      },
    };

    const decision = opts.engine.evaluate(input);

    if (!decision.allowed) {
      return res.status(403).json({
        success: false,
        error: decision.reason,
        code: 'POLICY_DENIED',
      });
    }

    // Attach decision for downstream use (filtering, rate limits)
    req.policyDecision = decision;
    next();
  };
};

// ─── Redis-backed rate limiter (per-division) ───────────────

export interface RateLimiterDeps {
  /** Redis client with incr + expire commands */
  redis: {
    incr(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<void>;
    ttl(key: string): Promise<number>;
  };
}

/**
 * Express middleware for division-aware rate limiting.
 * Reads rate limit tier from req.policyDecision (set by policyMiddleware).
 */
export const divisionRateLimitMiddleware = (deps: RateLimiterDeps) => {
  return async (req: any, res: any, next: any) => {
    const decision = req.policyDecision as PolicyDecision | undefined;
    const tier = decision?.rateLimit ?? DIVISION_RATE_LIMITS.default;

    // Guard: tier must exist after fallback
    if (!tier) {
      return next();
    }

    const userId = req.user?.userId ?? req.user?.sub ?? 'anon';
    const key = `${tier.keyPrefix}:${userId}`;

    try {
      const count = await deps.redis.incr(key);

      if (count === 1) {
        await deps.redis.expire(key, tier.windowSec);
      }

      // Set rate limit headers
      const ttl = await deps.redis.ttl(key);
      res.setHeader('X-RateLimit-Limit', tier.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, tier.maxRequests - count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + ttl);

      if (count > tier.maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          code: 'RATE_LIMITED',
          retryAfter: ttl,
        });
      }

      next();
    } catch (err) {
      // Fail open on Redis errors — log but don't block
      console.error('[policy] Rate limit check failed:', err);
      next();
    }
  };
};

// ─── Singleton ──────────────────────────────────────────────

export const policyEngine = new PolicyEngine();
