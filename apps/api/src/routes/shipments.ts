// ============================================
// ABC Express AIP — Shipment Routes
// Core business entity with full tracking
// ============================================

import { Router } from 'express';
import { prisma } from '@abc/db';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createShipmentSchema, updateShipmentStatusSchema } from '../schemas.js';
import { sendSuccess, sendCreated, sendNotFound, sendError } from '../utils/response.js';
import { parsePagination, buildPaginationMeta, parseSort } from '../utils/pagination.js';

const router = Router();

const SORT_FIELDS = ['connoteNumber', 'status', 'serviceType', 'weightKg', 'createdAt', 'estimatedDeliveryDate'];

// ---- Connote number generator ----
const generateConnote = async (): Promise<string> => {
  const now = new Date();
  const prefix = `ABC${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

  const last = await prisma.shipment.findFirst({
    where: { connoteNumber: { startsWith: prefix } },
    orderBy: { connoteNumber: 'desc' },
    select: { connoteNumber: true },
  });

  const seq = last ? parseInt(last.connoteNumber.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(7, '0')}`;
};

/**
 * GET /api/shipments
 * Full search, filter, paginate, sort
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { orderBy } = parseSort(req.query, SORT_FIELDS);

    const where: Record<string, unknown> = {};

    // Status filter (single or multiple)
    if (req.query.status) {
      const statuses = String(req.query.status).split(',');
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }

    // Service type
    if (req.query.serviceType) where.serviceType = String(req.query.serviceType);

    // Client
    if (req.query.clientId) where.clientId = String(req.query.clientId);

    // Branch filters
    if (req.query.originBranchId) where.originBranchId = String(req.query.originBranchId);
    if (req.query.destinationBranchId) where.destinationBranchId = String(req.query.destinationBranchId);
    if (req.query.currentBranchId) where.currentBranchId = String(req.query.currentBranchId);

    // Date range
    if (req.query.dateFrom || req.query.dateTo) {
      where.createdAt = {};
      if (req.query.dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(String(req.query.dateFrom));
      if (req.query.dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(String(req.query.dateTo));
    }

    // Weight range
    if (req.query.minWeight || req.query.maxWeight) {
      where.weightKg = {};
      if (req.query.minWeight) (where.weightKg as Record<string, unknown>).gte = parseFloat(String(req.query.minWeight));
      if (req.query.maxWeight) (where.weightKg as Record<string, unknown>).lte = parseFloat(String(req.query.maxWeight));
    }

    // Text search
    if (req.query.search) {
      const s = String(req.query.search);
      where.OR = [
        { connoteNumber: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
        { senderName: { contains: s, mode: 'insensitive' } },
        { receiverName: { contains: s, mode: 'insensitive' } },
      ];
    }

    // Branch-scoped access for BRANCH_STAFF and DISPATCHER
    if (req.user?.role === 'BRANCH_STAFF' || req.user?.role === 'DISPATCHER') {
      if (req.user.branchId) {
        where.OR = [
          { originBranchId: req.user.branchId },
          { destinationBranchId: req.user.branchId },
          { currentBranchId: req.user.branchId },
        ];
      }
    }

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          connoteNumber: true,
          status: true,
          serviceType: true,
          description: true,
          weightKg: true,
          volumeM3: true,
          pieces: true,
          senderName: true,
          receiverName: true,
          isInsured: true,
          estimatedDeliveryDate: true,
          actualDeliveryDate: true,
          createdAt: true,
          client: { select: { id: true, code: true, name: true, type: true } },
          originBranch: { select: { id: true, code: true, name: true, city: true } },
          destinationBranch: { select: { id: true, code: true, name: true, city: true } },
          currentBranch: { select: { id: true, code: true, name: true, city: true } },
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
 * GET /api/shipments/:id
 * Full shipment detail with events, invoices, costs
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
      include: {
        client: { select: { id: true, code: true, name: true, type: true, companyName: true, phone: true } },
        originBranch: true,
        destinationBranch: true,
        currentBranch: { select: { id: true, code: true, name: true, city: true } },
        events: { orderBy: { timestamp: 'asc' }, include: { branch: { select: { code: true, name: true, city: true } } } },
        invoices: true,
        costEntries: true,
        decisions: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    if (!shipment) {
      sendNotFound(res, 'Shipment');
      return;
    }

    const totalChargeAmount = shipment.invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    sendSuccess(res, { ...shipment, totalChargeAmount });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/shipments/track/:connoteNumber
 * Public-style tracking by connote number
 */
router.get('/track/:connoteNumber', async (req, res, next) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { connoteNumber: req.params.connoteNumber },
      select: {
        id: true,
        connoteNumber: true,
        status: true,
        serviceType: true,
        description: true,
        weightKg: true,
        pieces: true,
        senderName: true,
        receiverName: true,
        estimatedDeliveryDate: true,
        actualDeliveryDate: true,
        createdAt: true,
        originBranch: { select: { code: true, name: true, city: true } },
        destinationBranch: { select: { code: true, name: true, city: true } },
        currentBranch: { select: { code: true, name: true, city: true } },
        events: {
          orderBy: { timestamp: 'asc' },
          select: {
            type: true,
            description: true,
            timestamp: true,
            branch: { select: { code: true, city: true } },
          },
        },
      },
    });

    if (!shipment) {
      sendNotFound(res, 'Shipment');
      return;
    }

    sendSuccess(res, shipment);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/shipments
 * Create new shipment (auto-generates connote number)
 */
