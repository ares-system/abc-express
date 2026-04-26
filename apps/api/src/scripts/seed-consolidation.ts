import { prisma } from '@abc/db';
import { runLoadConsolidationAnalysis } from '../jobs/loadConsolidation';

async function main() {
  console.log('Running load consolidation analysis...');
  const decisions = await runLoadConsolidationAnalysis();
  console.log(`Generated ${decisions.length} consolidation decisions.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
