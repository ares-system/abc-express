// ============================================
// ABC Express AIP — Dashboard / Analytics Routes
// Aggregated endpoints for Operations & Finance dashboards
// ============================================

import { Router } from 'express';
import { prisma } from '@abc/db';
import { authenticate, authorize } from '../middleware/auth.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

// ─── Operations Dashboard ────────────────────────────────────

/**
 * GET /api/dashboard/operations
 * Top-level KPI snapshot for operations
 */
router.get('/operations', authenticate, authorize('ADMIN', 'OPS_MANAGER', 'DISPATCHER'), async (_req, res, next) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalShipments,
      shipmentsToday,
      shipmentsThisMonth,
      byStatus,
      byServiceTypeBase,
      activeVehicles,
      vehicleSummary,
      pendingDecisions,
      recentEventRows,
      invoiceServiceRows,
    ] = await Promise.all([
      prisma.shipment.count(),
      prisma.shipment.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.shipment.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.shipment.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.shipment.groupBy({
        by: ['serviceType'],
        _count: { id: true },
        _sum: { weightKg: true },
      }),
      prisma.vehicle.count({ where: { status: 'IN_TRANSIT' } }),
      prisma.vehicle.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.decision.count({ where: { status: 'AI_RECOMMENDED' } }),
      prisma.shipmentEvent.findMany({
        orderBy: { timestamp: 'desc' },
        take: 20,
        select: {
          id: true,
          type: true,
          description: true,
          notes: true,
          timestamp: true,
          shipment: {
            select: { connoteNumber: true, serviceType: true },
          },
          branch: { select: { code: true, name: true, city: true } },
        },
      }),
      prisma.invoice.findMany({
        select: {
          totalAmount: true,
          shipment: { select: { serviceType: true } },
        },
      }),
    ]);

    const revenueByService = new Map<string, number>();
    for (const inv of invoiceServiceRows) {
      const st = inv.shipment.serviceType;
      revenueByService.set(st, (revenueByService.get(st) ?? 0) + inv.totalAmount);
    }

    const byServiceType = byServiceTypeBase.map((row) => ({
      ...row,
      _sum: {
        weightKg: row._sum.weightKg,
        totalChargeAmount: revenueByService.get(row.serviceType) ?? 0,
      },
    }));

    const recentEvents = recentEventRows.map((e) => ({
      id: e.id,
      status: e.type,
      location: e.branch
        ? [e.branch.name, e.branch.city].filter(Boolean).join(' · ')
        : e.description,
      notes: e.notes,
      timestamp: e.timestamp.toISOString(),
      shipment: e.shipment,
    }));

    // In-transit shipments count
    const inTransit = byStatus.find((s) => s.status === 'IN_TRANSIT')?._count.id ?? 0;
    const delivered = byStatus.find((s) => s.status === 'DELIVERED')?._count.id ?? 0;

    sendSuccess(res, {
      kpi: {
        totalShipments,
        shipmentsToday,
        shipmentsThisMonth,
        inTransit,
        delivered,
        deliveryRate: totalShipments > 0 ? parseFloat((delivered / totalShipments).toFixed(3)) : 0,
        activeVehicles,
        pendingDecisions,
      },
      shipmentsByStatus: byStatus,
      shipmentsByServiceType: byServiceType,
      vehiclesByStatus: vehicleSummary,
      recentEvents,
    });
  } catch (err) {
    next(err);
  }
});

// ─── Finance Dashboard ──────────────────────────────────────

/**
 * GET /api/dashboard/finance
 * Revenue, cost, receivables snapshot
 */
