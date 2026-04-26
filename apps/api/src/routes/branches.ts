// ============================================
// ABC Express AIP — Branch Routes
// ============================================

import { Router } from 'express';
import { prisma } from '@abc/db';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createBranchSchema, updateBranchSchema } from '../schemas.js';
import { sendSuccess, sendCreated, sendNotFound } from '../utils/response.js';
import { parsePagination, buildPaginationMeta, parseSort } from '../utils/pagination.js';

const router = Router();

const SORT_FIELDS = ['code', 'name', 'city', 'province', 'region', 'type', 'createdAt'];

/**
 * GET /api/branches
 * List branches with filtering, pagination, and sorting
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { orderBy } = parseSort(req.query, SORT_FIELDS, 'name', 'asc');

    const where: Record<string, unknown> = {};
    if (req.query.region) where.region = String(req.query.region);
    if (req.query.type) where.type = String(req.query.type);
    if (req.query.province) where.province = { contains: String(req.query.province), mode: 'insensitive' };
    if (req.query.city) where.city = { contains: String(req.query.city), mode: 'insensitive' };
    if (req.query.search) {
      where.OR = [
        { name: { contains: String(req.query.search), mode: 'insensitive' } },
        { code: { contains: String(req.query.search), mode: 'insensitive' } },
        { city: { contains: String(req.query.search), mode: 'insensitive' } },
      ];
    }

    const [branches, total] = await Promise.all([
      prisma.branch.findMany({ where, skip, take: limit, orderBy }),
      prisma.branch.count({ where }),
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    sendSuccess(res, branches, 200, undefined, meta);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/branches/:id
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const branch = await prisma.branch.findUnique({
      where: { id: req.params.id as string },
      include: {
        users: { select: { id: true, name: true, email: true, role: true } },
        vehicles: { select: { id: true, plateNumber: true, type: true, status: true } },
        _count: {
          select: {
            originShipments: true,
            destShipments: true,
            currentShipments: true,
          },
        },
      },
    });

    if (!branch) {
      sendNotFound(res, 'Branch');
      return;
    }

    sendSuccess(res, branch);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/branches
 */
router.post('/', authenticate, authorize('ADMIN'), validateBody(createBranchSchema), async (req, res, next) => {
  try {
    const branch = await prisma.branch.create({ data: req.body });
    sendCreated(res, branch);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/branches/:id
 */
router.put('/:id', authenticate, authorize('ADMIN', 'OPS_MANAGER'), validateBody(updateBranchSchema), async (req, res, next) => {
  try {
    const branch = await prisma.branch.update({
      where: { id: req.params.id as string },
      data: req.body,
    });
    sendSuccess(res, branch, 200, 'Branch updated');
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/branches/:id
 */
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.branch.delete({ where: { id: req.params.id as string } });
    sendSuccess(res, null, 200, 'Branch deleted');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/branches/summary/by-region
 * Aggregate branch counts by region
 */
router.get('/summary/by-region', authenticate, async (_req, res, next) => {
  try {
    const result = await prisma.branch.groupBy({
      by: ['region'],
      _count: { id: true },
      orderBy: { region: 'asc' },
    });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
