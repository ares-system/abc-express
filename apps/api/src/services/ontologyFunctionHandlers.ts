// ============================================
// ABC Express AIP — Ontology function handlers
// Implements FunctionDefinition.apiName from @abc/ontology-engine ALL_FUNCTIONS
// ============================================

import type { DecisionType } from '@prisma/client';
import { prisma } from '@abc/db';
import { logger } from '../utils/logger.js';

const DECISION_TYPES: DecisionType[] = [
  'SHIPMENT_ROUTING',
  'PRICING',
  'DISPATCH',
  'ESCALATION',
  'COST_OPTIMIZATION',
  'CAPACITY_PLANNING',
];

type CacheEntry = { value: unknown; expiresAt: number };
const store = new Map<string, CacheEntry>();

function cacheKey(name: string, params: Record<string, unknown>): string {
  return `${name}:${JSON.stringify(params)}`;
}

function getCached<T>(name: string, params: Record<string, unknown>, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
  const key = cacheKey(name, params);
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiresAt > now) {
    return Promise.resolve(hit.value as T);
  }
  return compute().then((v) => {
    store.set(key, { value: v, expiresAt: now + Math.max(1, ttlSeconds) * 1000 });
    return v;
  });
}

function parseDate(v: unknown): Date | undefined {
  if (v == null) return undefined;
  if (v instanceof Date) return v;
  if (typeof v === 'string') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

export const ontologyFunctionHandlers: Record<string, (params: Record<string, unknown>) => Promise<unknown>> = {
  get_operations_kpi: async (params) =>
    getCached('get_operations_kpi', params, 60, async () => {
      const dateFrom = parseDate(params.dateFrom);
      const dateTo = parseDate(params.dateTo);
      const whereShipment = {
        ...(dateFrom || dateTo
          ? {
              createdAt: {
                ...(dateFrom ? { gte: dateFrom } : {}),
                ...(dateTo ? { lte: dateTo } : {}),
              },
            }
          : {}),
      };
      const [totalShipments, byStatus, inTransit, vehiclesInTransit, pendingDecisions] = await Promise.all([
        prisma.shipment.count({ where: whereShipment }),
        prisma.shipment.groupBy({ by: ['status'], _count: { id: true }, where: whereShipment }),
        prisma.shipment.count({ where: { ...whereShipment, status: 'IN_TRANSIT' } }),
        prisma.vehicle.count({ where: { status: 'IN_TRANSIT' } }),
        prisma.decision.count({ where: { status: 'AI_RECOMMENDED' } }),
      ]);
      const delivered = byStatus.find((s) => s.status === 'DELIVERED')?._count.id ?? 0;
      return {
        totalShipments,
        inTransit,
        deliveryRate: totalShipments > 0 ? delivered / totalShipments : 0,
        activeVehicles: vehiclesInTransit,
        pendingDecisions,
        byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count.id])),
      };
    }),

  get_shipment_volume_by_branch: async (params) =>
    getCached('get_shipment_volume_by_branch', params, 300, async () => {
      const useDest = String(params.direction ?? 'origin') === 'destination';
      const dateFrom = parseDate(params.dateFrom);
      const dateTo = parseDate(params.dateTo);
      const dateWhere =
        dateFrom || dateTo
          ? { createdAt: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
          : {};
      if (useDest) {
        const rows = await prisma.shipment.groupBy({
          by: ['destinationBranchId'],
          _count: { id: true },
          _sum: { weightKg: true },
          where: dateWhere,
        });
        const branchIds = rows.map((r) => r.destinationBranchId).filter(Boolean) as string[];
        const branches = await prisma.branch.findMany({
          where: { id: { in: branchIds } },
          select: { id: true, code: true, name: true, city: true },
        });
        const bm = Object.fromEntries(branches.map((b) => [b.id, b]));
        return rows.map((r) => {
          const bid = r.destinationBranchId;
          return { branch: bm[bid] ?? { id: bid }, shipmentCount: r._count.id, totalWeightKg: r._sum.weightKg ?? 0 };
        });
      }
      const rows = await prisma.shipment.groupBy({
        by: ['originBranchId'],
        _count: { id: true },
        _sum: { weightKg: true },
        where: dateWhere,
      });
      const branchIds = rows.map((r) => r.originBranchId).filter(Boolean) as string[];
      const branches = await prisma.branch.findMany({
        where: { id: { in: branchIds } },
        select: { id: true, code: true, name: true, city: true },
      });
      const bm = Object.fromEntries(branches.map((b) => [b.id, b]));
      return rows.map((r) => {
        const bid = r.originBranchId;
        return { branch: bm[bid] ?? { id: bid }, shipmentCount: r._count.id, totalWeightKg: r._sum.weightKg ?? 0 };
      });
    }),

  get_route_utilization: async (params) =>
    getCached('get_route_utilization', params, 300, async () => {
      const mode = params.mode ? String(params.mode) : undefined;
      const where = mode ? { mode: mode as 'ROAD' | 'SEA' | 'AIR' | 'RAIL' | 'MULTIMODAL' } : {};
      const routes = await prisma.route.findMany({ where, select: { id: true, code: true, mode: true, distanceKm: true, baseCostPerKg: true } });
      const out = [];
      for (const r of routes) {
        const [cnt, wsum] = await Promise.all([
          prisma.shipment.count({ where: { routeId: r.id } }),
          prisma.shipment.aggregate({ where: { routeId: r.id }, _sum: { weightKg: true } }),
        ]);
        out.push({
          route: r,
          shipmentCount: cnt,
          totalWeightKg: wsum._sum.weightKg ?? 0,
        });
      }
      return out;
    }),

  get_delivery_performance: async (params) =>
    getCached('get_delivery_performance', params, 120, async () => {
      const dateFrom = parseDate(params.dateFrom);
      const dateTo = parseDate(params.dateTo);
      const st = params.serviceType ? (String(params.serviceType) as 'CARGO' | 'PROJECT_CARGO' | 'EXPORT' | 'IMPORT' | 'VEHICLE_HEAVY_EQUIPMENT') : undefined;
      const delivered = await prisma.shipment.findMany({
        where: {
          status: 'DELIVERED',
          actualDeliveryDate: { not: null },
          estimatedDeliveryDate: { not: null },
          ...(st ? { serviceType: st } : {}),
          ...(dateFrom || dateTo
            ? {
                createdAt: {
                  ...(dateFrom ? { gte: dateFrom } : {}),
                  ...(dateTo ? { lte: dateTo } : {}),
                },
              }
            : {}),
        },
        select: { id: true, actualDeliveryDate: true, estimatedDeliveryDate: true, createdAt: true },
      });
      if (delivered.length === 0) {
        return { sampleSize: 0, onTimeRate: null };
      }
      let onTime = 0;
      for (const s of delivered) {
        if (s.actualDeliveryDate! <= s.estimatedDeliveryDate!) onTime += 1;
      }
      return { sampleSize: delivered.length, onTimeRate: onTime / delivered.length, onTimeCount: onTime, lateCount: delivered.length - onTime };
    }),

  get_finance_kpi: async (params) =>
    getCached('get_finance_kpi', params, 60, async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const [rev, costs, invoiceAgg] = await Promise.all([
        prisma.invoice.aggregate({ _sum: { totalAmount: true, paidAmount: true } }),
        prisma.costEntry.aggregate({ _sum: { amount: true } }),
        prisma.invoice.groupBy({ by: ['status'], _count: { id: true }, _sum: { totalAmount: true, paidAmount: true } }),
      ]);
      return {
        totalRevenue: rev._sum.totalAmount ?? 0,
        totalPaid: rev._sum.paidAmount ?? 0,
        totalCosts: costs._sum.amount ?? 0,
        invoicesByStatus: invoiceAgg,
        revenueThisMonth: (
          await prisma.invoice.aggregate({
            where: { issuedDate: { gte: startOfMonth } },
            _sum: { totalAmount: true },
          })
        )._sum.totalAmount ?? 0,
      };
    }),

  get_revenue_by_service_type: async (params) =>
    getCached('get_revenue_by_service_type', params, 300, async () => {
      const dateFrom = parseDate(params.dateFrom);
      const dateTo = parseDate(params.dateTo);
      const invWhere = {
        ...(dateFrom || dateTo
          ? { issuedDate: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
          : {}),
      };
      const invoices = await prisma.invoice.findMany({
        where: invWhere,
        select: { totalAmount: true, shipment: { select: { serviceType: true } } },
      });
      const acc: Record<string, number> = {};
      for (const i of invoices) {
        const st = i.shipment?.serviceType ?? 'UNKNOWN';
        acc[st] = (acc[st] ?? 0) + i.totalAmount;
      }
      return Object.entries(acc).map(([serviceType, revenue]) => ({ serviceType, revenue }));
    }),

  get_cost_breakdown: async (params) =>
    getCached('get_cost_breakdown', params, 300, async () => {
      const dateFrom = parseDate(params.dateFrom);
      const dateTo = parseDate(params.dateTo);
      const shipmentId = typeof params.shipmentId === 'string' ? params.shipmentId : undefined;
      const where = {
        ...(shipmentId ? { shipmentId } : {}),
        ...(dateFrom || dateTo
          ? { incurredDate: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
          : {}),
      };
      return prisma.costEntry.groupBy({
        by: ['category'],
        _sum: { amount: true },
        _count: { id: true },
        where,
        orderBy: { _sum: { amount: 'desc' } },
      });
    }),

  get_client_profitability: async (params) =>
    getCached('get_client_profitability', params, 600, async () => {
      const clientId = typeof params.clientId === 'string' ? params.clientId : undefined;
      const dateFrom = parseDate(params.dateFrom);
      const dateTo = parseDate(params.dateTo);
      const invWhere = {
        ...(clientId ? { clientId } : {}),
        ...(dateFrom || dateTo
          ? { issuedDate: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
          : {}),
      };
      const revenue = await prisma.invoice.groupBy({
        by: ['clientId'],
        _sum: { totalAmount: true },
        where: invWhere,
      });
      const costRows = await prisma.costEntry.findMany({
        where: {
          shipment: clientId ? { clientId } : {},
          ...(dateFrom || dateTo
            ? { incurredDate: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
            : {}),
        },
        select: { amount: true, shipment: { select: { clientId: true } } },
      });
      const byClientCost: Record<string, number> = {};
      for (const c of costRows) {
        const cid = c.shipment.clientId;
        byClientCost[cid] = (byClientCost[cid] ?? 0) + c.amount;
      }
      return revenue.map((r) => ({
        clientId: r.clientId,
        revenue: r._sum.totalAmount ?? 0,
        attributedCosts: byClientCost[r.clientId] ?? 0,
        margin: (r._sum.totalAmount ?? 0) - (byClientCost[r.clientId] ?? 0),
      }));
    }),

  get_aging_receivables: async (params) =>
    getCached('get_aging_receivables', params, 120, async () => {
      void params;
      const now = new Date();
      const open = await prisma.invoice.findMany({
        where: { status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] } },
        select: { id: true, totalAmount: true, paidAmount: true, dueDate: true },
      });
      const buckets = { current: 0, d30: 0, d60: 0, d90: 0 };
      for (const i of open) {
        const owed = (i.totalAmount ?? 0) - (i.paidAmount ?? 0);
        const days = Math.floor((now.getTime() - i.dueDate.getTime()) / 86400000);
        if (days <= 0) buckets.current += owed;
        else if (days <= 30) buckets.d30 += owed;
        else if (days <= 60) buckets.d60 += owed;
        else buckets.d90 += owed;
      }
      return { buckets, count: open.length };
    }),

  get_ai_decision_stats: async (params) =>
    getCached('get_ai_decision_stats', params, 60, async () => {
      const dateFrom = parseDate(params.dateFrom);
      const dateTo = parseDate(params.dateTo);
      const type = params.type ? String(params.type) : undefined;
      const typeOk = type && (DECISION_TYPES as string[]).includes(type) ? (type as DecisionType) : undefined;
      const where = {
        ...(typeOk ? { type: typeOk } : {}),
        ...(dateFrom || dateTo
          ? { createdAt: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
          : {}),
      };
      const [byStatus, byType, agg] = await Promise.all([
        prisma.decision.groupBy({ by: ['status'], _count: { id: true }, where }),
        prisma.decision.groupBy({ by: ['type'], _count: { id: true }, _avg: { aiConfidence: true }, where }),
        prisma.decision.aggregate({ _avg: { aiConfidence: true }, _count: { id: true }, where }),
      ]);
      return { byStatus, byType, confidence: agg };
    }),

  calculate_shipment_cost: async (params) => {
    const weightKg = Number(params.weightKg);
    const routeId = String(params.routeId ?? '');
    const serviceType = String(params.serviceType ?? 'CARGO');
    if (!Number.isFinite(weightKg) || weightKg <= 0 || !routeId) {
      return { error: 'weightKg and routeId required' };
    }
    const route = await prisma.route.findFirst({ where: { id: routeId, isActive: true } });
    if (!route) {
      return { error: 'Route not found' };
    }
    const estimated = weightKg * route.baseCostPerKg;
    return {
      routeId: route.id,
      routeCode: route.code,
      mode: route.mode,
      serviceType,
      weightKg,
      estimatedCost: estimated,
      basis: 'baseCostPerKg * weightKg',
    };
  },
};

export async function invokeOntologyFunction(apiName: string, params: Record<string, unknown>): Promise<unknown> {
  const fn = ontologyFunctionHandlers[apiName];
  if (!fn) {
    logger.warn(`Unknown ontology function: ${apiName}`);
    throw new Error(`Unknown function: ${apiName}`);
  }
  return fn(params);
}

/** Clears in-memory TTL cache (e.g. after batch pipeline or admin action). */
export function clearOntologyFunctionCache(): void {
  store.clear();
}
