// ============================================
// ABC Express AIP — Ontology Functions
// Read-only computations and aggregations
// ============================================

import type { FunctionDefinition } from './types.js';

export const ALL_FUNCTIONS: FunctionDefinition[] = [
  // ── Operations KPIs ──
  {
    apiName: 'get_operations_kpi',
    displayName: 'Operations KPI',
    description: 'Returns top-level operations metrics: shipment counts, delivery rate, in-transit, vehicle utilization.',
    parameters: [
      { key: 'dateFrom', label: 'From Date', type: 'date', required: false, description: 'Start of period' },
      { key: 'dateTo', label: 'To Date', type: 'date', required: false, description: 'End of period' },
    ],
    returnType: 'object',
    inputObjectTypes: ['shipment', 'vehicle'],
    isAggregation: true,
    allowedRoles: ['ADMIN', 'OPS_MANAGER', 'DISPATCHER'],
    cacheTtlSeconds: 60,
  },
  {
    apiName: 'get_shipment_volume_by_branch',
    displayName: 'Shipment Volume by Branch',
    description: 'Aggregates shipment counts and weight by origin or destination branch.',
    parameters: [
      { key: 'direction', label: 'Direction', type: 'string', required: true, description: '"origin" or "destination"' },
      { key: 'dateFrom', label: 'From Date', type: 'date', required: false },
      { key: 'dateTo', label: 'To Date', type: 'date', required: false },
    ],
    returnType: 'array',
    inputObjectTypes: ['shipment', 'branch'],
    isAggregation: true,
    allowedRoles: ['ADMIN', 'OPS_MANAGER'],
    cacheTtlSeconds: 300,
  },
  {
    apiName: 'get_route_utilization',
    displayName: 'Route Utilization',
    description: 'Shows shipment count, total weight, and average cost per route.',
    parameters: [
      { key: 'mode', label: 'Transport Mode', type: 'string', required: false, description: 'Filter by ROAD, SEA, AIR' },
    ],
    returnType: 'array',
    inputObjectTypes: ['shipment', 'route'],
    isAggregation: true,
    allowedRoles: ['ADMIN', 'OPS_MANAGER'],
    cacheTtlSeconds: 300,
  },
  {
    apiName: 'get_delivery_performance',
    displayName: 'Delivery Performance',
    description: 'Calculates on-time delivery rate, average transit time, and SLA compliance.',
    parameters: [
      { key: 'dateFrom', label: 'From Date', type: 'date', required: false },
      { key: 'dateTo', label: 'To Date', type: 'date', required: false },
      { key: 'serviceType', label: 'Service Type', type: 'string', required: false },
    ],
    returnType: 'object',
    inputObjectTypes: ['shipment'],
    isAggregation: true,
    allowedRoles: ['ADMIN', 'OPS_MANAGER'],
    cacheTtlSeconds: 120,
  },

  // ── Finance KPIs ──
  {
    apiName: 'get_finance_kpi',
    displayName: 'Finance KPI',
    description: 'Returns revenue, cost, margin, receivables, and overdue summaries.',
    parameters: [
      { key: 'dateFrom', label: 'From Date', type: 'date', required: false },
      { key: 'dateTo', label: 'To Date', type: 'date', required: false },
    ],
    returnType: 'object',
    inputObjectTypes: ['invoice', 'costEntry'],
    isAggregation: true,
    allowedRoles: ['ADMIN', 'FINANCE_MANAGER'],
    cacheTtlSeconds: 60,
  },
  {
    apiName: 'get_revenue_by_service_type',
    displayName: 'Revenue by Service Type',
    description: 'Breaks down revenue by shipment service type.',
    parameters: [
      { key: 'dateFrom', label: 'From Date', type: 'date', required: false },
      { key: 'dateTo', label: 'To Date', type: 'date', required: false },
    ],
    returnType: 'array',
    inputObjectTypes: ['shipment', 'invoice'],
    isAggregation: true,
    allowedRoles: ['ADMIN', 'FINANCE_MANAGER'],
    cacheTtlSeconds: 300,
  },
  {
    apiName: 'get_cost_breakdown',
    displayName: 'Cost Breakdown',
    description: 'Aggregates costs by category with count and average.',
    parameters: [
      { key: 'dateFrom', label: 'From Date', type: 'date', required: false },
      { key: 'dateTo', label: 'To Date', type: 'date', required: false },
      { key: 'shipmentId', label: 'Shipment', type: 'objectReference', required: false },
    ],
    returnType: 'array',
    inputObjectTypes: ['costEntry'],
    isAggregation: true,
    allowedRoles: ['ADMIN', 'FINANCE_MANAGER', 'OPS_MANAGER'],
    cacheTtlSeconds: 300,
  },
  {
    apiName: 'get_client_profitability',
    displayName: 'Client Profitability',
    description: 'Revenue minus costs per client over a period.',
    parameters: [
      { key: 'clientId', label: 'Client', type: 'objectReference', required: false, description: 'Specific client or all' },
      { key: 'dateFrom', label: 'From Date', type: 'date', required: false },
      { key: 'dateTo', label: 'To Date', type: 'date', required: false },
    ],
    returnType: 'array',
    inputObjectTypes: ['client', 'invoice', 'costEntry', 'shipment'],
    isAggregation: true,
    allowedRoles: ['ADMIN', 'FINANCE_MANAGER'],
    cacheTtlSeconds: 600,
  },
  {
    apiName: 'get_aging_receivables',
    displayName: 'Aging Receivables',
    description: 'Buckets outstanding invoices by age (current, 30, 60, 90+ days).',
    parameters: [],
    returnType: 'object',
    inputObjectTypes: ['invoice'],
    isAggregation: true,
    allowedRoles: ['ADMIN', 'FINANCE_MANAGER'],
    cacheTtlSeconds: 120,
  },

  // ── AI Analytics ──
  {
    apiName: 'get_ai_decision_stats',
    displayName: 'AI Decision Statistics',
    description: 'Approval rate, override rate, confidence distribution for AI decisions.',
    parameters: [
      { key: 'dateFrom', label: 'From Date', type: 'date', required: false },
      { key: 'dateTo', label: 'To Date', type: 'date', required: false },
      { key: 'type', label: 'Decision Type', type: 'string', required: false },
    ],
    returnType: 'object',
    inputObjectTypes: ['decision'],
    isAggregation: true,
    allowedRoles: ['ADMIN', 'OPS_MANAGER'],
    cacheTtlSeconds: 60,
  },

  // ── Shipment Cost Calculator ──
  {
    apiName: 'calculate_shipment_cost',
    displayName: 'Calculate Shipment Cost',
    description: 'Estimates cost for a shipment given weight, route, and service type. Used by pricing AI.',
    parameters: [
      { key: 'weightKg', label: 'Weight (kg)', type: 'number', required: true },
      { key: 'routeId', label: 'Route', type: 'objectReference', required: true },
      { key: 'serviceType', label: 'Service Type', type: 'string', required: true },
      { key: 'packageCount', label: 'Package Count', type: 'number', required: false },
    ],
    returnType: 'object',
    inputObjectTypes: ['route'],
    isAggregation: false,
    allowedRoles: ['ADMIN', 'OPS_MANAGER', 'DISPATCHER', 'BRANCH_STAFF'],
    cacheTtlSeconds: 0,
  },
];
