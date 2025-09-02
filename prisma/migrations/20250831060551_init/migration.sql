/*
  Warnings:

  - You are about to drop the `InvestmentSurvey` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[investorProfileId]` on the table `InvestorPreferences` will be added. If there are existing duplicate values, this will fail.

*/
-- DropTable
DROP TABLE "public"."InvestmentSurvey";

-- CreateIndex
CREATE UNIQUE INDEX "InvestorPreferences_investorProfileId_key" ON "public"."InvestorPreferences"("investorProfileId");
