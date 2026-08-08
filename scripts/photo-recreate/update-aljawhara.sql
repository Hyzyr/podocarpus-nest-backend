-- Set ONE shared gallery on every Al Jawhara unit: tower hero + unit 2010's photos.
-- Keyed on buildingName, so this same file works on BOTH prod and local.
BEGIN;

UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-al-jawhara-tower-skyscraper-landscape.png',
    '/uploads/properties/images/al-jawhara-2010-1.webp',
    '/uploads/properties/images/al-jawhara-2010-2.webp',
    '/uploads/properties/images/al-jawhara-2010-3.webp',
    '/uploads/properties/images/al-jawhara-2010-4.webp',
    '/uploads/properties/images/al-jawhara-2010-5.webp',
    '/uploads/properties/images/al-jawhara-2010-6.webp',
    '/uploads/properties/images/al-jawhara-2010-7.webp',
    '/uploads/properties/images/al-jawhara-2010-8.webp',
    '/uploads/properties/images/al-jawhara-2010-9.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Al Jawhara';

COMMIT;
