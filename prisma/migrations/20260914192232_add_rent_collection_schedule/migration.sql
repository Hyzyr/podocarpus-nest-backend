-- CreateEnum
CREATE TYPE "RentFrequency" AS ENUM ('ANNUAL', 'SEMI_ANNUAL', 'QUARTERLY', 'BI_MONTHLY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'WAIVED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentType" ADD VALUE 'SEMI_ANNUAL';
ALTER TYPE "PaymentType" ADD VALUE 'QUARTERLY';
ALTER TYPE "PaymentType" ADD VALUE 'BI_MONTHLY';
ALTER TYPE "PaymentType" ADD VALUE 'CUSTOM';

-- AlterTable
ALTER TABLE "RentPayment" ADD COLUMN     "installmentId" TEXT,
ADD COLUMN     "method" TEXT,
ADD COLUMN     "reference" TEXT;

-- AlterTable
ALTER TABLE "TenantLease" ADD COLUMN     "paymentAnchorDay" INTEGER,
ADD COLUMN     "paymentFrequency" "RentFrequency" NOT NULL DEFAULT 'ANNUAL',
ADD COLUMN     "scheduleUpdatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "RentInstallment" (
    "id" TEXT NOT NULL,
    "tenantLeaseId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amountDue" DOUBLE PRECISION NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "InstallmentStatus" NOT NULL DEFAULT 'PENDING',
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "note" TEXT,
    "paidInFullAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RentInstallment_tenantLeaseId_dueDate_idx" ON "RentInstallment"("tenantLeaseId", "dueDate");

-- CreateIndex
CREATE INDEX "RentInstallment_dueDate_status_idx" ON "RentInstallment"("dueDate", "status");

-- CreateIndex
CREATE INDEX "RentInstallment_status_idx" ON "RentInstallment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RentInstallment_tenantLeaseId_sequence_key" ON "RentInstallment"("tenantLeaseId", "sequence");

-- CreateIndex
CREATE INDEX "RentPayment_installmentId_idx" ON "RentPayment"("installmentId");

-- AddForeignKey
ALTER TABLE "RentPayment" ADD CONSTRAINT "RentPayment_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "RentInstallment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentInstallment" ADD CONSTRAINT "RentInstallment_tenantLeaseId_fkey" FOREIGN KEY ("tenantLeaseId") REFERENCES "TenantLease"("id") ON DELETE CASCADE ON UPDATE CASCADE;
