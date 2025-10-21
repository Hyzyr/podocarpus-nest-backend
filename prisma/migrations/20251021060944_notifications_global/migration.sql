-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "isGlobal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "targetRoles" "UserRole"[],
ALTER COLUMN "userId" DROP NOT NULL;
