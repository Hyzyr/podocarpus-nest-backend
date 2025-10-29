/*
  Warnings:

  - You are about to drop the column `tenantMonthlyRent` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `tenantPaymentMethod` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `tenantRentExpiry` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `tenantRentStart` on the `Property` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "InvestmentStatistics" ADD COLUMN     "cumulativeProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "cumulativeRoi" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tenantLeaseId" TEXT;

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "tenantMonthlyRent",
DROP COLUMN "tenantPaymentMethod",
DROP COLUMN "tenantRentExpiry",
DROP COLUMN "tenantRentStart";

-- CreateTable
CREATE TABLE "TenantLease" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tenantName" TEXT,
    "tenantEmail" TEXT,
    "tenantPhone" TEXT,
    "leaseStart" TIMESTAMP(3) NOT NULL,
    "leaseEnd" TIMESTAMP(3),
    "monthlyRent" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT,
    "depositAmount" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "terminatedEarly" BOOLEAN NOT NULL DEFAULT false,
    "terminationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantLease_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenantLease_propertyId_idx" ON "TenantLease"("propertyId");

-- CreateIndex
CREATE INDEX "TenantLease_leaseStart_leaseEnd_idx" ON "TenantLease"("leaseStart", "leaseEnd");

-- AddForeignKey
ALTER TABLE "TenantLease" ADD CONSTRAINT "TenantLease_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentStatistics" ADD CONSTRAINT "InvestmentStatistics_tenantLeaseId_fkey" FOREIGN KEY ("tenantLeaseId") REFERENCES "TenantLease"("id") ON DELETE SET NULL ON UPDATE CASCADE;
