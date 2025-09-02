/*
  Warnings:

  - The primary key for the `InvestorPreferences` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `InvestorPreferences` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."InvestorPreferences" DROP CONSTRAINT "InvestorPreferences_id_fkey";

-- DropIndex
DROP INDEX "public"."InvestorPreferences_investorProfileId_key";

-- AlterTable
ALTER TABLE "public"."InvestorPreferences" DROP CONSTRAINT "InvestorPreferences_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "InvestorPreferences_pkey" PRIMARY KEY ("investorProfileId");

-- AddForeignKey
ALTER TABLE "public"."InvestorPreferences" ADD CONSTRAINT "InvestorPreferences_investorProfileId_fkey" FOREIGN KEY ("investorProfileId") REFERENCES "public"."InvestorProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
