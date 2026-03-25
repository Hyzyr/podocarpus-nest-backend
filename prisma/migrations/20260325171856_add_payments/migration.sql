-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('ANNUAL', 'MONTHLY');

-- AlterTable
ALTER TABLE "TenantLease" ADD COLUMN     "annualRent" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "RentPayment" (
    "id" TEXT NOT NULL,
    "tenantLeaseId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidDate" TIMESTAMP(3) NOT NULL,
    "type" "PaymentType" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "recordedById" TEXT,

    CONSTRAINT "RentPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RentPayment_tenantLeaseId_idx" ON "RentPayment"("tenantLeaseId");

-- CreateIndex
CREATE INDEX "RentPayment_paidDate_idx" ON "RentPayment"("paidDate");

-- AddForeignKey
ALTER TABLE "RentPayment" ADD CONSTRAINT "RentPayment_tenantLeaseId_fkey" FOREIGN KEY ("tenantLeaseId") REFERENCES "TenantLease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentPayment" ADD CONSTRAINT "RentPayment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "AppUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
