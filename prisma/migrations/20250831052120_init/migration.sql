/*
  Warnings:

  - Added the required column `nationality` to the `InvestorProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `InvestorProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."AppUser" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."InvestorProfile" ADD COLUMN     "nationality" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."InvestorPreferences" (
    "id" TEXT NOT NULL,
    "investorProfileId" TEXT NOT NULL,
    "investingInDubai" BOOLEAN NOT NULL,
    "openToJointInvestments" BOOLEAN NOT NULL,
    "wantsAdvisorCall" BOOLEAN NOT NULL,
    "interestedInEvents" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InvestmentSurvey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "investingInDubai" BOOLEAN NOT NULL,
    "openToJointInvestments" BOOLEAN NOT NULL,
    "wantsAdvisorCall" BOOLEAN NOT NULL,
    "interestedInEvents" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentSurvey_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."InvestorPreferences" ADD CONSTRAINT "InvestorPreferences_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."InvestorProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
