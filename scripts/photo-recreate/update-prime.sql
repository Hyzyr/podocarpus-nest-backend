-- PROD: replace Prime Residency 3 - Unit 320 gallery with the 5 new photos.
-- Run AFTER copying the 5 new webp to the server and deleting the old prime files.
BEGIN;

UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/prime-residency-3-320-1.webp',
    '/uploads/properties/images/prime-residency-3-320-2.webp',
    '/uploads/properties/images/prime-residency-3-320-3.webp',
    '/uploads/properties/images/prime-residency-3-320-4.webp',
    '/uploads/properties/images/prime-residency-3-320-5.webp'
  ], "updatedAt" = now()
WHERE id = '10def9d7-b008-479e-a799-5d394edc5390';

COMMIT;
