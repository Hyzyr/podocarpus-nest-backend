-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "stats" SET DATA TYPE JSON;

-- AlterTable
ALTER TABLE "SuccessCase" ALTER COLUMN "propertySnapshot" SET DATA TYPE JSON;
