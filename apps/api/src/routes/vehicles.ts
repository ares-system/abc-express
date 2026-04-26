// ============================================
// ABC Express AIP — Vehicle Routes
// ============================================

import { Router } from 'express';
import { prisma } from '@abc/db';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createVehicleSchema, updateVehicleSchema } from '../schemas.js';
import { sendSuccess, sendCreated, sendNotFound } from '../utils/response.js';
import { parsePagination, buildPaginationMeta, parseSort } from '../utils/pagination.js';

const router = Router();

const SORT_FIELDS = ['plateNumber', 'type', 'brand', 'year', 'capacityKg', 'status', 'createdAt'];

/**
 * GET /api/vehicles
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { orderBy } = parseSort(req.query, SORT_FIELDS, 'plateNumber', 'asc');

    const where: Record<string, unknown> = {};
    if (req.query.type) where.type = String(req.query.type);
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.branchId) where.currentBranchId = String(req.query.branchId);
    if (req.query.search) {
      where.OR = [
        { plateNumber: { contains: String(req.query.search), mode: 'insensitive' } },
        { brand: { contains: String(req.query.search), mode: 'insensitive' } },
        { driverName: { contains: String(req.query.search), mode: 'insensitive' } },
      ];
    }

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          currentBranch: { select: { id: true, code: true, name: true, city: true } },
        },
      }),
      prisma.vehicle.count({ where }),
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    sendSuccess(res, vehicles, 200, undefined, meta);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/vehicles/:id
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: {
        currentBranch: { select: { id: true, code: true, name: true, city: true } },
      },
    });

    if (!vehicle) {
      sendNotFound(res, 'Vehicle');
      return;
    }

    sendSuccess(res, vehicle);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/vehicles
 */
router.post('/', authenticate, authorize('ADMIN', 'OPS_MANAGER'), validateBody(createVehicleSchema), async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.create({
      data: req.body,
      include: {
        currentBranch: { select: { id: true, code: true, name: true } },
      },
    });
    sendCreated(res, vehicle);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/vehicles/:id
 */
router.put('/:id', authenticate, authorize('ADMIN', 'OPS_MANAGER', 'DISPATCHER'), validateBody(updateVehicleSchema), async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        currentBranch: { select: { id: true, code: true, name: true } },
      },
    });
    sendSuccess(res, vehicle, 200, 'Vehicle updated');
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/vehicles/:id
 */
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 200, 'Vehicle deleted');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/vehicles/summary/by-status
 * Fleet utilization overview
 */
router.get('/summary/by-status', authenticate, async (_req, res, next) => {
  try {
    const result = await prisma.vehicle.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { capacityKg: true },
    });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
