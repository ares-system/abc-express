// ============================================
// ABC Express AIP — Proposal routes (pre-decision → Decision via merge)
// ============================================

import { Router } from 'express';
import { Prisma, type DecisionType, type Proposal } from '@prisma/client';
import { prisma } from '@abc/db';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  createProposalSchema,
  updateProposalSchema,
  rejectProposalSchema,
} from '../schemas.js';
import { sendSuccess, sendCreated, sendNotFound, sendError } from '../utils/response.js';
import { parsePagination, buildPaginationMeta, parseSort } from '../utils/pagination.js';
import { mergeProposalIntoDecision } from '../services/proposalMerge.js';

const router = Router();

const SORT_FIELDS = ['type', 'status', 'confidence', 'createdAt', 'updatedAt'];

function isProposalMergeError(
  e: unknown
): e is Error & { code: 'NOT_FOUND' | 'INVALID_STATE' } {
  return (
    e !== null &&
    typeof e === 'object' &&
    'code' in e &&
    ((e as { code: string }).code === 'NOT_FOUND' || (e as { code: string }).code === 'INVALID_STATE')
  );
}

/**
 * GET /api/proposals
 */
router.get('/', authenticate, authorize('ADMIN', 'OPS_MANAGER', 'DISPATCHER'), async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { orderBy } = parseSort(req.query, SORT_FIELDS);

    const where: Prisma.ProposalWhereInput = {};
    if (req.query.type) where.type = String(req.query.type) as DecisionType;
    if (req.query.status) where.status = String(req.query.status) as Proposal['status'];
    if (req.query.entityType) where.entityType = String(req.query.entityType);
    if (req.query.entityId) where.entityId = String(req.query.entityId);
    if (req.query.merged === 'false') where.status = { not: 'MERGED' };

    const [rows, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          createdBy: { select: { id: true, name: true, email: true, role: true } },
          mergedDecision: { select: { id: true, status: true, type: true, createdAt: true } },
        },
      }),
      prisma.proposal.count({ where }),
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    sendSuccess(res, rows, 200, undefined, meta);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/proposals
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'OPS_MANAGER'),
  validateBody(createProposalSchema),
  async (req, res, next) => {
    try {
      const body = req.body as {
        type: string;
        entityType: string;
        entityId: string;
        proposedPayload: Record<string, unknown>;
        rationale: string;
        confidence: number;
        modelInputSnapshot?: Record<string, unknown>;
        status?: 'DRAFT' | 'SUBMITTED';
        source?: string;
      };
      const status = body.status ?? 'DRAFT';

      const proposal = await prisma.proposal.create({
        data: {
          type: body.type as DecisionType,
          entityType: body.entityType,
          entityId: body.entityId,
          proposedPayload: body.proposedPayload as Prisma.InputJsonValue,
          rationale: body.rationale,
          confidence: body.confidence,
          status,
          source: body.source,
          createdById: req.user!.userId,
          ...(body.modelInputSnapshot !== undefined
            ? { modelInputSnapshot: body.modelInputSnapshot as Prisma.InputJsonValue }
            : {}),
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      sendCreated(res, proposal);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/proposals/:id
 */
router.get('/:id', authenticate, authorize('ADMIN', 'OPS_MANAGER', 'DISPATCHER'), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const row = await prisma.proposal.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        mergedDecision: {
          include: { decidedBy: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    if (!row) {
      sendNotFound(res, 'Proposal');
      return;
    }

    sendSuccess(res, row);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/proposals/:id — DRAFT only
 */
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN', 'OPS_MANAGER'),
  validateBody(updateProposalSchema),
  async (req, res, next) => {
    try {
      const id = String(req.params.id);
      const current = await prisma.proposal.findUnique({ where: { id }, select: { status: true } });
      if (!current) {
        sendNotFound(res, 'Proposal');
        return;
      }
      if (current.status !== 'DRAFT') {
        sendError(res, 400, 'Only DRAFT proposals can be edited');
        return;
      }

      const body = req.body as {
        proposedPayload?: Record<string, unknown>;
        rationale?: string;
        confidence?: number;
        modelInputSnapshot?: Record<string, unknown> | null;
        source?: string | null;
      };

      const proposal = await prisma.proposal.update({
        where: { id },
        data: {
          ...(body.proposedPayload !== undefined
            ? { proposedPayload: body.proposedPayload as Prisma.InputJsonValue }
            : {}),
          ...(body.rationale !== undefined ? { rationale: body.rationale } : {}),
          ...(body.confidence !== undefined ? { confidence: body.confidence } : {}),
          ...(body.modelInputSnapshot !== undefined
            ? { modelInputSnapshot: (body.modelInputSnapshot ?? null) as Prisma.InputJsonValue }
            : {}),
          ...(body.source !== undefined ? { source: body.source } : {}),
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      sendSuccess(res, proposal);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/proposals/:id/submit — DRAFT → SUBMITTED
 */
router.post('/:id/submit', authenticate, authorize('ADMIN', 'OPS_MANAGER'), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const current = await prisma.proposal.findUnique({ where: { id }, select: { status: true } });
    if (!current) {
      sendNotFound(res, 'Proposal');
      return;
    }
    if (current.status !== 'DRAFT') {
      sendError(res, 400, 'Only DRAFT proposals can be submitted');
      return;
    }

    const proposal = await prisma.proposal.update({
      where: { id },
      data: { status: 'SUBMITTED' },
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    sendSuccess(res, proposal);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/proposals/:id/merge — SUBMITTED → MERGED and create Decision (AI_RECOMMENDED)
 */
router.post('/:id/merge', authenticate, authorize('ADMIN', 'OPS_MANAGER'), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    let decision;
    try {
      decision = await mergeProposalIntoDecision(id);
    } catch (e) {
      if (isProposalMergeError(e) && e.code === 'NOT_FOUND') {
        sendNotFound(res, 'Proposal');
        return;
      }
      if (isProposalMergeError(e) && e.code === 'INVALID_STATE') {
        sendError(res, 400, e.message);
        return;
      }
      next(e);
      return;
    }

    const full = await prisma.decision.findUnique({
      where: { id: decision.id },
      include: {
        decidedBy: { select: { id: true, name: true, email: true, role: true } },
        proposal: { select: { id: true, status: true, mergedAt: true, type: true, rationale: true } },
      },
    });
    sendSuccess(
      res,
      {
        decision: full,
        message: 'Proposal merged into Decision; awaiting human action on the decision',
      },
      201
    );
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/proposals/:id/reject
 */
router.post(
  '/:id/reject',
  authenticate,
  authorize('ADMIN', 'OPS_MANAGER', 'DISPATCHER'),
  validateBody(rejectProposalSchema),
  async (req, res, next) => {
    try {
      const id = String(req.params.id);
      const { reason } = req.body as { reason: string };
      const current = await prisma.proposal.findUnique({ where: { id }, select: { status: true } });
      if (!current) {
        sendNotFound(res, 'Proposal');
        return;
      }
      if (current.status !== 'DRAFT' && current.status !== 'SUBMITTED') {
        sendError(res, 400, 'Only DRAFT or SUBMITTED proposals can be rejected');
        return;
      }

      const proposal = await prisma.proposal.update({
        where: { id },
        data: { status: 'REJECTED', rejectReason: reason },
        include: {
          createdBy: { select: { id: true, name: true, email: true, role: true } },
        },
      });
      sendSuccess(res, proposal);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/proposals/:id/cancel
 */
router.post('/:id/cancel', authenticate, authorize('ADMIN', 'OPS_MANAGER'), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const current = await prisma.proposal.findUnique({ where: { id }, select: { status: true } });
    if (!current) {
      sendNotFound(res, 'Proposal');
      return;
    }
    if (current.status !== 'DRAFT' && current.status !== 'SUBMITTED') {
      sendError(res, 400, 'Only DRAFT or SUBMITTED proposals can be cancelled');
      return;
    }

    const proposal = await prisma.proposal.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    sendSuccess(res, proposal);
  } catch (err) {
    next(err);
  }
});

export default router;
