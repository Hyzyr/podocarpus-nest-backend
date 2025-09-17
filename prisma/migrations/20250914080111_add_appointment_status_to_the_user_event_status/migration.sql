/*
  Warnings:

  - The `status` column on the `Appointment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `seen` on the `UserEventStatus` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."UserActionsStatus" AS ENUM ('seen', 'requested', 'confirmed', 'completed', 'noShow', 'canceled');

-- AlterTable
ALTER TABLE "public"."Appointment" DROP COLUMN "status",
ADD COLUMN     "status" "public"."UserActionsStatus" NOT NULL DEFAULT 'requested';

-- AlterTable
ALTER TABLE "public"."UserEventStatus" DROP COLUMN "seen",
ADD COLUMN     "status" "public"."UserActionsStatus" NOT NULL DEFAULT 'seen';

-- DropEnum
DROP TYPE "public"."AppointmentStatus";
