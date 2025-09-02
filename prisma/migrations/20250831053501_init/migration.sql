/*
  Warnings:

  - You are about to drop the column `companyName` on the `BrokerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `BrokerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `BrokerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `licenseNo` on the `BrokerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `InvestorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `InvestorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `nationality` on the `InvestorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `InvestorProfile` table. All the data in the column will be lost.
  - Added the required column `firstName` to the `AppUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `AppUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nationality` to the `AppUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `AppUser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."AppUser" ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "nationality" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."BrokerProfile" DROP COLUMN "companyName",
DROP COLUMN "firstName",
DROP COLUMN "lastName",
DROP COLUMN "licenseNo";

-- AlterTable
ALTER TABLE "public"."InvestorProfile" DROP COLUMN "firstName",
DROP COLUMN "lastName",
DROP COLUMN "nationality",
DROP COLUMN "phone";
