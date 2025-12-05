-- CreateEnum
CREATE TYPE "ChangeSetStatus" AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'applied', 'cancelled');

-- CreateEnum
CREATE TYPE "SignatureRole" AS ENUM ('investor', 'broker', 'admin');

-- CreateEnum
CREATE TYPE "SignatureStatus" AS ENUM ('pending', 'signed', 'declined', 'revoked');

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "currentVersionId" TEXT,
ADD COLUMN     "formData" JSON,
ADD COLUMN     "metadata" JSON,
ADD COLUMN     "terms" JSON,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "UserKycProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "buyerType" TEXT,
    "emiratesId" JSON,
    "passport" JSON,
    "workInfo" JSON,
    "contactInfo" JSON,
    "address" JSON,
    "emergencyContact" JSON,
    "documents" JSON,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserKycProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractVersion" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "snapshot" JSON NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractChangeSet" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "baseVersion" INTEGER NOT NULL,
    "patch" JSON NOT NULL,
    "reason" TEXT,
    "status" "ChangeSetStatus" NOT NULL DEFAULT 'draft',
    "requestedById" TEXT,
    "reviewedById" TEXT,
    "approvedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractChangeSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractSignature" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "role" "SignatureRole" NOT NULL,
    "signerId" TEXT,
    "status" "SignatureStatus" NOT NULL DEFAULT 'pending',
    "signedAt" TIMESTAMP(3),
    "evidence" JSON,

    CONSTRAINT "ContractSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractEvent" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSON,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserKycProfile_userId_key" ON "UserKycProfile"("userId");

-- CreateIndex
CREATE INDEX "ContractVersion_contractId_createdAt_idx" ON "ContractVersion"("contractId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContractVersion_contractId_versionNumber_key" ON "ContractVersion"("contractId", "versionNumber");

-- CreateIndex
CREATE INDEX "ContractChangeSet_contractId_status_idx" ON "ContractChangeSet"("contractId", "status");

-- CreateIndex
CREATE INDEX "ContractChangeSet_contractId_baseVersion_idx" ON "ContractChangeSet"("contractId", "baseVersion");

-- CreateIndex
CREATE INDEX "ContractSignature_contractId_role_status_idx" ON "ContractSignature"("contractId", "role", "status");

-- CreateIndex
CREATE INDEX "ContractEvent_contractId_createdAt_idx" ON "ContractEvent"("contractId", "createdAt");

-- CreateIndex
CREATE INDEX "ContractEvent_type_idx" ON "ContractEvent"("type");

-- CreateIndex
CREATE INDEX "Contract_status_updatedAt_idx" ON "Contract"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Contract_propertyId_idx" ON "Contract"("propertyId");

-- CreateIndex
CREATE INDEX "Contract_investorId_idx" ON "Contract"("investorId");

-- AddForeignKey
ALTER TABLE "UserKycProfile" ADD CONSTRAINT "UserKycProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractVersion" ADD CONSTRAINT "ContractVersion_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractChangeSet" ADD CONSTRAINT "ContractChangeSet_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractSignature" ADD CONSTRAINT "ContractSignature_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractEvent" ADD CONSTRAINT "ContractEvent_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
