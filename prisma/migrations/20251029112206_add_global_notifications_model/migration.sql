-- CreateTable
CREATE TABLE "GlobalNotification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'system',
    "targetRoles" "UserRole"[],
    "link" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "icon" TEXT,
    "json" JSONB,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalNotificationView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "globalNotificationId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GlobalNotificationView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GlobalNotification_isActive_startsAt_idx" ON "GlobalNotification"("isActive", "startsAt");

-- CreateIndex
CREATE INDEX "GlobalNotification_createdAt_idx" ON "GlobalNotification"("createdAt");

-- CreateIndex
CREATE INDEX "GlobalNotificationView_globalNotificationId_viewedAt_idx" ON "GlobalNotificationView"("globalNotificationId", "viewedAt");

-- CreateIndex
CREATE INDEX "GlobalNotificationView_userId_viewedAt_idx" ON "GlobalNotificationView"("userId", "viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalNotificationView_userId_globalNotificationId_key" ON "GlobalNotificationView"("userId", "globalNotificationId");

-- AddForeignKey
ALTER TABLE "GlobalNotificationView" ADD CONSTRAINT "GlobalNotificationView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlobalNotificationView" ADD CONSTRAINT "GlobalNotificationView_globalNotificationId_fkey" FOREIGN KEY ("globalNotificationId") REFERENCES "GlobalNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
