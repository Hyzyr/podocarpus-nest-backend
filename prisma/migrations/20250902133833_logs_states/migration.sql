-- DropForeignKey
ALTER TABLE "public"."InvestorPreferences" DROP CONSTRAINT "InvestorPreferences_investorProfileId_fkey";

-- AlterTable
ALTER TABLE "public"."Property" ADD COLUMN     "ownerId" TEXT;

-- CreateTable
CREATE TABLE "public"."Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPropertyStatus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPropertyStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserEventStatus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserEventStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserPropertyStatus_propertyId_idx" ON "public"."UserPropertyStatus"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPropertyStatus_userId_propertyId_key" ON "public"."UserPropertyStatus"("userId", "propertyId");

-- CreateIndex
CREATE INDEX "UserEventStatus_eventId_idx" ON "public"."UserEventStatus"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "UserEventStatus_userId_eventId_key" ON "public"."UserEventStatus"("userId", "eventId");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_type_idx" ON "public"."ActivityLog"("userId", "type");

-- CreateIndex
CREATE INDEX "ActivityLog_entityId_idx" ON "public"."ActivityLog"("entityId");

-- AddForeignKey
ALTER TABLE "public"."InvestorPreferences" ADD CONSTRAINT "InvestorPreferences_investorProfileId_fkey" FOREIGN KEY ("investorProfileId") REFERENCES "public"."InvestorProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."InvestorProfile"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPropertyStatus" ADD CONSTRAINT "UserPropertyStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPropertyStatus" ADD CONSTRAINT "UserPropertyStatus_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserEventStatus" ADD CONSTRAINT "UserEventStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserEventStatus" ADD CONSTRAINT "UserEventStatus_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