router.post('/', authenticate, authorize('ADMIN', 'OPS_MANAGER', 'DISPATCHER', 'BRANCH_STAFF'), validateBody(createShipmentSchema), async (req, res, next) => {
  try {
    const connoteNumber = await generateConnote();

    const shipment = await prisma.shipment.create({
      data: {
        ...req.body,
        connoteNumber,
        status: 'BOOKED',
        currentBranchId: req.body.originBranchId,
        estimatedDeliveryDate: req.body.estimatedDeliveryDate
          ? new Date(req.body.estimatedDeliveryDate)
          : undefined,
      },
      include: {
        client: { select: { id: true, code: true, name: true } },
        originBranch: { select: { id: true, code: true, name: true, city: true } },
        destinationBranch: { select: { id: true, code: true, name: true, city: true } },
      },
    });

    // Create initial tracking event
    await prisma.shipmentEvent.create({
      data: {
        shipmentId: shipment.id,
        type: 'CREATED',
        branchId: shipment.originBranchId,
        description: `Shipment booked at ${shipment.originBranch.name}`,
        timestamp: new Date(),
      },
    });

    sendCreated(res, shipment);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/shipments/:id/status
 * Update shipment status with tracking event
 */
router.put('/:id/status', authenticate, authorize('ADMIN', 'OPS_MANAGER', 'DISPATCHER', 'BRANCH_STAFF'), validateBody(updateShipmentStatusSchema), async (req, res, next) => {
  try {
    const { status, description, branchId } = req.body;

    const current = await prisma.shipment.findUnique({
      where: { id: req.params.id },
      select: { id: true, status: true, destinationBranchId: true },
    });

    if (!current) {
      sendNotFound(res, 'Shipment');
      return;
    }

    // Validate status transition
    const allowedTransitions: Record<string, string[]> = {
      DRAFT: ['BOOKED', 'CANCELLED'],
      BOOKED: ['PICKED_UP', 'CANCELLED'],
      PICKED_UP: ['IN_TRANSIT', 'EXCEPTION'],
      IN_TRANSIT: ['AT_HUB', 'OUT_FOR_DELIVERY', 'EXCEPTION'],
      AT_HUB: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'EXCEPTION'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'RETURNED', 'EXCEPTION'],
      EXCEPTION: ['IN_TRANSIT', 'AT_HUB', 'RETURNED', 'CANCELLED'],
      RETURNED: [],
      DELIVERED: [],
      CANCELLED: [],
    };

    const allowed = allowedTransitions[current.status] ?? [];
    if (!allowed.includes(status)) {
      sendError(res, 400, `Cannot transition from '${current.status}' to '${status}'. Allowed: ${allowed.join(', ') || 'none'}`);
      return;
    }

    // Build update
    const updateData: Record<string, unknown> = { status };
    if (branchId) updateData.currentBranchId = branchId;
    if (status === 'DELIVERED') {
      updateData.actualDeliveryDate = new Date();
      updateData.currentBranchId = current.destinationBranchId;
    }

    const shipment = await prisma.shipment.update({
      where: { id: req.params.id },
      data: updateData,
    });

    // Create tracking event
    await prisma.shipmentEvent.create({
      data: {
        shipmentId: shipment.id,
        type: status as any,
        branchId: (branchId as string) ?? shipment.currentBranchId,
        description: description ?? `Status updated to ${status}`,
        timestamp: new Date(),
      },
    });

    sendSuccess(res, shipment, 200, `Shipment status updated to ${status}`);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/shipments/:id/events
 * Full tracking timeline
 */
router.get('/:id/events', authenticate, async (req, res, next) => {
  try {
    const events = await prisma.shipmentEvent.findMany({
      where: { shipmentId: req.params.id },
      orderBy: { timestamp: 'asc' },
      include: {
        branch: { select: { code: true, name: true, city: true } },
      },
    });

    sendSuccess(res, events);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/shipments/:id
 * Soft-cancel (only DRAFT/BOOKED)
 */
router.delete('/:id', authenticate, authorize('ADMIN', 'OPS_MANAGER'), async (req, res, next) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
      select: { status: true },
    });

    if (!shipment) {
      sendNotFound(res, 'Shipment');
      return;
    }

    if (!['DRAFT', 'BOOKED'].includes(shipment.status)) {
      sendError(res, 400, `Cannot delete shipment with status '${shipment.status}'. Only DRAFT or BOOKED shipments can be deleted.`);
      return;
    }

    await prisma.shipment.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });

    sendSuccess(res, null, 200, 'Shipment cancelled');
  } catch (err) {
    next(err);
  }
});

export default router;
