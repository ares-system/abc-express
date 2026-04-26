// ============================================
// ABC Express AIP — Invoice Routes
// ============================================

import { Router } from 'express';
import { prisma } from '@abc/db';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createInvoiceSchema, updateInvoiceStatusSchema } from '../schemas.js';
import { sendSuccess, sendCreated, sendNotFound, sendError } from '../utils/response.js';
import { parsePagination, buildPaginationMeta, parseSort } from '../utils/pagination.js';

const router = Router();

const SORT_FIELDS = ['invoiceNumber', 'status', 'totalAmount', 'issuedDate', 'dueDate', 'createdAt'];

// ---- Invoice number generator ----
const generateInvoiceNumber = async (): Promise<string> => {
  const now = new Date();
  const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-`;

  const last = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  });

  const seq = last ? parseInt(last.invoiceNumber.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(6, '0')}`;
};

/**
 * GET /api/invoices
 */
router.get('/', authenticate, authorize('ADMIN', 'FINANCE_MANAGER', 'OPS_MANAGER'), async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { orderBy } = parseSort(req.query, SORT_FIELDS, 'issuedDate', 'desc');

    const where: Record<string, unknown> = {};
    if (req.query.status) {
      const statuses = String(req.query.status).split(',');
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }
    if (req.query.clientId) where.clientId = String(req.query.clientId);
    if (req.query.search) {
      where.OR = [
        { invoiceNumber: { contains: String(req.query.search), mode: 'insensitive' } },
      ];
    }
    if (req.query.dateFrom || req.query.dateTo) {
      where.issuedDate = {};
      if (req.query.dateFrom) (where.issuedDate as Record<string, unknown>).gte = new Date(String(req.query.dateFrom));
      if (req.query.dateTo) (where.issuedDate as Record<string, unknown>).lte = new Date(String(req.query.dateTo));
    }
    if (req.query.overdue === 'true') {
      where.status = { in: ['SENT', 'PARTIAL'] };
      where.dueDate = { lt: new Date() };
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          client: { select: { id: true, code: true, name: true, companyName: true } },
          shipment: { select: { id: true, connoteNumber: true, serviceType: true } },
        },
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
 * GET /api/invoices/:id
 */
router.get('/:id', authenticate, authorize('ADMIN', 'FINANCE_MANAGER', 'OPS_MANAGER'), async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id as string },
      include: {
        client: true,
        shipment: {
          include: {
            originBranch: { select: { code: true, name: true, city: true } },
            destinationBranch: { select: { code: true, name: true, city: true } },
            costEntries: true,
          },
        },
      },
    });

    if (!invoice) {
      sendNotFound(res, 'Invoice');
      return;
    }

    sendSuccess(res, invoice);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/invoices
 */
router.post('/', authenticate, authorize('ADMIN', 'FINANCE_MANAGER'), validateBody(createInvoiceSchema), async (req, res, next) => {
  try {
    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        ...req.body,
        invoiceNumber,
        status: 'DRAFT',
        issuedDate: new Date(),
        dueDate: new Date(req.body.dueDate),
        paidAmount: 0,
      },
      include: {
        client: { select: { id: true, code: true, name: true } },
        shipment: { select: { id: true, connoteNumber: true } },
      },
    });

    sendCreated(res, invoice);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/invoices/:id/status
 */
router.put('/:id/status', authenticate, authorize('ADMIN', 'FINANCE_MANAGER'), validateBody(updateInvoiceStatusSchema), async (req, res, next) => {
  try {
    const { status, paidAmount, paidDate } = req.body;

    const current = await prisma.invoice.findUnique({
      where: { id: req.params.id as string },
      select: { id: true, status: true, totalAmount: true },
    });

    if (!current) {
      sendNotFound(res, 'Invoice');
      return;
    }

    const updateData: Record<string, unknown> = { status };
    if (paidAmount !== undefined) updateData.paidAmount = paidAmount;
    if (status === 'PAID') {
      updateData.paidAmount = current.totalAmount;
      updateData.paidDate = paidDate ? new Date(paidDate) : new Date();
    }

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id as string },
      data: updateData,
    });

    sendSuccess(res, invoice, 200, `Invoice status updated to ${status}`);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/invoices/summary/receivables
 * Accounts receivable summary
 */
router.get('/summary/receivables', authenticate, authorize('ADMIN', 'FINANCE_MANAGER'), async (_req, res, next) => {
  try {
    const [byStatus, overdue, totalOutstanding] = await Promise.all([
      prisma.invoice.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { totalAmount: true, paidAmount: true },
      }),
      prisma.invoice.findMany({
        where: {
          status: { in: ['SENT', 'PARTIAL'] },
          dueDate: { lt: new Date() },
        },
        select: {
          id: true,
          invoiceNumber: true,
          totalAmount: true,
          paidAmount: true,
          dueDate: true,
          client: { select: { code: true, name: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 20,
      }),
      prisma.invoice.aggregate({
        where: { status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] } },
        _sum: { totalAmount: true, paidAmount: true },
        _count: { id: true },
      }),
    ]);

    sendSuccess(res, {
      byStatus,
      overdueInvoices: overdue,
      totalOutstanding: {
        count: totalOutstanding._count.id,
        amount: (totalOutstanding._sum.totalAmount ?? 0) - (totalOutstanding._sum.paidAmount ?? 0),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
