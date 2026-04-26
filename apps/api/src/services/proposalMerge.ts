// ============================================
// Merge a submitted Proposal into a Decision (1:1 on Decision.proposalId)
// ============================================

import type { Prisma } from '@prisma/client';
import { prisma } from '@abc/db';

/**
 * Creates a Decision in AI_RECOMMENDED state from a SUBMITTED proposal and marks the proposal MERGED.
 * Human approval continues via PUT /api/decisions/:id/status as usual.
 */
export async function mergeProposalIntoDecision(proposalId: string) {
  return prisma.$transaction(async (tx) => {
    const proposal = await tx.proposal.findUnique({
      where: { id: proposalId },
    });
    if (!proposal) {
      throw Object.assign(new Error('Proposal not found'), { code: 'NOT_FOUND' as const });
    }
    if (proposal.status !== 'SUBMITTED') {
      throw Object.assign(new Error(`Only SUBMITTED proposals can be merged (current: ${proposal.status})`), {
        code: 'INVALID_STATE' as const,
      });
    }

    const decision = await tx.decision.create({
      data: {
        proposalId: proposal.id,
        type: proposal.type,
        entityType: proposal.entityType,
        entityId: proposal.entityId,
        aiRecommendation: proposal.proposedPayload as Prisma.InputJsonValue,
        aiReasoning: proposal.rationale,
        aiConfidence: proposal.confidence,
        status: 'AI_RECOMMENDED',
        ...(proposal.modelInputSnapshot != null
          ? { modelInputSnapshot: proposal.modelInputSnapshot as Prisma.InputJsonValue }
          : {}),
      },
    });

    await tx.proposal.update({
      where: { id: proposal.id },
      data: {
        status: 'MERGED',
        mergedAt: new Date(),
      },
    });

    return decision;
  });
}
