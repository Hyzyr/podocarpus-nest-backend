/*
  Warnings:

  - You are about to drop the column `endDate` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `depositReceived` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `rateYear` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `rentExpiry` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `rentStart` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `rentValue` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `vacancyRisk` on the `Property` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Contract" DROP COLUMN "endDate",
DROP COLUMN "price",
DROP COLUMN "startDate",
ADD COLUMN     "contractEnd" TIMESTAMP(3),
ADD COLUMN     "contractStart" TIMESTAMP(3),
ADD COLUMN     "contractValue" DOUBLE PRECISION,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "depositPaid" DOUBLE PRECISION,
ADD COLUMN     "investorPaymentMethod" TEXT,
ADD COLUMN     "paymentSchedule" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "vacancyRiskLevel" TEXT;

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "depositReceived",
DROP COLUMN "paymentMethod",
DROP COLUMN "rateYear",
DROP COLUMN "rentExpiry",
DROP COLUMN "rentStart",
DROP COLUMN "rentValue",
DROP COLUMN "vacancyRisk",
ADD COLUMN     "isVacant" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tenantMonthlyRent" DOUBLE PRECISION,
ADD COLUMN     "tenantPaymentMethod" TEXT,
ADD COLUMN     "tenantRentExpiry" TIMESTAMP(3),
ADD COLUMN     "tenantRentStart" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "InvestmentStatistics" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "rentReceived" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "serviceCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maintenanceCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roiPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "daysOccupied" INTEGER NOT NULL DEFAULT 0,
    "daysVacant" INTEGER NOT NULL DEFAULT 0,
    "wasVacant" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentStatistics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvestmentStatistics_contractId_idx" ON "InvestmentStatistics"("contractId");

-- CreateIndex
CREATE INDEX "InvestmentStatistics_year_month_idx" ON "InvestmentStatistics"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentStatistics_contractId_month_year_key" ON "InvestmentStatistics"("contractId", "month", "year");

-- AddForeignKey
ALTER TABLE "InvestmentStatistics" ADD CONSTRAINT "InvestmentStatistics_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
