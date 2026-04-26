import { prisma } from '@abc/db';

/**
 * AI logic (mocked) to find shipments that can be consolidated.
 * In a real scenario, this would call the Python AI service or use DeepAgentsJS.
 */
export const runLoadConsolidationAnalysis = async () => {
  // Find recent DRAFT or CONFIRMED shipments
  const pendingShipments = await prisma.shipment.findMany({
    where: {
      status: { in: ['DRAFT', 'BOOKED'] },
    },
    select: {
      id: true,
      connoteNumber: true,
      originBranchId: true,
      destinationBranchId: true,
      weightKg: true,
      volumeM3: true,
    },
    take: 100,
  });

  // Group by origin-destination pairs
  const pairs = new Map<string, typeof pendingShipments>();
  for (const shp of pendingShipments) {
    const key = `${shp.originBranchId}-${shp.destinationBranchId}`;
    if (!pairs.has(key)) pairs.set(key, []);
    pairs.get(key)!.push(shp);
  }

  const newDecisions = [];

  // Find pairs with multiple shipments that can be consolidated
  for (const [key, shipments] of pairs.entries()) {
    if (shipments.length >= 3) {
      const totalWeight = shipments.reduce((acc, s) => acc + (s.weightKg || 0), 0);
      const totalVolume = shipments.reduce((acc, s) => acc + (s.volumeM3 || 0), 0);
      
      // Propose consolidation
      const decision = await prisma.decision.create({
        data: {
          type: 'LOAD_CONSOLIDATION',
          entityId: shipments[0]?.id || '', // Primary entity
          entityType: 'ShipmentGroup',
          status: 'PENDING',
          aiRecommendation: {
            action: 'CONSOLIDATE',
            shipments: shipments.map(s => s.id),
            connoteNumbers: shipments.map(s => s.connoteNumber)
          },
          aiConfidence: 92,
          aiReasoning: `Detected ${shipments.length} pending shipments on the same route with total weight ${totalWeight}kg and volume ${totalVolume}m3. Consolidating these into a single dispatch can improve margin by 18% and reduce vehicle requirement by 1.`,
        }
      });
      newDecisions.push(decision);
    }
  }

  return newDecisions;
};
