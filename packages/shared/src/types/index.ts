// ============================================
// ABC Express AIP — Shared Type Definitions
// Core ontology types for the entire platform
// ============================================

// ---- Enums ----

export enum ServiceType {
  CARGO = 'CARGO',
  PROJECT_CARGO = 'PROJECT_CARGO',
  VEHICLE_HEAVY_EQUIPMENT = 'VEHICLE_HEAVY_EQUIPMENT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
}

export enum ShipmentStatus {
  DRAFT = 'DRAFT',
  BOOKED = 'BOOKED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  AT_HUB = 'AT_HUB',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
  EXCEPTION = 'EXCEPTION',
}

export enum BranchType {
  HUB = 'HUB',
  BRANCH = 'BRANCH',
  AGENT = 'AGENT',
  WAREHOUSE = 'WAREHOUSE',
  PORT = 'PORT',
}

export enum VehicleType {
  TRUCK_SMALL = 'TRUCK_SMALL',
  TRUCK_MEDIUM = 'TRUCK_MEDIUM',
  TRUCK_LARGE = 'TRUCK_LARGE',
  TRAILER = 'TRAILER',
  CONTAINER = 'CONTAINER',
  SHIP = 'SHIP',
  PLANE = 'PLANE',
}

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  IN_TRANSIT = 'IN_TRANSIT',
  MAINTENANCE = 'MAINTENANCE',
  LOADING = 'LOADING',
  UNLOADING = 'UNLOADING',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export enum ClientType {
  INDIVIDUAL = 'INDIVIDUAL',
  CORPORATE = 'CORPORATE',
  GOVERNMENT = 'GOVERNMENT',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum CostCategory {
  FUEL = 'FUEL',
  LABOR = 'LABOR',
  VEHICLE_MAINTENANCE = 'VEHICLE_MAINTENANCE',
  TOLL = 'TOLL',
  PORT_FEES = 'PORT_FEES',
  CUSTOMS = 'CUSTOMS',
  INSURANCE = 'INSURANCE',
  PACKAGING = 'PACKAGING',
  STORAGE = 'STORAGE',
  OVERHEAD = 'OVERHEAD',
  OTHER = 'OTHER',
}

export enum TransportMode {
  ROAD = 'ROAD',
  SEA = 'SEA',
  AIR = 'AIR',
  RAIL = 'RAIL',
  MULTIMODAL = 'MULTIMODAL',
}

export enum DecisionType {
  SHIPMENT_ROUTING = 'SHIPMENT_ROUTING',
  PRICING = 'PRICING',
  DISPATCH = 'DISPATCH',
  ESCALATION = 'ESCALATION',
  COST_OPTIMIZATION = 'COST_OPTIMIZATION',
  CAPACITY_PLANNING = 'CAPACITY_PLANNING',
}

export enum DecisionStatus {
  PENDING = 'PENDING',
  AI_RECOMMENDED = 'AI_RECOMMENDED',
  HUMAN_APPROVED = 'HUMAN_APPROVED',
  HUMAN_OVERRIDDEN = 'HUMAN_OVERRIDDEN',
  EXECUTED = 'EXECUTED',
  REJECTED = 'REJECTED',
}

/** Pre-decision artifact; merge creates a linked Decision (see Decision.proposalId). */
export enum ProposalStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  MERGED = 'MERGED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  OPS_MANAGER = 'OPS_MANAGER',
  FINANCE_MANAGER = 'FINANCE_MANAGER',
  DISPATCHER = 'DISPATCHER',
  BRANCH_STAFF = 'BRANCH_STAFF',
  VIEWER = 'VIEWER',
}

export enum ShipmentEventType {
  CREATED = 'CREATED',
  PICKED_UP = 'PICKED_UP',
  ARRIVED_AT_HUB = 'ARRIVED_AT_HUB',
  DEPARTED_HUB = 'DEPARTED_HUB',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  EXCEPTION = 'EXCEPTION',
  ON_HOLD = 'ON_HOLD',
  RETURNED = 'RETURNED',
  NOTE_ADDED = 'NOTE_ADDED',
}

