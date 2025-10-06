-- CreateEnum
CREATE TYPE "public"."ContractStatus" AS ENUM ('draft', 'pending', 'active', 'suspended', 'expired', 'terminated', 'completed', 'canceled');

-- CreateTable
CREATE TABLE "public"."Contract" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "brokerId" TEXT,
    "contractCode" TEXT NOT NULL,
    "contractLink" TEXT,
    "fileUrl" TEXT,
    "signedDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "price" DOUBLE PRECISION,
    "status" "public"."ContractStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Contract" ADD CONSTRAINT "Contract_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "public"."AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contract" ADD CONSTRAINT "Contract_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
