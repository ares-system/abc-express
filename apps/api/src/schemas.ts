// ============================================
// ABC Express AIP — Zod Schemas for Validation
// ============================================

import { z } from 'zod';

// ---- Auth ----

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

// ---- Branches ----

export const createBranchSchema = z.object({
  code: z.string().min(3).max(10),
  name: z.string().min(2).max(100),
  city: z.string().min(2).max(50),
  province: z.string().min(2).max(50),
  region: z.string().min(2).max(50),
  type: z.enum(['HUB', 'BRANCH', 'SUB_BRANCH', 'WAREHOUSE', 'PORT']),
  address: z.string().min(5).max(255),
  phone: z.string().min(8).max(20),
  latitude: z.number().min(-11).max(6).optional(),
  longitude: z.number().min(95).max(141).optional(),
  capacity: z.number().int().positive().optional(),
});

export const updateBranchSchema = createBranchSchema.partial();

// ---- Clients ----

export const createClientSchema = z.object({
  code: z.string().min(3).max(20),
  name: z.string().min(2).max(100),
  type: z.enum(['CORPORATE', 'INDIVIDUAL', 'GOVERNMENT']),
  companyName: z.string().max(150).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(8).max(20),
  address: z.string().min(5).max(255),
  city: z.string().min(2).max(50),
  province: z.string().min(2).max(50),
  npwp: z.string().max(30).optional().nullable(),
  creditLimit: z.number().nonnegative().optional(),
});

export const updateClientSchema = createClientSchema.partial();

// ---- Vehicles ----

export const createVehicleSchema = z.object({
  plateNumber: z.string().min(4).max(15),
  type: z.enum(['TRUCK_SMALL', 'TRUCK_MEDIUM', 'TRUCK_LARGE', 'TRAILER', 'CONTAINER', 'PICKUP', 'VAN']),
  brand: z.string().min(2).max(50),
  model: z.string().min(1).max(50),
  year: z.number().int().min(2000).max(2030),
  capacityKg: z.number().positive(),
  capacityM3: z.number().positive().optional().nullable(),
  status: z.enum(['AVAILABLE', 'IN_TRANSIT', 'MAINTENANCE', 'RETIRED']).optional(),
  currentBranchId: z.string().uuid().optional().nullable(),
  driverName: z.string().max(100).optional().nullable(),
  driverPhone: z.string().max(20).optional().nullable(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

// ---- Shipments ----

export const createShipmentSchema = z.object({
  clientId: z.string().uuid(),
  originBranchId: z.string().uuid(),
  destinationBranchId: z.string().uuid(),
  serviceType: z.enum(['CARGO', 'PROJECT_CARGO', 'VEHICLE_HEAVY_EQUIPMENT', 'EXPORT', 'IMPORT']),
  description: z.string().min(2).max(500),
  weightKg: z.number().positive(),
  volumeM3: z.number().positive().optional(),
  lengthCm: z.number().positive().optional(),
  widthCm: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  pieces: z.number().int().positive().default(1),
  declaredValue: z.number().nonnegative().optional(),
  isInsured: z.boolean().default(false),
  senderName: z.string().min(2).max(100),
  senderPhone: z.string().min(8).max(20),
  senderAddress: z.string().min(5).max(255),
  receiverName: z.string().min(2).max(100),
  receiverPhone: z.string().min(8).max(20),
  receiverAddress: z.string().min(5).max(255),
  estimatedDeliveryDate: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
});

export const updateShipmentStatusSchema = z.object({
  status: z.enum([
    'DRAFT', 'BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'AT_HUB',
    'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'CANCELLED', 'EXCEPTION',
  ]),
  description: z.string().max(500).optional(),
  branchId: z.string().uuid().optional(),
});

// ---- Invoices ----

export const createInvoiceSchema = z.object({
  shipmentId: z.string().uuid(),
  clientId: z.string().uuid(),
  subtotal: z.number().nonnegative(),
  taxAmount: z.number().nonnegative(),
  totalAmount: z.number().nonnegative(),
  dueDate: z.string().datetime(),
  notes: z.string().max(1000).optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED']),
  paidAmount: z.number().nonnegative().optional(),
  paidDate: z.string().datetime().optional(),
});

// ---- Cost Entries ----

export const createCostEntrySchema = z.object({
  shipmentId: z.string().uuid(),
  category: z.enum(['FUEL', 'LABOR', 'TOLL', 'VEHICLE_MAINTENANCE', 'INSURANCE', 'PACKAGING', 'STORAGE', 'OVERHEAD', 'OTHER']),
  amount: z.number().positive(),
  description: z.string().max(255).optional(),
  vendorName: z.string().max(100).optional().nullable(),
  incurredDate: z.string().datetime().optional(),
});

// ---- Routes ----

export const createRouteSchema = z.object({
  code: z.string().min(3).max(20),
  originBranchId: z.string().uuid(),
  destinationBranchId: z.string().uuid(),
  mode: z.enum(['ROAD', 'SEA', 'AIR', 'MULTIMODAL']),
  distanceKm: z.number().positive(),
  estimatedHours: z.number().positive(),
  baseCostPerKg: z.number().nonnegative(),
});

export const updateRouteSchema = createRouteSchema.partial();

// ---- Decisions ----

export const decisionTypeSchema = z.enum([
  'SHIPMENT_ROUTING',
  'PRICING',
  'DISPATCH',
  'ESCALATION',
  'COST_OPTIMIZATION',
  'CAPACITY_PLANNING',
]);

export const createDecisionSchema = z.object({
  type: decisionTypeSchema,
  entityType: z.string().min(1).max(50),
  entityId: z.string().uuid(),
  aiRecommendation: z.record(z.unknown()),
  aiConfidence: z.number().min(0).max(1),
  aiReasoning: z.string().max(2000),
  modelInputSnapshot: z.record(z.unknown()).optional(),
});

/** Human resolution from AI_RECOMMENDED — cannot set EXECUTED (system only) */
export const updateDecisionStatusSchema = z.object({
  status: z.enum(['HUMAN_APPROVED', 'HUMAN_OVERRIDDEN', 'REJECTED']),
  humanDecision: z.record(z.unknown()).optional(),
  humanReasoning: z.string().max(1000).optional(),
});

// ---- Proposals (pre-decision → merge into Decision) ----

export const proposalStatusSchema = z.enum(['DRAFT', 'SUBMITTED', 'MERGED', 'REJECTED', 'CANCELLED']);

export const createProposalSchema = z.object({
  type: decisionTypeSchema,
  entityType: z.string().min(1).max(50),
  entityId: z.string().uuid(),
  proposedPayload: z.record(z.unknown()),
  rationale: z.string().min(1).max(8000),
  confidence: z.number().min(0).max(1),
  modelInputSnapshot: z.record(z.unknown()).optional(),
  /** When SUBMITTED, ready to merge without a separate submit call */
  status: z.enum(['DRAFT', 'SUBMITTED']).optional(),
  source: z.string().min(1).max(64).optional(),
});

export const updateProposalSchema = z.object({
  proposedPayload: z.record(z.unknown()).optional(),
  rationale: z.string().min(1).max(8000).optional(),
  confidence: z.number().min(0).max(1).optional(),
  modelInputSnapshot: z.record(z.unknown()).optional().nullable(),
  source: z.string().min(1).max(64).optional().nullable(),
});

export const rejectProposalSchema = z.object({
  reason: z.string().min(1).max(2000),
});

// ---- Deep Agent (JS / LangChain) ----

export const deepAgentInvokeSchema = z.object({
  message: z.string().min(1).max(32_000),
  threadId: z.string().min(1).max(200).optional(),
});
