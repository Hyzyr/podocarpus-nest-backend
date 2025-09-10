-- CreateEnum
CREATE TYPE "public"."EventStatus" AS ENUM ('DRAFT', 'UPCOMING', 'OPEN', 'ENDED', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."Event" ADD COLUMN     "status" "public"."EventStatus" NOT NULL DEFAULT 'OPEN';
