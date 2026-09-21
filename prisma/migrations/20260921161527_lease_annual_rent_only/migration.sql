-- Lease money model simplification: annualRent becomes the single source of
-- truth. monthlyRent is derived (annualRent / 12) where a monthly figure is
-- needed; collection cadence lives in the RentInstallment rows, so the
-- persisted frequency/anchor inputs are dropped.

-- Backfill so no lease loses its money figure before NOT NULL.
UPDATE "TenantLease" SET "annualRent" = "monthlyRent" * 12 WHERE "annualRent" IS NULL;

-- AlterTable
ALTER TABLE "TenantLease" ALTER COLUMN "annualRent" SET NOT NULL;
ALTER TABLE "TenantLease" DROP COLUMN "monthlyRent";
ALTER TABLE "TenantLease" DROP COLUMN "paymentFrequency";
ALTER TABLE "TenantLease" DROP COLUMN "paymentAnchorDay";
