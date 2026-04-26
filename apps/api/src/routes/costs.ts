// ============================================
// ABC Express AIP — Cost Entry Routes
// ============================================

import { Router } from 'express';
import { prisma } from '@abc/db';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createCostEntrySchema } from '../schemas.js';
import { sendSuccess, sendCreated, sendNotFound } from '../utils/response.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

const router = Router();

/**
 * GET /api/costs
 */
router.get('/', authenticate, authorize('ADMIN', 'FINANCE_MANAGER', 'OPS_MANAGER'), async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const where: Record<string, unknown> = {};
    if (req.query.shipmentId) where.shipmentId = String(req.query.shipmentId);
    if (req.query.category) where.category = String(req.query.category);
    if (req.query.search) {
      const q = String(req.query.search);
      where.OR = [
        { description: { contains: q, mode: 'insensitive' } },
        { vendorName: { contains: q, mode: 'insensitive' } },
        { receiptNumber: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (req.query.vendorName) where.vendorName = { contains: String(req.query.vendorName), mode: 'insensitive' };
    if (req.query.dateFrom || req.query.dateTo) {
      where.incurredDate = {};
      if (req.query.dateFrom) (where.incurredDate as Record<string, unknown>).gte = new Date(String(req.query.dateFrom));
      if (req.query.dateTo) (where.incurredDate as Record<string, unknown>).lte = new Date(String(req.query.dateTo));
    }

    const [costs, total] = await Promise.all([
      prisma.costEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { incurredDate: 'desc' },
        include: {
          shipment: { select: { id: true, connoteNumber: true, serviceType: true } },
        },
      }),
      prisma.costEntry.count({ where }),
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    sendSuccess(res, costs, 200, undefined, meta);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/costs/:id
 */
router.get('/:id', authenticate, authorize('ADMIN', 'FINANCE_MANAGER', 'OPS_MANAGER'), async (req, res, next) => {
  try {
    const cost = await prisma.costEntry.findUnique({
      where: { id: req.params.id as string },
      include: {
        shipment: {
          select: {
            id: true,
            connoteNumber: true,
            serviceType: true,
            client: { select: { code: true, name: true } },
          },
        },
      },
    });

    if (!cost) {
      sendNotFound(res, 'Cost entry');
      return;
    }

    sendSuccess(res, cost);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/costs
 */
router.post('/', authenticate, authorize('ADMIN', 'FINANCE_MANAGER', 'OPS_MANAGER'), validateBody(createCostEntrySchema), async (req, res, next) => {
  try {
    const cost = await prisma.costEntry.create({
      data: {
        ...req.body,
        incurredDate: req.body.incurredDate ? new Date(req.body.incurredDate) : new Date(),
      },
      include: {
        shipment: { select: { id: true, connoteNumber: true } },
      },
    });

    sendCreated(res, cost);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/costs/:id
 */
router.put('/:id', authenticate, authorize('ADMIN', 'FINANCE_MANAGER'), async (req, res, next) => {
  try {
    const cost = await prisma.costEntry.update({
      where: { id: req.params.id as string },
      data: req.body,
    });
    sendSuccess(res, cost, 200, 'Cost entry updated');
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/costs/:id
 */
router.delete('/:id', authenticate, authorize('ADMIN', 'FINANCE_MANAGER'), async (req, res, next) => {
  try {
    await prisma.costEntry.delete({ where: { id: req.params.id as string } });
    sendSuccess(res, null, 200, 'Cost entry deleted');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/costs/summary/by-category
 * Cost breakdown by category
 */
router.get('/summary/by-category', authenticate, authorize('ADMIN', 'FINANCE_MANAGER', 'OPS_MANAGER'), async (req, res, next) => {
  try {
    const where: Record<string, unknown> = {};
    if (req.query.dateFrom || req.query.dateTo) {
      where.incurredDate = {};
      if (req.query.dateFrom) (where.incurredDate as Record<string, unknown>).gte = new Date(String(req.query.dateFrom));
      if (req.query.dateTo) (where.incurredDate as Record<string, unknown>).lte = new Date(String(req.query.dateTo));
    }

    const result = await prisma.costEntry.groupBy({
      by: ['category'],
      where,
      _count: { id: true },
      _sum: { amount: true },
      _avg: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
