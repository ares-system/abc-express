// ============================================
// ABC Express AIP — Route Network Routes
// ============================================

import { Router } from 'express';
import { prisma } from '@abc/db';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createRouteSchema, updateRouteSchema } from '../schemas.js';
import { sendSuccess, sendCreated, sendNotFound } from '../utils/response.js';
import { parsePagination, buildPaginationMeta, parseSort } from '../utils/pagination.js';

const router = Router();

const SORT_FIELDS = ['code', 'mode', 'distanceKm', 'estimatedHours', 'baseCostPerKg', 'createdAt'];

/**
 * GET /api/routes
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { orderBy } = parseSort(req.query, SORT_FIELDS, 'code', 'asc');

    const where: Record<string, unknown> = {};
    if (req.query.mode) where.mode = String(req.query.mode);
    if (req.query.originBranchId) where.originBranchId = String(req.query.originBranchId);
    if (req.query.destinationBranchId) where.destinationBranchId = String(req.query.destinationBranchId);
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';
    if (req.query.search) {
      where.code = { contains: String(req.query.search), mode: 'insensitive' };
    }

    const [routes, total] = await Promise.all([
      prisma.route.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          originBranch: { select: { id: true, code: true, name: true, city: true } },
          destinationBranch: { select: { id: true, code: true, name: true, city: true } },
        },
      }),
      prisma.route.count({ where }),
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    sendSuccess(res, routes, 200, undefined, meta);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/routes/:id
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const route = await prisma.route.findUnique({
      where: { id: req.params.id },
      include: {
        originBranch: true,
        destinationBranch: true,
      },
    });

    if (!route) {
      sendNotFound(res, 'Route');
      return;
    }

    sendSuccess(res, route);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/routes/find?from=<branchId>&to=<branchId>
 * Find available routes between two branches
 */
router.get('/find/between', authenticate, async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      sendSuccess(res, [], 200, 'Provide "from" and "to" branch IDs');
      return;
    }

    const routes = await prisma.route.findMany({
      where: {
        originBranchId: String(from),
        destinationBranchId: String(to),
        isActive: true,
      },
      include: {
        originBranch: { select: { code: true, name: true, city: true } },
        destinationBranch: { select: { code: true, name: true, city: true } },
      },
      orderBy: { baseCostPerKg: 'asc' },
    });

    sendSuccess(res, routes);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/routes
 */
router.post('/', authenticate, authorize('ADMIN', 'OPS_MANAGER'), validateBody(createRouteSchema), async (req, res, next) => {
  try {
    const route = await prisma.route.create({
      data: req.body,
      include: {
        originBranch: { select: { code: true, name: true, city: true } },
        destinationBranch: { select: { code: true, name: true, city: true } },
      },
    });
    sendCreated(res, route);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/routes/:id
 */
router.put('/:id', authenticate, authorize('ADMIN', 'OPS_MANAGER'), validateBody(updateRouteSchema), async (req, res, next) => {
  try {
    const route = await prisma.route.update({
      where: { id: req.params.id },
      data: req.body,
    });
    sendSuccess(res, route, 200, 'Route updated');
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/routes/:id
 * Soft-deactivate rather than hard delete
 */
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.route.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    sendSuccess(res, null, 200, 'Route deactivated');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/routes/summary/by-mode
 */
router.get('/summary/by-mode', authenticate, async (_req, res, next) => {
  try {
    const result = await prisma.route.groupBy({
      by: ['mode'],
      where: { isActive: true },
      _count: { id: true },
      _avg: { distanceKm: true, estimatedHours: true, baseCostPerKg: true },
    });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
