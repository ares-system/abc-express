// ============================================
// ABC Express AIP — Collapse HITL approval into world mutations
// Idempotent: skips if already executedAt set
// ============================================

import type { Decision, DecisionType, Prisma } from '@prisma/client';
import { prisma } from '@abc/db';
import { logger } from '../utils/logger.js';

export type ExecutionResult = { ok: true; details?: string } | { ok: false; error: string };

function asRecord(j: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (j && typeof j === 'object' && !Array.isArray(j)) return j as Record<string, unknown>;
  return {};
}

/** Merged effective payload: AI + human patch; for HUMAN_OVERRIDDEN, human keys win on overlap. */
export function effectiveExecutionPayload(d: Pick<Decision, 'aiRecommendation' | 'humanDecision' | 'status'>): Record<string, unknown> {
  const ai = asRecord(d.aiRecommendation);
  const hum = asRecord(d.humanDecision);
  if (d.status === 'HUMAN_OVERRIDDEN' && Object.keys(hum).length > 0) {
    return { ...ai, ...hum };
  }
  return { ...ai, ...hum };
}

function strField(payload: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = payload[k];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return undefined;
}

/**
 * Apply an approved/ overridden decision to domain tables. Returns ok:false on business validation errors.
 * Caller sets decision status to HUMAN_* before invoke; on success this sets EXECUTED + executedAt and clears executionError.
 */
export async function executeDecision(decisionId: string): Promise<ExecutionResult> {
  const d = await prisma.decision.findUnique({ where: { id: decisionId } });
  if (!d) {
    return { ok: false, error: 'Decision not found' };
  }
  if (d.executedAt) {
    return { ok: true, details: 'Already executed (idempotent)' };
  }
  if (d.status === 'REJECTED' || d.status === 'PENDING' || d.status === 'AI_RECOMMENDED') {
    return { ok: false, error: `Cannot execute from status ${d.status}` };
  }
  if (d.status !== 'HUMAN_APPROVED' && d.status !== 'HUMAN_OVERRIDDEN') {
    if (d.status === 'EXECUTED') {
      return { ok: true, details: 'Already executed' };
    }
    return { ok: false, error: `Execution not defined for status ${d.status}` };
  }

  const payload = effectiveExecutionPayload(d);
  const entityId = d.entityId;

  try {
    const result = await applyByType(d.type, d.entityType, entityId, payload);
    if (!result.ok) {
      await prisma.decision.update({
        where: { id: decisionId },
        data: { executionError: result.error, executedAt: null },
      });
      return result;
    }
    await prisma.decision.update({
      where: { id: decisionId },
      data: {
        status: 'EXECUTED',
        executedAt: new Date(),
        executionError: null,
      },
    });
    return { ok: true, details: result.details };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logger.error('Decision execution failed', { decisionId, message });
    await prisma.decision.update({
      where: { id: decisionId },
      data: { executionError: message },
    });
    return { ok: false, error: message };
  }
}

async function applyByType(
  type: DecisionType,
  entityType: string,
  entityId: string,
  payload: Record<string, unknown>
): Promise<ExecutionResult & { details?: string }> {
  const shipId = entityType === 'Shipment' ? entityId : undefined;

  switch (type) {
    case 'SHIPMENT_ROUTING': {
      if (entityType !== 'Shipment' || !shipId) {
        return { ok: false, error: 'SHIPMENT_ROUTING requires entityType Shipment' };
      }
      const routeId = strField(payload, 'routeId', 'route_id');
      if (!routeId) {
        return { ok: false, error: 'Missing routeId in recommendation/human decision payload' };
      }
      const route = await prisma.route.findFirst({ where: { id: routeId, isActive: true } });
      if (!route) {
        return { ok: false, error: `Route not found or inactive: ${routeId}` };
      }
      const shipment = await prisma.shipment.findUnique({ where: { id: shipId } });
      if (!shipment) {
        return { ok: false, error: 'Shipment not found' };
      }
      await prisma.shipment.update({
        where: { id: shipId },
        data: { routeId },
      });
      return { ok: true, details: `Route ${route.code} bound to shipment` };
    }
    case 'DISPATCH': {
      if (entityType !== 'Shipment' || !shipId) {
        return { ok: false, error: 'DISPATCH requires entityType Shipment' };
      }
      const vehicleId = strField(payload, 'vehicleId', 'vehicle_id');
      if (!vehicleId) {
        return { ok: false, error: 'Missing vehicleId in decision payload' };
      }
      const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, isActive: true } });
      if (!vehicle) {
        return { ok: false, error: `Vehicle not found or inactive: ${vehicleId}` };
      }
      await prisma.shipment.update({
        where: { id: shipId },
        data: { vehicleId },
      });
      return { ok: true, details: `Vehicle ${vehicle.plateNumber} assigned` };
    }
    case 'ESCALATION': {
      if (entityType !== 'Shipment' || !shipId) {
        return { ok: false, error: 'ESCALATION requires entityType Shipment' };
      }
      const reason = strField(payload, 'reason', 'message') ?? 'Escalated via AI decision';
      await prisma.shipment.update({
        where: { id: shipId },
        data: { status: 'ON_HOLD' },
      });
      await prisma.shipmentEvent.create({
        data: {
          shipmentId: shipId,
          type: 'ON_HOLD',
          description: `Escalation: ${reason.slice(0, 500)}`,
          branchId: (await prisma.shipment.findUnique({ where: { id: shipId }, select: { currentBranchId: true } }))?.currentBranchId ?? undefined,
        },
      });
      return { ok: true, details: 'Shipment placed ON_HOLD with event' };
    }
    case 'PRICING':
    case 'COST_OPTIMIZATION':
    case 'CAPACITY_PLANNING': {
      // No default financial write — mark executed; operators apply in ERP. Optional: record-only outcome in JSON
      return { ok: true, details: `Type ${type} acknowledged without automatic financial mutation` };
    }
    default:
      return { ok: false, error: `Unknown decision type: ${type as string}` };
  }
}

/**
 * Recompute and persist outcome metrics for a decision linked to a delivered shipment (on-time, etc.).
 */
export async function refreshDecisionOutcomeSnapshot(decisionId: string): Promise<void> {
  const d = await prisma.decision.findUnique({
    where: { id: decisionId },
    include: { shipment: true },
  });
  if (!d?.shipment) return;
  const s = d.shipment;
  if (s.status !== 'DELIVERED' || !s.actualDeliveryDate || !s.estimatedDeliveryDate) {
    return;
  }
  const onTime = s.actualDeliveryDate <= s.estimatedDeliveryDate;
  const outcome = {
    shipmentStatus: s.status,
    onTime,
    plannedEta: s.estimatedDeliveryDate.toISOString(),
    actualDelivery: s.actualDeliveryDate.toISOString(),
    decisionType: d.type,
  };
  await prisma.decision.update({
    where: { id: decisionId },
    data: { outcomeSnapshot: outcome as object, outcomeEvaluatedAt: new Date() },
  });
}
