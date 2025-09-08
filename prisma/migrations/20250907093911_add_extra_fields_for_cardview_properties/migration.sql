-- AlterTable
ALTER TABLE "public"."Property" ADD COLUMN     "freezoneAuthority" TEXT,
ADD COLUMN     "isTaxFreeZone" BOOLEAN,
ADD COLUMN     "keyBenefits" TEXT[],
ADD COLUMN     "netRoiMax" DOUBLE PRECISION,
ADD COLUMN     "netRoiMin" DOUBLE PRECISION,
ADD COLUMN     "vacancyRisk" TEXT;
