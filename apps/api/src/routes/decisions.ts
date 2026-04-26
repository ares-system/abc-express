// ============================================
// ABC Express AIP — AI Decision Routes
// Human-in-the-loop decision management
// ============================================

import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '@abc/db';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createDecisionSchema, updateDecisionStatusSchema } from '../schemas.js';
import { sendSuccess, sendCreated, sendNotFound, sendError } from '../utils/response.js';
import { parsePagination, buildPaginationMeta, parseSort } from '../utils/pagination.js';
import { executeDecision, refreshDecisionOutcomeSnapshot } from '../services/decisionExecution.js';

const router = Router();

const SORT_FIELDS = ['type', 'status', 'aiConfidence', 'createdAt'];

/**
 * GET /api/decisions/summary/stats
 * Must be registered before /:id so "summary" is not captured as an id
 */
router.get('/summary/stats', authenticate, authorize('ADMIN', 'OPS_MANAGER'), async (_req, res, next) => {
  try {
    const [byStatus, byType, confidenceStats, pendingCount] = await Promise.all([
      prisma.decision.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.decision.groupBy({
        by: ['type'],
        _count: { id: true },
        _avg: { aiConfidence: true },
      }),
      prisma.decision.aggregate({
        _avg: { aiConfidence: true },
        _min: { aiConfidence: true },
        _max: { aiConfidence: true },
        _count: { id: true },
      }),
      prisma.decision.count({ where: { status: 'AI_RECOMMENDED' } }),
    ]);

    const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, s._count.id]));
    const totalDecided = (statusMap['HUMAN_APPROVED'] ?? 0) + (statusMap['HUMAN_OVERRIDDEN'] ?? 0) + (statusMap['REJECTED'] ?? 0);
    const approvalRate = totalDecided > 0 ? (statusMap['HUMAN_APPROVED'] ?? 0) / totalDecided : 0;
    const overrideRate = totalDecided > 0 ? (statusMap['HUMAN_OVERRIDDEN'] ?? 0) / totalDecided : 0;

    sendSuccess(res, {
      byStatus,
      byType,
      confidenceStats,
      pendingCount,
      approvalRate: parseFloat(approvalRate.toFixed(3)),
      overrideRate: parseFloat(overrideRate.toFixed(3)),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/decisions/summary/outcomes
 * Aggregated "similar situation" style metrics for executed shipment-linked decisions
 */
router.get('/summary/outcomes', authenticate, authorize('ADMIN', 'OPS_MANAGER', 'DISPATCHER'), async (_req, res, next) => {
  try {
    const executed = await prisma.decision.findMany({
      where: { status: 'EXECUTED', entityType: 'Shipment' },
      include: { shipment: { select: { status: true, actualDeliveryDate: true, estimatedDeliveryDate: true } } },
    });
    const byType: Record<string, { count: number; onTime: number; late: number; unknown: number }> = {};
    for (const d of executed) {
      const t = d.type;
      if (!byType[t]) {
        byType[t] = { count: 0, onTime: 0, late: 0, unknown: 0 };
      }
      byType[t].count += 1;
      const s = d.shipment;
      if (!s || s.status !== 'DELIVERED' || !s.actualDeliveryDate || !s.estimatedDeliveryDate) {
        byType[t].unknown += 1;
        continue;
      }
      if (s.actualDeliveryDate <= s.estimatedDeliveryDate) {
        byType[t].onTime += 1;
      } else {
        byType[t].late += 1;
      }
    }
    sendSuccess(res, { byType, totalExecuted: executed.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/decisions
 */
router.get('/', authenticate, authorize('ADMIN', 'OPS_MANAGER', 'DISPATCHER'), async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { orderBy } = parseSort(req.query, SORT_FIELDS);

    const where: Record<string, unknown> = {};
    if (req.query.type) where.type = String(req.query.type);
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.entityType) where.entityType = String(req.query.entityType);
    if (req.query.entityId) where.entityId = String(req.query.entityId);
    if (req.query.minConfidence) where.aiConfidence = { gte: parseFloat(String(req.query.minConfidence)) };

    if (req.query.pending === 'true') {
      where.status = 'AI_RECOMMENDED';
    }

    const includeProposal =
      req.query.includeProposal === 'true' || String(req.query.includeProposal) === '1';

    const [decisions, total] = await Promise.all([
      prisma.decision.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          decidedBy: { select: { id: true, name: true, email: true, role: true } },
          ...(includeProposal
            ? {
                proposal: {
                  select: {
                    id: true,
                    status: true,
                    type: true,
                    mergedAt: true,
                    entityType: true,
                    entityId: true,
                    rationale: true,
                  },
                },
              }
            : {}),
        },
      }),
      prisma.decision.count({ where }),
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    sendSuccess(res, decisions, 200, undefined, meta);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/decisions
 */
router.post('/', authenticate, authorize('ADMIN', 'OPS_MANAGER'), validateBody(createDecisionSchema), async (req, res, next) => {
  try {
    const body = req.body as {
      type: string;
      entityType: string;
      entityId: string;
      aiRecommendation: Record<string, unknown>;
      aiConfidence: number;
      aiReasoning: string;
      modelInputSnapshot?: Record<string, unknown>;
    };
    const decision = await prisma.decision.create({
      data: {
        type: body.type as 'SHIPMENT_ROUTING' | 'PRICING' | 'DISPATCH' | 'ESCALATION' | 'COST_OPTIMIZATION' | 'CAPACITY_PLANNING',
        entityType: body.entityType,
        entityId: body.entityId,
        aiRecommendation: body.aiRecommendation as Prisma.InputJsonValue,
        aiConfidence: body.aiConfidence,
        aiReasoning: body.aiReasoning,
        status: 'AI_RECOMMENDED',
        ...(body.modelInputSnapshot !== undefined
          ? { modelInputSnapshot: body.modelInputSnapshot as Prisma.InputJsonValue }
          : {}),
      },
    });

    sendCreated(res, decision);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/decisions/:id/status
 * Human approves, overrides, or rejects; on approve/override, auto-executes and moves to EXECUTED when side effects apply
 */
router.put('/:id/status', authenticate, authorize('ADMIN', 'OPS_MANAGER', 'DISPATCHER'), validateBody(updateDecisionStatusSchema), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const { status, humanDecision, humanReasoning } = req.body as {
      status: string;
      humanDecision?: Record<string, unknown>;
      humanReasoning?: string;
    };

    const current = await prisma.decision.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!current) {
      sendNotFound(res, 'Decision');
      return;
    }

    if (current.status !== 'AI_RECOMMENDED') {
      sendError(res, 400, `Decision already in status '${current.status}'. Only AI_RECOMMENDED decisions can be updated.`);
      return;
    }

    if (status === 'HUMAN_APPROVED' || status === 'HUMAN_OVERRIDDEN') {
      await prisma.decision.update({
        where: { id },
        data: {
          status: status as 'HUMAN_APPROVED' | 'HUMAN_OVERRIDDEN',
          decidedById: req.user!.userId,
          decidedAt: new Date(),
          humanReasoning: humanReasoning ?? null,
          ...(humanDecision !== undefined ? { humanDecision: humanDecision as object } : {}),
        },
      });

      const exec = await executeDecision(id);
      let finalRecord = await prisma.decision.findUnique({
        where: { id },
        include: { decidedBy: { select: { id: true, name: true, role: true } } },
      });
      if (finalRecord?.status === 'EXECUTED' && finalRecord.entityType === 'Shipment') {
        await refreshDecisionOutcomeSnapshot(id).catch(() => undefined);
        finalRecord = await prisma.decision.findUnique({
          where: { id },
          include: { decidedBy: { select: { id: true, name: true, role: true } } },
        });
      }
      sendSuccess(
        res,
        {
          decision: finalRecord,
          execution: exec,
        },
        200,
        exec.ok
          ? 'Decision applied'
          : `Decision recorded; execution did not complete: ${'error' in exec ? exec.error : 'unknown'}`
      );
      return;
    }

    if (status === 'REJECTED') {
      const decision = await prisma.decision.update({
        where: { id },
        data: {
          status: 'REJECTED',
          decidedById: req.user!.userId,
          decidedAt: new Date(),
          humanReasoning: humanReasoning ?? null,
          humanDecision: humanDecision !== undefined ? (humanDecision as object) : undefined,
        },
        include: {
          decidedBy: { select: { id: true, name: true, role: true } },
        },
      });
      sendSuccess(res, { decision, execution: { ok: true, details: 'Rejected — no execution' } });
      return;
    }

    sendError(res, 400, 'Invalid status for this transition');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/decisions/:id
 */
router.get('/:id', authenticate, authorize('ADMIN', 'OPS_MANAGER', 'DISPATCHER'), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const includeProposal =
      req.query.includeProposal === 'true' || String(req.query.includeProposal) === '1';

    const decision = await prisma.decision.findUnique({
      where: { id },
      include: {
        decidedBy: { select: { id: true, name: true, email: true, role: true } },
        ...(includeProposal
          ? {
              proposal: {
                select: {
                  id: true,
                  status: true,
                  type: true,
                  mergedAt: true,
                  entityType: true,
                  entityId: true,
                  rationale: true,
                  source: true,
                  createdAt: true,
                },
              },
            }
          : {}),
      },
    });

    if (!decision) {
      sendNotFound(res, 'Decision');
      return;
    }

    sendSuccess(res, decision);
  } catch (err) {
    next(err);
  }
});

export default router;