// ---- Core Entity Interfaces ----

export interface Branch {
  id: string;
  code: string;
  name: string;
  city: string;
  province: string;
  region: string;
  type: BranchType;
  address: string;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  capacity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  code: string;
  name: string;
  type: ClientType;
  companyName: string | null;
  email: string | null;
  phone: string;
  address: string;
  city: string;
  province: string;
  npwp: string | null;
  creditLimit: number;
  outstandingBalance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  type: VehicleType;
  brand: string | null;
  model: string | null;
  year: number | null;
  capacityKg: number;
  capacityM3: number;
  status: VehicleStatus;
  currentBranchId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  lastMaintenanceDate: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Route {
  id: string;
  code: string;
  originBranchId: string;
  destinationBranchId: string;
  mode: TransportMode;
  distanceKm: number;
  estimatedHours: number;
  baseCostPerKg: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Shipment {
  id: string;
  connoteNumber: string;
  clientId: string;
  originBranchId: string;
  destinationBranchId: string;
  currentBranchId: string | null;
  routeId: string | null;
  vehicleId: string | null;
  serviceType: ServiceType;
  status: ShipmentStatus;
  description: string;
  weightKg: number;
  volumeM3: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  pieces: number;
  declaredValue: number | null;
  isInsured: boolean;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  estimatedDeliveryDate: Date | null;
  actualDeliveryDate: Date | null;
  specialInstructions: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShipmentEvent {
  id: string;
  shipmentId: string;
  type: ShipmentEventType;
  branchId: string | null;
  description: string;
  notes: string | null;
  createdBy: string | null;
  timestamp: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  shipmentId: string;
  clientId: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  issuedDate: Date;
  dueDate: Date;
  paidDate: Date | null;
  paidAmount: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CostEntry {
  id: string;
  shipmentId: string;
  category: CostCategory;
  amount: number;
  description: string;
  vendorName: string | null;
  receiptNumber: string | null;
  incurredDate: Date;
  createdAt: Date;
}

export interface Proposal {
  id: string;
  type: DecisionType;
  entityType: string;
  entityId: string;
  proposedPayload: Record<string, unknown>;
  rationale: string;
  confidence: number;
  modelInputSnapshot: Record<string, unknown> | null;
  status: ProposalStatus;
  source: string | null;
  createdById: string | null;
  mergedAt: Date | null;
  rejectReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Decision {
  id: string;
  type: DecisionType;
  entityType: string;
  entityId: string;
  /** When set, this decision was materialized from a merged Proposal. */
  proposalId: string | null;
  aiRecommendation: Record<string, unknown>;
  aiConfidence: number;
  aiReasoning: string;
  humanDecision: Record<string, unknown> | null;
  humanReasoning: string | null;
  decidedById: string | null;
  decidedAt: Date | null;
  modelInputSnapshot: Record<string, unknown> | null;
  executionError: string | null;
  outcomeSnapshot: Record<string, unknown> | null;
  outcomeEvaluatedAt: Date | null;
  status: DecisionStatus;
  executedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branchId: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ---- API Types ----

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// ---- Dashboard / Aggregation Types ----

export interface OperationsSummary {
  totalShipments: number;
  activeShipments: number;
  deliveredToday: number;
  exceptionsCount: number;
  onTimeDeliveryRate: number;
  avgDeliveryHours: number;
  vehicleUtilization: number;
  branchUtilization: Record<string, number>;
}

export interface FinanceSummary {
  totalRevenue: number;
  totalCosts: number;
  grossMargin: number;
  outstandingReceivables: number;
  overdueInvoices: number;
  avgCostPerShipment: number;
  revenueByService: Record<ServiceType, number>;
  costByCategory: Record<CostCategory, number>;
}

export interface ShipmentTrackingResult {
  shipment: Shipment;
  events: ShipmentEvent[];
  currentLocation: {
    branch: Branch | null;
    estimatedArrival: Date | null;
  };
}
