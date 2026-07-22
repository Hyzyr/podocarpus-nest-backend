-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "featuredRank" INTEGER,
ADD COLUMN     "statusLabel" TEXT,
ADD COLUMN     "vacancyRisk" TEXT;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "subtitle" TEXT,
ADD COLUMN     "stats" JSON NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "LandingPageStats" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "yearsOperating" INTEGER,
    "maxLeaseTermYears" INTEGER,
    "totalProperties" INTEGER,
    "availableProperties" INTEGER,
    "averageRoi" DOUBLE PRECISION,
    "roiMin" DOUBLE PRECISION,
    "roiMax" DOUBLE PRECISION,
    "totalInvestedValue" DOUBLE PRECISION,
    "totalProfit" DOUBLE PRECISION,
    "activeContracts" INTEGER,
    "occupancyRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingPageStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuccessCase" (
    "id" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "hasConsent" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "quote" TEXT NOT NULL,
    "investorName" TEXT NOT NULL,
    "investorTitle" TEXT,
    "avatarUrl" TEXT,
    "totalProfit" DOUBLE PRECISION,
    "totalRoi" DOUBLE PRECISION,
    "propertyId" TEXT,
    "propertySnapshot" JSON,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuccessCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Property_isEnabled_ownerId_featuredRank_createdAt_idx" ON "Property"("isEnabled", "ownerId", "featuredRank", "createdAt");

-- CreateIndex
CREATE INDEX "Event_isActive_status_startsAt_idx" ON "Event"("isActive", "status", "startsAt");

-- CreateIndex
CREATE INDEX "SuccessCase_isPublished_hasConsent_displayOrder_publishedAt_idx" ON "SuccessCase"("isPublished", "hasConsent", "displayOrder", "publishedAt");

-- CreateIndex
CREATE INDEX "SuccessCase_propertyId_idx" ON "SuccessCase"("propertyId");

-- AddForeignKey
ALTER TABLE "SuccessCase" ADD CONSTRAINT "SuccessCase_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
