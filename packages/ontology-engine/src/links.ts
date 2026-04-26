// ============================================
// ABC Express AIP — Ontology Link Types
// Relationships between domain objects
// ============================================

import type { LinkTypeDefinition } from './types.js';

export const ALL_LINK_TYPES: LinkTypeDefinition[] = [
  // ── Shipment relationships ──
  {
    apiName: 'shipment_origin_branch',
    displayName: 'Origin Branch',
    description: 'The branch where the shipment originates.',
    sourceObjectType: 'shipment',
    targetObjectType: 'branch',
    cardinality: 'MANY_TO_ONE',
    foreignKeyProperty: 'originBranchId',
    reverseDisplayName: 'Outbound Shipments',
    required: true,
  },
  {
    apiName: 'shipment_destination_branch',
    displayName: 'Destination Branch',
    description: 'The branch where the shipment is destined.',
    sourceObjectType: 'shipment',
    targetObjectType: 'branch',
    cardinality: 'MANY_TO_ONE',
    foreignKeyProperty: 'destinationBranchId',
    reverseDisplayName: 'Inbound Shipments',
    required: true,
  },
  {
    apiName: 'shipment_client',
    displayName: 'Client',
    description: 'The client who owns this shipment.',
    sourceObjectType: 'shipment',
    targetObjectType: 'client',
    cardinality: 'MANY_TO_ONE',
    foreignKeyProperty: 'clientId',
    reverseDisplayName: 'Shipments',
    required: true,
  },
  {
    apiName: 'shipment_vehicle',
    displayName: 'Assigned Vehicle',
    description: 'The vehicle assigned to transport this shipment.',
    sourceObjectType: 'shipment',
    targetObjectType: 'vehicle',
    cardinality: 'MANY_TO_ONE',
    foreignKeyProperty: 'vehicleId',
    reverseDisplayName: 'Assigned Shipments',
    required: false,
  },
  {
    apiName: 'shipment_route',
    displayName: 'Route',
    description: 'The route used for this shipment.',
    sourceObjectType: 'shipment',
    targetObjectType: 'route',
    cardinality: 'MANY_TO_ONE',
    foreignKeyProperty: 'routeId',
    reverseDisplayName: 'Shipments on Route',
    required: false,
  },

  // ── Invoice relationships ──
  {
    apiName: 'invoice_client',
    displayName: 'Billed Client',
    description: 'The client this invoice is billed to.',
    sourceObjectType: 'invoice',
    targetObjectType: 'client',
    cardinality: 'MANY_TO_ONE',
    foreignKeyProperty: 'clientId',
    reverseDisplayName: 'Invoices',
    required: true,
  },
  {
    apiName: 'invoice_shipment',
    displayName: 'Shipment',
    description: 'The shipment this invoice covers.',
    sourceObjectType: 'invoice',
    targetObjectType: 'shipment',
    cardinality: 'MANY_TO_ONE',
    foreignKeyProperty: 'shipmentId',
    reverseDisplayName: 'Invoice',
    required: false,
  },

  // ── Cost relationships ──
  {
    apiName: 'cost_shipment',
    displayName: 'Shipment',
    description: 'The shipment this cost was incurred for.',
    sourceObjectType: 'costEntry',
    targetObjectType: 'shipment',
    cardinality: 'MANY_TO_ONE',
    foreignKeyProperty: 'shipmentId',
    reverseDisplayName: 'Cost Entries',
    required: true,
  },

  // ── Route relationships ──
  {
    apiName: 'route_origin_branch',
    displayName: 'Origin Branch',
    description: 'Starting branch of the route.',
    sourceObjectType: 'route',
    targetObjectType: 'branch',
    cardinality: 'MANY_TO_ONE',
    foreignKeyProperty: 'originBranchId',
    reverseDisplayName: 'Outbound Routes',
    required: true,
  },
  {
    apiName: 'route_destination_branch',
    displayName: 'Destination Branch',
    description: 'Ending branch of the route.',
    sourceObjectType: 'route',
    targetObjectType: 'branch',
    cardinality: 'MANY_TO_ONE',
    foreignKeyProperty: 'destinationBranchId',
    reverseDisplayName: 'Inbound Routes',
    required: true,
  },

  // ── Vehicle relationships ──
  {
    apiName: 'vehicle_current_branch',
    displayName: 'Current Branch',
    description: 'The branch where the vehicle is currently located.',
    sourceObjectType: 'vehicle',
    targetObjectType: 'branch',
    cardinality: 'MANY_TO_ONE',
    foreignKeyProperty: 'currentBranchId',
    reverseDisplayName: 'Vehicles at Branch',
    required: false,
  },

  // ── Decision relationships ──
  {
    apiName: 'decision_proposal',
    displayName: 'Source proposal',
    description: 'When set, this decision was materialized from a merged proposal (1:1).',
    sourceObjectType: 'decision',
    targetObjectType: 'proposal',
    cardinality: 'ONE_TO_ONE',
    foreignKeyProperty: 'proposalId',
    reverseDisplayName: 'Merged decision',
    required: false,
  },
  {
    apiName: 'decision_user',
    displayName: 'Decided By',
    description: 'The human who approved/overrode the decision.',
    sourceObjectType: 'decision',
    targetObjectType: 'user',
    cardinality: 'MANY_TO_ONE',
    foreignKeyProperty: 'decidedById',
    reverseDisplayName: 'Decisions Made',
    required: false,
  },
  {
    apiName: 'proposal_author',
    displayName: 'Created by',
    description: 'User who authored the proposal.',
    sourceObjectType: 'proposal',
    targetObjectType: 'user',
    cardinality: 'MANY_TO_ONE',
    foreignKeyProperty: 'createdById',
    reverseDisplayName: 'Authored proposals',
    required: false,
  },

  // ── User relationships ──
  {
    apiName: 'user_branch',
    displayName: 'Assigned Branch',
    description: 'The branch this user is assigned to.',
    sourceObjectType: 'user',
    targetObjectType: 'branch',
    cardinality: 'MANY_TO_ONE',
    foreignKeyProperty: 'branchId',
    reverseDisplayName: 'Staff',
    required: false,
  },
];
