import { prisma } from '@abc/db';
import { logger } from '../utils/logger.js';

/**
 * Period format: "YYYY-MM"
 */
function getCurrentMonthString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Computes Branch P&L from operational and financial ontology objects.
 * Revenue = sum(Invoice.amount) where Invoice.branchId = this.branchId and status = PAID
 * Cost = sum(CostEntry.amount) where CostEntry.costCenterId linked to this branch
 */
export async function computeBranchPLs() {
  logger.info('Starting Branch P&L live computation...');
  
  const periodValue = getCurrentMonthString();
  const branches = await prisma.branch.findMany({
    select: { id: true, code: true, name: true }
  });

  let computed = 0;

  for (const branch of branches) {
    // 1. Direct Revenue
    const revenueAggr = await prisma.invoice.aggregate({
      _sum: { totalAmount: true },
      where: {
        // Mock logic: invoices issued for shipments where this branch is the origin
        shipment: { originBranchId: branch.id },
        status: 'PAID'
      }
    });
    const totalRevenue = revenueAggr._sum.totalAmount || 0;

    // 2. Direct Cost (CostEntry linked to this branch's costCenterId)
    // Note: CostEntry.costCenterId needs to match the branch id in our simple ontology
    const costAggr = await prisma.costEntry.aggregate({
      _sum: { amount: true },
      where: {
        costCenterId: branch.id
      }
    });
    const totalCost = costAggr._sum.amount || 0;

    const grossMargin = totalRevenue - totalCost;

    // Upsert into BranchPL
    await prisma.branchPL.upsert({
      where: {
        branchId_periodType_periodValue: {
          branchId: branch.id,
          periodType: 'MONTHLY',
          periodValue: periodValue,
        }
      },
      update: {
        revenue: totalRevenue,
        cost: totalCost,
        grossMargin: grossMargin,
        updatedAt: new Date()
      },
      create: {
        branchId: branch.id,
        periodType: 'MONTHLY',
        periodValue: periodValue,
        revenue: totalRevenue,
        cost: totalCost,
        grossMargin: grossMargin,
        status: 'DRAFT',
      }
    });

    computed++;
  }

  logger.info(`Computed P&L for ${computed} branches for period ${periodValue}.`);
}
