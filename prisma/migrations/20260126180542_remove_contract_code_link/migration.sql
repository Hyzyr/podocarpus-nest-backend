/*
  Warnings:

  - You are about to drop the column `contractCode` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `contractLink` on the `Contract` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Contract" DROP COLUMN "contractCode",
DROP COLUMN "contractLink";
