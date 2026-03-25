-- CreateIndex
CREATE INDEX "AppUser_role_isEnabled_idx" ON "AppUser"("role", "isEnabled");

-- CreateIndex
CREATE INDEX "Property_area_status_idx" ON "Property"("area", "status");

-- CreateIndex
CREATE INDEX "Property_isEnabled_isVacant_idx" ON "Property"("isEnabled", "isVacant");

-- CreateIndex
CREATE INDEX "Property_city_idx" ON "Property"("city");

-- CreateIndex
CREATE INDEX "Property_ownerId_idx" ON "Property"("ownerId");
