-- AlterTable
ALTER TABLE "decisions" ADD COLUMN     "decidedAt" TIMESTAMP(3),
ADD COLUMN     "modelInputSnapshot" JSONB,
ADD COLUMN     "executionError" TEXT,
ADD COLUMN     "outcomeSnapshot" JSONB,
ADD COLUMN     "outcomeEvaluatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "decisions_decidedAt_idx" ON "decisions"("decidedAt");
