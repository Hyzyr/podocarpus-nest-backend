-- AlterTable
ALTER TABLE "GlobalNotification" ADD COLUMN     "requiresAction" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resolutionNote" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "resolvedById" TEXT;

-- CreateIndex
CREATE INDEX "GlobalNotification_requiresAction_resolvedAt_idx" ON "GlobalNotification"("requiresAction", "resolvedAt");

