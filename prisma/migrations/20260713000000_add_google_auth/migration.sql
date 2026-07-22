-- AlterTable
ALTER TABLE "AppUser" ADD COLUMN     "googleId" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_googleId_key" ON "AppUser"("googleId");
