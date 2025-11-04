/*
  Warnings:

  - You are about to drop the column `isActive` on the `AppUser` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Property` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AppUser" DROP COLUMN "isActive",
ADD COLUMN     "isEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "isActive",
ADD COLUMN     "isEnabled" BOOLEAN NOT NULL DEFAULT true;
