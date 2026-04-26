// ============================================
// ABC Express AIP — Client Routes
// ============================================

import { Router } from 'express';
import { prisma } from '@abc/db';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createClientSchema, updateClientSchema } from '../schemas.js';
import { sendSuccess, sendCreated, sendNotFound } from '../utils/response.js';
import { parsePagination, buildPaginationMeta, parseSort } from '../utils/pagination.js';

const router = Router();

const SORT_FIELDS = ['code', 'name', 'type', 'city', 'province', 'creditLimit', 'createdAt'];

/**
 * GET /api/clients
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { orderBy } = parseSort(req.query, SORT_FIELDS, 'name', 'asc');

    const where: Record<string, unknown> = {};
    if (req.query.type) where.type = String(req.query.type);
    if (req.query.city) where.city = { contains: String(req.query.city), mode: 'insensitive' };
    if (req.query.search) {
      where.OR = [
        { name: { contains: String(req.query.search), mode: 'insensitive' } },
        { code: { contains: String(req.query.search), mode: 'insensitive' } },
        { companyName: { contains: String(req.query.search), mode: 'insensitive' } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({ where, skip, take: limit, orderBy }),
      prisma.client.count({ where }),
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    sendSuccess(res, clients, 200, undefined, meta);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/clients/:id
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { shipments: true, invoices: true } },
      },
    });

    if (!client) {
      sendNotFound(res, 'Client');
      return;
    }

    sendSuccess(res, client);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/clients/:id/shipments
 * List shipments for a specific client
 */
router.get('/:id/shipments', authenticate, async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const where = { clientId: req.params.id };
    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          connoteNumber: true,
          status: true,
          serviceType: true,
          description: true,
          weightKg: true,
          createdAt: true,
          originBranch: { select: { code: true, city: true } },
          destinationBranch: { select: { code: true, city: true } },
        },
      }),
      prisma.shipment.count({ where }),
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    sendSuccess(res, shipments, 200, undefined, meta);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/clients/:id/invoices
 * List invoices for a specific client
 */
router.get('/:id/invoices', authenticate, async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const where: Record<string, unknown> = { clientId: req.params.id };
    if (req.query.status) where.status = String(req.query.status);

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issuedDate: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    sendSuccess(res, invoices, 200, undefined, meta);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/clients
 */
router.post('/', authenticate, authorize('ADMIN', 'OPS_MANAGER', 'BRANCH_STAFF'), validateBody(createClientSchema), async (req, res, next) => {
  try {
    const client = await prisma.client.create({ data: req.body });
    sendCreated(res, client);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/clients/:id
 */
router.put('/:id', authenticate, authorize('ADMIN', 'OPS_MANAGER', 'BRANCH_STAFF'), validateBody(updateClientSchema), async (req, res, next) => {
  try {
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: req.body,
    });
    sendSuccess(res, client, 200, 'Client updated');
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/clients/:id
 */
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.client.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 200, 'Client deleted');
  } catch (err) {
    next(err);
  }
});

export default router;
