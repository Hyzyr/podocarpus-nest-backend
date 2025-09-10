/*
  Warnings:

  - Made the column `contractValue` on table `Property` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Property" ALTER COLUMN "contractValue" SET NOT NULL,
ALTER COLUMN "contractValue" SET DEFAULT 1000;
