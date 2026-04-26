// ============================================
// ABC Express AIP — Ontology Actions
// Write operations exposed through the ontology
// ============================================

import type { ActionTypeDefinition } from './types.js';

export const ALL_ACTION_TYPES: ActionTypeDefinition[] = [
  // ── Shipment Actions ──
  {
    apiName: 'create_shipment',
    displayName: 'Create Shipment',
    description: 'Book a new cargo shipment with sender/receiver details, pricing, and route.',
    objectTypes: ['shipment'],
    triggers: ['MANUAL'],
    allowedRoles: ['ADMIN', 'OPS_MANAGER', 'DISPATCHER', 'BRANCH_STAFF'],
    requiresApproval: false,
    sideEffects: ['Generates connote number', 'Creates PENDING tracking event', 'Emits WebSocket event'],
    endpoint: '/api/shipments',
    method: 'POST',
    parameters: [
      { key: 'clientId', label: 'Client', type: 'objectReference', required: true, referencedObjectType: 'client' },
      { key: 'originBranchId', label: 'Origin Branch', type: 'objectReference', required: true, referencedObjectType: 'branch' },
      { key: 'destinationBranchId', label: 'Destination Branch', type: 'objectReference', required: true, referencedObjectType: 'branch' },
      { key: 'serviceType', label: 'Service Type', type: 'enum', required: true, enumValues: ['REGULAR', 'EXPRESS', 'SAME_DAY', 'CARGO', 'PROJECT_CARGO', 'VEHICLE_TRANSPORT', 'HEAVY_EQUIPMENT', 'EXPORT', 'IMPORT'] },
      { key: 'weightKg', label: 'Weight (kg)', type: 'number', required: true, validation: { min: 0.01, max: 100000 } },
      { key: 'senderName', label: 'Sender Name', type: 'string', required: true },
      { key: 'receiverName', label: 'Receiver Name', type: 'string', required: true },
      { key: 'receiverAddress', label: 'Receiver Address', type: 'string', required: true },
    ],
  },
  {
    apiName: 'update_shipment_status',
    displayName: 'Update Shipment Status',
    description: 'Transition a shipment to a new status with tracking event.',
    objectTypes: ['shipment'],
    triggers: ['MANUAL', 'AI_RECOMMENDED', 'AUTOMATED'],
    allowedRoles: ['ADMIN', 'OPS_MANAGER', 'DISPATCHER', 'BRANCH_STAFF'],
    requiresApproval: false,
    sideEffects: ['Creates tracking event', 'Emits WebSocket status change', 'May trigger invoice generation'],
    endpoint: '/api/shipments/:id/status',
    method: 'PUT',
    parameters: [
      { key: 'status', label: 'New Status', type: 'enum', required: true, enumValues: ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'AT_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'CANCELLED', 'ON_HOLD'] },
      { key: 'location', label: 'Location', type: 'string', required: false },
      { key: 'notes', label: 'Notes', type: 'string', required: false },
    ],
  },
  {
    apiName: 'assign_vehicle_to_shipment',
    displayName: 'Assign Vehicle',
    description: 'Assign a vehicle to transport a shipment.',
    objectTypes: ['shipment', 'vehicle'],
    triggers: ['MANUAL', 'AI_RECOMMENDED'],
    allowedRoles: ['ADMIN', 'OPS_MANAGER', 'DISPATCHER'],
    requiresApproval: false,
    aiConfidenceThreshold: 0.7,
    sideEffects: ['Updates shipment vehicleId', 'May update vehicle status to IN_TRANSIT'],
    endpoint: '/api/shipments/:id',
    method: 'PUT',
    parameters: [
      { key: 'vehicleId', label: 'Vehicle', type: 'objectReference', required: true, referencedObjectType: 'vehicle' },
    ],
  },

  // ── AI Decision Actions ──
  {
    apiName: 'optimize_route',
    displayName: 'Optimize Route',
    description: 'AI recommends optimal route for a shipment based on cost, time, and capacity.',
    objectTypes: ['shipment', 'route'],
    triggers: ['AI_RECOMMENDED'],
    allowedRoles: ['ADMIN', 'OPS_MANAGER'],
    requiresApproval: true,
    aiConfidenceThreshold: 0.75,
    sideEffects: ['Creates AI Decision record', 'Notifies via WebSocket', 'Pending human approval'],
    endpoint: '/api/decisions',
    method: 'POST',
    parameters: [
      { key: 'shipmentId', label: 'Shipment', type: 'objectReference', required: true, referencedObjectType: 'shipment' },
      { key: 'recommendedRouteId', label: 'Recommended Route', type: 'objectReference', required: true, referencedObjectType: 'route' },
      { key: 'alternativeRouteIds', label: 'Alternative Routes', type: 'string', required: false, description: 'Comma-separated route IDs' },
    ],
  },
  {
    apiName: 'approve_ai_decision',
    displayName: 'Approve AI Decision',
    description: 'Human approves an AI recommendation.',
    objectTypes: ['decision'],
    triggers: ['MANUAL'],
    allowedRoles: ['ADMIN', 'OPS_MANAGER', 'DISPATCHER'],
    requiresApproval: false,
    sideEffects: ['Updates decision status', 'May apply recommended changes', 'Emits WebSocket event'],
    endpoint: '/api/decisions/:id/status',
    method: 'PUT',
    parameters: [
      { key: 'status', label: 'Status', type: 'enum', required: true, enumValues: ['HUMAN_APPROVED', 'HUMAN_OVERRIDDEN', 'REJECTED'] },
      { key: 'humanReason', label: 'Reason', type: 'string', required: false },
    ],
  },

  // ── Invoice Actions ──
  {
    apiName: 'create_invoice',
    displayName: 'Create Invoice',
    description: 'Generate an invoice for shipment services.',
    objectTypes: ['invoice'],
    triggers: ['MANUAL', 'AUTOMATED'],
    allowedRoles: ['ADMIN', 'FINANCE_MANAGER'],
    requiresApproval: false,
    sideEffects: ['Generates invoice number', 'Emits WebSocket event'],
    endpoint: '/api/invoices',
    method: 'POST',
    parameters: [
      { key: 'clientId', label: 'Client', type: 'objectReference', required: true, referencedObjectType: 'client' },
      { key: 'shipmentId', label: 'Shipment', type: 'objectReference', required: false, referencedObjectType: 'shipment' },
      { key: 'totalAmount', label: 'Total Amount', type: 'number', required: true, validation: { min: 0 } },
      { key: 'dueDate', label: 'Due Date', type: 'date', required: true },
    ],
  },
  {
    apiName: 'update_invoice_status',
    displayName: 'Update Invoice Status',
    description: 'Change invoice payment status (send, mark paid, void, etc.).',
    objectTypes: ['invoice'],
    triggers: ['MANUAL'],
    allowedRoles: ['ADMIN', 'FINANCE_MANAGER'],
    requiresApproval: false,
    sideEffects: ['Updates payment record', 'Emits WebSocket event'],
    endpoint: '/api/invoices/:id/status',
    method: 'PUT',
    parameters: [
      { key: 'status', label: 'New Status', type: 'enum', required: true, enumValues: ['SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED', 'VOID'] },
      { key: 'paidAmount', label: 'Paid Amount', type: 'number', required: false },
      { key: 'paidDate', label: 'Paid Date', type: 'date', required: false },
    ],
  },

  // ── Vehicle Actions ──
  {
    apiName: 'update_vehicle_status',
    displayName: 'Update Vehicle Status',
    description: 'Change vehicle operational status.',
    objectTypes: ['vehicle'],
    triggers: ['MANUAL', 'AUTOMATED'],
    allowedRoles: ['ADMIN', 'OPS_MANAGER', 'DISPATCHER'],
    requiresApproval: false,
    sideEffects: ['Emits WebSocket event'],
    endpoint: '/api/vehicles/:id',
    method: 'PUT',
    parameters: [
      { key: 'status', label: 'Status', type: 'enum', required: true, enumValues: ['AVAILABLE', 'IN_TRANSIT', 'MAINTENANCE', 'RETIRED'] },
      { key: 'currentBranchId', label: 'Current Branch', type: 'objectReference', required: false, referencedObjectType: 'branch' },
    ],
  },
];
