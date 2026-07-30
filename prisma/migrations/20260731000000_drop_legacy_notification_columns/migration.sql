-- Drop the vestigial broadcast fields from Notification.
--
-- These predate the split into Notification (one row per person) and
-- GlobalNotification (one row, targeted at roles). Once broadcasts moved to
-- their own model these stopped being read, but call sites kept setting
-- targetRoles on user-specific rows where it had no effect.
--
-- Verified before dropping: 0 rows with isGlobal = true, 0 rows with a
-- non-empty targetRoles.
ALTER TABLE "Notification" DROP COLUMN "isGlobal",
DROP COLUMN "targetRoles";
