-- LOCAL (realestate_mvp): feature one property per tower on the landing page.
-- Keyed on buildingName + unitNo. featuredRank orders the landing (asc, nulls last).
-- The landing must request ?limit=7 to show exactly these 7 (default limit is 4).
BEGIN;

-- clear every existing rank first
UPDATE "Property" SET "featuredRank" = NULL;

UPDATE "Property" SET "featuredRank" = 1 WHERE "buildingName" = 'Marina Pinnacle' AND "unitNo" = '5105';
UPDATE "Property" SET "featuredRank" = 2 WHERE "buildingName" = 'Marina Plaza'    AND "unitNo" = '3503';
UPDATE "Property" SET "featuredRank" = 3 WHERE "buildingName" = 'Al Jawhara'      AND "unitNo" = '2010';
UPDATE "Property" SET "featuredRank" = 4 WHERE "buildingName" = 'Gold Tower'      AND "unitNo" = 'B3-05-01';
UPDATE "Property" SET "featuredRank" = 5 WHERE "buildingName" = 'Silver Tower'    AND "unitNo" = '11K';
UPDATE "Property" SET "featuredRank" = 6 WHERE "buildingName" = 'Fortune Tower'   AND "unitNo" = '2005/2006';
UPDATE "Property" SET "featuredRank" = 7 WHERE "buildingName" = 'Mazaya'          AND "unitNo" = '2905';

COMMIT;
