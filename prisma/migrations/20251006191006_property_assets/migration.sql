/*
  Warnings:

  - You are about to drop the column `fileUrl` on the `Contract` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Contract" DROP COLUMN "fileUrl",
ADD COLUMN     "filesUrl" TEXT[];

-- AlterTable
ALTER TABLE "public"."Property" ADD COLUMN     "assets" TEXT[];
