import { prisma } from '@abc/db';
import { logger } from '../utils/logger.js';

/**
 * Step 1: Detection
 * Scan financial transactions to see if they involve two internal LegalEntities.
 * For example:
 * 1. An Invoice from Antero to Arandy.
 * 2. A CostEntry booked by Arandy for a service provided by Antero.
 */
export async function detectIntercoTransactions() {
  logger.info('Starting IntercoTransaction detection...');
  
  // Find all Legal Entities
  const entities = await prisma.legalEntity.findMany({ select: { id: true, code: true, name: true } });
  const entityIds = entities.map(e => e.id);

  if (entityIds.length < 2) {
    logger.info('Not enough legal entities to have intercompany transactions.');
    return;
  }

  // Find CostEntries booked by an internal entity where the vendor is actually another internal entity.
  // In our simplified mock, we look for CostEntries lacking an ICT record.
  // (A real system would check vendor matches against LegalEntity definitions.)
  const costEntries = await prisma.costEntry.findMany({
    where: {
      legalEntityId: { in: entityIds },
      // Mock: Assume 'description' or 'vendorName' contains an internal entity code.
      // E.g., 'vendorName' = 'PT Arandy' while booking entity = Antero.
    },
    take: 100,
  });

  let detected = 0;
  for (const cost of costEntries) {
    // If the cost entry vendor is another legal entity, we should flag it.
    const targetEntity = entities.find(e => e.name === cost.vendorName || cost.vendorName?.includes(e.code));
    
    if (targetEntity && targetEntity.id !== cost.legalEntityId) {
      // Create an ICT record in PENDING status if not exists
      const existing = await prisma.intercoTransaction.findFirst({
        where: {
          sourceEntityId: cost.legalEntityId!,
          targetEntityId: targetEntity.id,
          amount: cost.amount,
          shipmentId: cost.shipmentId,
        }
      });

      if (!existing) {
        await prisma.intercoTransaction.create({
          data: {
            sourceEntityId: cost.legalEntityId!,
            targetEntityId: targetEntity.id,
            amount: cost.amount,
            shipmentId: cost.shipmentId,
            status: 'PENDING',
          }
        });
        detected++;
      }
    }
  }
  
  logger.info(`Detected ${detected} new intercompany transactions.`);
}

/**
 * Step 2: Elimination (Semi-Auto)
 * Attempts to automatically pair PENDING ICT records and mark them ELIMINATED.
 */
export async function eliminateIntercoTransactions() {
  logger.info('Starting automatic IntercoTransaction elimination...');
  
  const pendingIcts = await prisma.intercoTransaction.findMany({
    where: { status: 'PENDING' }
  });

  let eliminatedCount = 0;

  for (const ict of pendingIcts) {
    // Look for a matching ICT in the opposite direction for the same shipment & amount
    const match = await prisma.intercoTransaction.findFirst({
      where: {
        sourceEntityId: ict.targetEntityId,
        targetEntityId: ict.sourceEntityId,
        shipmentId: ict.shipmentId,
        status: 'PENDING',
        id: { not: ict.id },
      }
    });

    // If amounts match exactly or within 0.1% tolerance
    if (match) {
      const diff = Math.abs(ict.amount - match.amount);
      const threshold = ict.amount * 0.001; // 0.1% tolerance

      if (diff <= threshold) {
        // We have a match! Eliminate both
        await prisma.$transaction([
          prisma.intercoTransaction.update({
            where: { id: ict.id },
            data: { status: 'ELIMINATED', matchedIctId: match.id, eliminatedAt: new Date() }
          }),
          prisma.intercoTransaction.update({
            where: { id: match.id },
            data: { status: 'ELIMINATED', matchedIctId: ict.id, eliminatedAt: new Date() }
          })
        ]);
        eliminatedCount += 2;
      }
    }
  }

  logger.info(`Eliminated ${eliminatedCount} matched intercompany transactions.`);
}