router.get('/finance', authenticate, authorize('ADMIN', 'FINANCE_MANAGER'), async (_req, res, next) => {
  try {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      revenueTotal,
      revenueThisMonth,
      costTotal,
      costThisMonth,
      invoiceSummary,
      overdueInvoices,
      topClients,
      costByCategory,
    ] = await Promise.all([
      // All-time revenue
      prisma.invoice.aggregate({
        _sum: { totalAmount: true, paidAmount: true },
        _count: { id: true },
      }),
      // This month revenue
      prisma.invoice.aggregate({
        where: { issuedDate: { gte: startOfMonth } },
        _sum: { totalAmount: true, paidAmount: true },
        _count: { id: true },
      }),
      // All-time costs
      prisma.costEntry.aggregate({
        _sum: { amount: true },
        _count: { id: true },
      }),
      // This month costs
      prisma.costEntry.aggregate({
        where: { incurredDate: { gte: startOfMonth } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Invoice status breakdown
      prisma.invoice.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { totalAmount: true, paidAmount: true },
      }),
      // Overdue count + amount
      prisma.invoice.aggregate({
        where: {
          status: { in: ['SENT', 'PARTIAL'] },
          dueDate: { lt: new Date() },
        },
        _count: { id: true },
        _sum: { totalAmount: true, paidAmount: true },
      }),
      // Top 10 clients by revenue
      prisma.invoice.groupBy({
        by: ['clientId'],
        _sum: { totalAmount: true },
        _count: { id: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 10,
      }),
      // Cost breakdown by category
      prisma.costEntry.groupBy({
        by: ['category'],
        _sum: { amount: true },
        _count: { id: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
    ]);

    // Enrich top clients with names
    const clientIds = topClients.map((c) => c.clientId);
    const clients = await prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, code: true, name: true, companyName: true },
    });
    const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));
    const enrichedTopClients = topClients.map((c) => ({
      ...c,
      client: clientMap[c.clientId] ?? null,
    }));

    const totalRevenue = revenueTotal._sum.totalAmount ?? 0;
    const totalCosts = costTotal._sum.amount ?? 0;
    const totalPaid = revenueTotal._sum.paidAmount ?? 0;

    sendSuccess(res, {
      kpi: {
        totalRevenue,
        totalCosts,
        grossMargin: totalRevenue - totalCosts,
        grossMarginPct: totalRevenue > 0 ? parseFloat(((totalRevenue - totalCosts) / totalRevenue).toFixed(3)) : 0,
        totalOutstanding: totalRevenue - totalPaid,
        overdueCount: overdueInvoices._count.id,
        overdueAmount: (overdueInvoices._sum.totalAmount ?? 0) - (overdueInvoices._sum.paidAmount ?? 0),
        revenueThisMonth: revenueThisMonth._sum.totalAmount ?? 0,
        costsThisMonth: costThisMonth._sum.amount ?? 0,
      },
      invoicesByStatus: invoiceSummary,
      costByCategory,
      topClients: enrichedTopClients,
    });
  } catch (err) {
    next(err);
  }
});

// ─── Branch Performance ─────────────────────────────────────

/**
 * GET /api/dashboard/branches
 * Per-branch shipment volume and performance
 */
router.get('/branches', authenticate, authorize('ADMIN', 'OPS_MANAGER'), async (_req, res, next) => {
  try {
    const [originVolume, destinationVolume, branchList] = await Promise.all([
      prisma.shipment.groupBy({
        by: ['originBranchId'],
        _count: { id: true },
        _sum: { weightKg: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      }),
      prisma.shipment.groupBy({
        by: ['destinationBranchId'],
        _count: { id: true },
        _sum: { weightKg: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      }),
      prisma.branch.findMany({
        select: { id: true, code: true, name: true, city: true, region: true, type: true },
      }),
    ]);

    const branchMap = Object.fromEntries(branchList.map((b) => [b.id, b]));

    const enriched = (items: any[], key: string) =>
      items.map((item) => ({
        ...item,
        branch: branchMap[item[key]] ?? null,
      }));

    sendSuccess(res, {
      topOrigins: enriched(originVolume, 'originBranchId'),
      topDestinations: enriched(destinationVolume, 'destinationBranchId'),
      totalBranches: branchList.length,
      branchesByRegion: branchList.reduce(
        (acc, b) => {
          acc[b.region] = (acc[b.region] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    });
  } catch (err) {
    next(err);
  }
});

// ─── AI / Decision Analytics ────────────────────────────────

/**
 * GET /api/dashboard/ai
 * AI recommendation performance metrics
 */
router.get('/ai', authenticate, authorize('ADMIN', 'OPS_MANAGER'), async (_req, res, next) => {
  try {
    const [byStatus, byType, confidenceStats, recentDecisions] = await Promise.all([
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
      prisma.decision.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          decidedBy: { select: { id: true, name: true, role: true } },
        },
      }),
    ]);

    const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, s._count.id]));
    const totalActed = (statusMap['HUMAN_APPROVED'] ?? 0) + (statusMap['HUMAN_OVERRIDDEN'] ?? 0) + (statusMap['REJECTED'] ?? 0);
    const approvalRate = totalActed > 0 ? (statusMap['HUMAN_APPROVED'] ?? 0) / totalActed : 0;
    const overrideRate = totalActed > 0 ? (statusMap['HUMAN_OVERRIDDEN'] ?? 0) / totalActed : 0;

    sendSuccess(res, {
      kpi: {
        totalDecisions: confidenceStats._count.id,
        pendingCount: statusMap['AI_RECOMMENDED'] ?? 0,
        approvalRate: parseFloat(approvalRate.toFixed(3)),
        overrideRate: parseFloat(overrideRate.toFixed(3)),
        avgConfidence: confidenceStats._avg.aiConfidence ?? 0,
      },
      byStatus,
      byType,
      recentDecisions,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
