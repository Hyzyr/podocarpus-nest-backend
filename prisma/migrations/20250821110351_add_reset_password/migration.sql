-- AlterTable
ALTER TABLE "public"."AppUser" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);
