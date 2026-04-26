-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'MERGED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "type" "DecisionType" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "proposedPayload" JSONB NOT NULL,
    "rationale" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "modelInputSnapshot" JSONB,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "source" TEXT,
    "createdById" TEXT,
    "mergedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "decisions" ADD COLUMN "proposalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "decisions_proposalId_key" ON "decisions"("proposalId");

-- CreateIndex
CREATE INDEX "proposals_type_idx" ON "proposals"("type");

-- CreateIndex
CREATE INDEX "proposals_entityType_entityId_idx" ON "proposals"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "proposals_status_idx" ON "proposals"("status");

-- CreateIndex
CREATE INDEX "proposals_createdAt_idx" ON "proposals"("createdAt");

-- CreateIndex
CREATE INDEX "proposals_createdById_idx" ON "proposals"("createdById");

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
