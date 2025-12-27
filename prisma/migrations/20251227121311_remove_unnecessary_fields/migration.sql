/*
  Warnings:

  - You are about to drop the column `metadata` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `terms` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `UserKycProfile` table. All the data in the column will be lost.
  - You are about to drop the column `buyerType` on the `UserKycProfile` table. All the data in the column will be lost.
  - You are about to drop the column `contactInfo` on the `UserKycProfile` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyContact` on the `UserKycProfile` table. All the data in the column will be lost.
  - You are about to drop the column `workInfo` on the `UserKycProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Contract" DROP COLUMN "metadata",
DROP COLUMN "terms";

-- AlterTable
ALTER TABLE "UserKycProfile" DROP COLUMN "address",
DROP COLUMN "buyerType",
DROP COLUMN "contactInfo",
DROP COLUMN "emergencyContact",
DROP COLUMN "workInfo";
