/*
  Warnings:

  - You are about to drop the `PropertyDocument` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PropertyDocument" DROP CONSTRAINT "PropertyDocument_propertyId_fkey";

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "documents" JSONB NOT NULL DEFAULT '[]';

-- DropTable
DROP TABLE "PropertyDocument";
