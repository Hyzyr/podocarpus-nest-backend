-- LOCAL (realestate_mvp): INITIAL full rebuild, keyed on buildingName + unitNo.
-- Covers all local units incl. 1308/1508 which are not in prod.
-- ⚠ SUPERSEDED for some properties — re-running this REVERTS them:
--     Prime Residency 320 -> now 5 photos      (see update-prime.sql)
--     All Al Jawhara units -> now one shared set (see update-aljawhara.sql)
BEGIN;

-- Al Jawhara - Unit 1007  (reuse 1108)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-al-jawhara-tower-skyscraper-landscape.png',
    '/uploads/properties/images/al-jawhara-1108-1.webp',
    '/uploads/properties/images/al-jawhara-1108-2.webp',
    '/uploads/properties/images/al-jawhara-1108-3.webp',
    '/uploads/properties/images/al-jawhara-1108-4.webp',
    '/uploads/properties/images/al-jawhara-1108-5.webp',
    '/uploads/properties/images/al-jawhara-1108-6.webp',
    '/uploads/properties/images/al-jawhara-1108-7.webp',
    '/uploads/properties/images/al-jawhara-1108-8.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Al Jawhara' AND "unitNo" = '1007';

-- Al Jawhara - Unit 1105  (own)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-al-jawhara-tower-skyscraper-landscape.png',
    '/uploads/properties/images/al-jawhara-1105-1.webp',
    '/uploads/properties/images/al-jawhara-1105-2.webp',
    '/uploads/properties/images/al-jawhara-1105-3.webp',
    '/uploads/properties/images/al-jawhara-1105-4.webp',
    '/uploads/properties/images/al-jawhara-1105-5.webp',
    '/uploads/properties/images/al-jawhara-1105-6.webp',
    '/uploads/properties/images/al-jawhara-1105-7.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Al Jawhara' AND "unitNo" = '1105';

-- Al Jawhara - Unit 1107  (reuse 1110)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-al-jawhara-tower-skyscraper-landscape.png',
    '/uploads/properties/images/al-jawhara-1110-1.webp',
    '/uploads/properties/images/al-jawhara-1110-2.webp',
    '/uploads/properties/images/al-jawhara-1110-3.webp',
    '/uploads/properties/images/al-jawhara-1110-4.webp',
    '/uploads/properties/images/al-jawhara-1110-5.webp',
    '/uploads/properties/images/al-jawhara-1110-6.webp',
    '/uploads/properties/images/al-jawhara-1110-7.webp',
    '/uploads/properties/images/al-jawhara-1110-8.webp',
    '/uploads/properties/images/al-jawhara-1110-9.webp',
    '/uploads/properties/images/al-jawhara-1110-10.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Al Jawhara' AND "unitNo" = '1107';

-- Al Jawhara - Unit 1108  (own)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-al-jawhara-tower-skyscraper-landscape.png',
    '/uploads/properties/images/al-jawhara-1108-1.webp',
    '/uploads/properties/images/al-jawhara-1108-2.webp',
    '/uploads/properties/images/al-jawhara-1108-3.webp',
    '/uploads/properties/images/al-jawhara-1108-4.webp',
    '/uploads/properties/images/al-jawhara-1108-5.webp',
    '/uploads/properties/images/al-jawhara-1108-6.webp',
    '/uploads/properties/images/al-jawhara-1108-7.webp',
    '/uploads/properties/images/al-jawhara-1108-8.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Al Jawhara' AND "unitNo" = '1108';

-- Al Jawhara - Unit 1110  (own)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-al-jawhara-tower-skyscraper-landscape.png',
    '/uploads/properties/images/al-jawhara-1110-1.webp',
    '/uploads/properties/images/al-jawhara-1110-2.webp',
    '/uploads/properties/images/al-jawhara-1110-3.webp',
    '/uploads/properties/images/al-jawhara-1110-4.webp',
    '/uploads/properties/images/al-jawhara-1110-5.webp',
    '/uploads/properties/images/al-jawhara-1110-6.webp',
    '/uploads/properties/images/al-jawhara-1110-7.webp',
    '/uploads/properties/images/al-jawhara-1110-8.webp',
    '/uploads/properties/images/al-jawhara-1110-9.webp',
    '/uploads/properties/images/al-jawhara-1110-10.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Al Jawhara' AND "unitNo" = '1110';

-- Al Jawhara - Unit 1205  (own)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-al-jawhara-tower-skyscraper-landscape.png',
    '/uploads/properties/images/al-jawhara-1205-1.webp',
    '/uploads/properties/images/al-jawhara-1205-2.webp',
    '/uploads/properties/images/al-jawhara-1205-3.webp',
    '/uploads/properties/images/al-jawhara-1205-4.webp',
    '/uploads/properties/images/al-jawhara-1205-5.webp',
    '/uploads/properties/images/al-jawhara-1205-6.webp',
    '/uploads/properties/images/al-jawhara-1205-7.webp',
    '/uploads/properties/images/al-jawhara-1205-8.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Al Jawhara' AND "unitNo" = '1205';

-- Al Jawhara - Unit 1207  (reuse 1205)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-al-jawhara-tower-skyscraper-landscape.png',
    '/uploads/properties/images/al-jawhara-1205-1.webp',
    '/uploads/properties/images/al-jawhara-1205-2.webp',
    '/uploads/properties/images/al-jawhara-1205-3.webp',
    '/uploads/properties/images/al-jawhara-1205-4.webp',
    '/uploads/properties/images/al-jawhara-1205-5.webp',
    '/uploads/properties/images/al-jawhara-1205-6.webp',
    '/uploads/properties/images/al-jawhara-1205-7.webp',
    '/uploads/properties/images/al-jawhara-1205-8.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Al Jawhara' AND "unitNo" = '1207';

-- Al Jawhara - Unit 1208  (own)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-al-jawhara-tower-skyscraper-landscape.png',
    '/uploads/properties/images/al-jawhara-1208-1.webp',
    '/uploads/properties/images/al-jawhara-1208-2.webp',
    '/uploads/properties/images/al-jawhara-1208-3.webp',
    '/uploads/properties/images/al-jawhara-1208-4.webp',
    '/uploads/properties/images/al-jawhara-1208-5.webp',
    '/uploads/properties/images/al-jawhara-1208-6.webp',
    '/uploads/properties/images/al-jawhara-1208-7.webp',
    '/uploads/properties/images/al-jawhara-1208-8.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Al Jawhara' AND "unitNo" = '1208';

-- Al Jawhara - Unit 1210  (own)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-al-jawhara-tower-skyscraper-landscape.png',
    '/uploads/properties/images/al-jawhara-1210-1.webp',
    '/uploads/properties/images/al-jawhara-1210-2.webp',
    '/uploads/properties/images/al-jawhara-1210-3.webp',
    '/uploads/properties/images/al-jawhara-1210-4.webp',
    '/uploads/properties/images/al-jawhara-1210-5.webp',
    '/uploads/properties/images/al-jawhara-1210-6.webp',
    '/uploads/properties/images/al-jawhara-1210-7.webp',
    '/uploads/properties/images/al-jawhara-1210-8.webp',
    '/uploads/properties/images/al-jawhara-1210-9.webp',
    '/uploads/properties/images/al-jawhara-1210-10.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Al Jawhara' AND "unitNo" = '1210';

-- Al Jawhara - Unit 1305  (own)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-al-jawhara-tower-skyscraper-landscape.png',
    '/uploads/properties/images/al-jawhara-1305-1.webp',
    '/uploads/properties/images/al-jawhara-1305-2.webp',
    '/uploads/properties/images/al-jawhara-1305-3.webp',
    '/uploads/properties/images/al-jawhara-1305-4.webp',
    '/uploads/properties/images/al-jawhara-1305-5.webp',
    '/uploads/properties/images/al-jawhara-1305-6.webp',
    '/uploads/properties/images/al-jawhara-1305-7.webp',
    '/uploads/properties/images/al-jawhara-1305-8.webp',
    '/uploads/properties/images/al-jawhara-1305-9.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Al Jawhara' AND "unitNo" = '1305';

-- Al Jawhara - Unit 1307  (reuse 1208)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-al-jawhara-tower-skyscraper-landscape.png',
    '/uploads/properties/images/al-jawhara-1208-1.webp',
    '/uploads/properties/images/al-jawhara-1208-2.webp',
    '/uploads/properties/images/al-jawhara-1208-3.webp',
    '/uploads/properties/images/al-jawhara-1208-4.webp',
    '/uploads/properties/images/al-jawhara-1208-5.webp',
    '/uploads/properties/images/al-jawhara-1208-6.webp',
    '/uploads/properties/images/al-jawhara-1208-7.webp',
    '/uploads/properties/images/al-jawhara-1208-8.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Al Jawhara' AND "unitNo" = '1307';

-- Al Jawhara - Unit 1308  (reuse 1305)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-al-jawhara-tower-skyscraper-landscape.png',
    '/uploads/properties/images/al-jawhara-1305-1.webp',
    '/uploads/properties/images/al-jawhara-1305-2.webp',
    '/uploads/properties/images/al-jawhara-1305-3.webp',
    '/uploads/properties/images/al-jawhara-1305-4.webp',
    '/uploads/properties/images/al-jawhara-1305-5.webp',
    '/uploads/properties/images/al-jawhara-1305-6.webp',
    '/uploads/properties/images/al-jawhara-1305-7.webp',
    '/uploads/properties/images/al-jawhara-1305-8.webp',
    '/uploads/properties/images/al-jawhara-1305-9.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Al Jawhara' AND "unitNo" = '1308';

-- Al Jawhara - Unit 1310  (own)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-al-jawhara-tower-skyscraper-landscape.png',
    '/uploads/properties/images/al-jawhara-1310-1.webp',
    '/uploads/properties/images/al-jawhara-1310-2.webp',
    '/uploads/properties/images/al-jawhara-1310-3.webp',
    '/uploads/properties/images/al-jawhara-1310-4.webp',
    '/uploads/properties/images/al-jawhara-1310-5.webp',
    '/uploads/properties/images/al-jawhara-1310-6.webp',
    '/uploads/properties/images/al-jawhara-1310-7.webp',
    '/uploads/properties/images/al-jawhara-1310-8.webp',
    '/uploads/properties/images/al-jawhara-1310-9.webp',
    '/uploads/properties/images/al-jawhara-1310-10.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Al Jawhara' AND "unitNo" = '1310';

-- Al Jawhara - Unit 1405  (own)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-al-jawhara-tower-skyscraper-landscape.png',
    '/uploads/properties/images/al-jawhara-1405-1.webp',
    '/uploads/properties/images/al-jawhara-1405-2.webp',
    '/uploads/properties/images/al-jawhara-1405-3.webp',
    '/uploads/properties/images/al-jawhara-1405-4.webp',
    '/uploads/properties/images/al-jawhara-1405-5.webp',
    '/uploads/properties/images/al-jawhara-1405-6.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Al Jawhara' AND "unitNo" = '1405';

-- Al Jawhara - Unit 1408  (own)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-al-jawhara-tower-skyscraper-landscape.png',
    '/uploads/properties/images/al-jawhara-1408-1.webp',
    '/uploads/properties/images/al-jawhara-1408-2.webp',
    '/uploads/properties/images/al-jawhara-1408-3.webp',
    '/uploads/properties/images/al-jawhara-1408-4.webp',
    '/uploads/properties/images/al-jawhara-1408-5.webp',
    '/uploads/properties/images/al-jawhara-1408-6.webp',
    '/uploads/properties/images/al-jawhara-1408-7.webp',
    '/uploads/properties/images/al-jawhara-1408-8.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Al Jawhara' AND "unitNo" = '1408';

-- Al Jawhara - Unit 1505  (own)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-al-jawhara-tower-skyscraper-landscape.png',
    '/uploads/properties/images/al-jawhara-1505-1.webp',
    '/uploads/properties/images/al-jawhara-1505-2.webp',
    '/uploads/properties/images/al-jawhara-1505-3.webp',
    '/uploads/properties/images/al-jawhara-1505-4.webp',
    '/uploads/properties/images/al-jawhara-1505-5.webp',
    '/uploads/properties/images/al-jawhara-1505-6.webp',
    '/uploads/properties/images/al-jawhara-1505-7.webp',
    '/uploads/properties/images/al-jawhara-1505-8.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Al Jawhara' AND "unitNo" = '1505';

-- Al Jawhara - Unit 1508  (reuse 1505)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-al-jawhara-tower-skyscraper-landscape.png',
    '/uploads/properties/images/al-jawhara-1505-1.webp',
    '/uploads/properties/images/al-jawhara-1505-2.webp',
    '/uploads/properties/images/al-jawhara-1505-3.webp',
    '/uploads/properties/images/al-jawhara-1505-4.webp',
    '/uploads/properties/images/al-jawhara-1505-5.webp',
    '/uploads/properties/images/al-jawhara-1505-6.webp',
    '/uploads/properties/images/al-jawhara-1505-7.webp',
    '/uploads/properties/images/al-jawhara-1505-8.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Al Jawhara' AND "unitNo" = '1508';

-- Al Jawhara - Unit 1608  (own)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-al-jawhara-tower-skyscraper-landscape.png',
    '/uploads/properties/images/al-jawhara-1608-1.webp',
    '/uploads/properties/images/al-jawhara-1608-2.webp',
    '/uploads/properties/images/al-jawhara-1608-3.webp',
    '/uploads/properties/images/al-jawhara-1608-4.webp',
    '/uploads/properties/images/al-jawhara-1608-5.webp',
    '/uploads/properties/images/al-jawhara-1608-6.webp',
    '/uploads/properties/images/al-jawhara-1608-7.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Al Jawhara' AND "unitNo" = '1608';

-- Al Jawhara - Unit 2010  (own)
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
WHERE "buildingName" = 'Al Jawhara' AND "unitNo" = '2010';

-- Al Jawhara - Unit 907  (reuse 1105)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-al-jawhara-tower-skyscraper-landscape.png',
    '/uploads/properties/images/al-jawhara-1105-1.webp',
    '/uploads/properties/images/al-jawhara-1105-2.webp',
    '/uploads/properties/images/al-jawhara-1105-3.webp',
    '/uploads/properties/images/al-jawhara-1105-4.webp',
    '/uploads/properties/images/al-jawhara-1105-5.webp',
    '/uploads/properties/images/al-jawhara-1105-6.webp',
    '/uploads/properties/images/al-jawhara-1105-7.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Al Jawhara' AND "unitNo" = '907';

-- Fortune Tower - Units 2005/2006  (own)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-fortune-executive-tower-skyscraper-landscape.png',
    '/uploads/properties/images/fortune-tower-2005-2006-1.webp',
    '/uploads/properties/images/fortune-tower-2005-2006-2.webp',
    '/uploads/properties/images/fortune-tower-2005-2006-3.webp',
    '/uploads/properties/images/fortune-tower-2005-2006-4.webp',
    '/uploads/properties/images/fortune-tower-2005-2006-5.webp',
    '/uploads/properties/images/fortune-tower-2005-2006-6.webp',
    '/uploads/properties/images/fortune-tower-2005-2006-7.webp',
    '/uploads/properties/images/fortune-tower-2005-2006-8.webp',
    '/uploads/properties/images/fortune-tower-2005-2006-9.webp',
    '/uploads/properties/images/fortune-tower-2005-2006-10.webp',
    '/uploads/properties/images/fortune-tower-2005-2006-11.webp',
    '/uploads/properties/images/fortune-tower-2005-2006-12.webp',
    '/uploads/properties/images/fortune-tower-2005-2006-13.webp',
    '/uploads/properties/images/fortune-tower-2005-2006-14.webp',
    '/uploads/properties/images/fortune-tower-2005-2006-15.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Fortune Tower' AND "unitNo" = '2005/2006';

-- Gold Tower - Unit 5A (B3-05-01)  (own)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-gold-tower-skyscraper-landscape.png',
    '/uploads/properties/images/gold-tower-b3-05-01-1.webp',
    '/uploads/properties/images/gold-tower-b3-05-01-2.webp',
    '/uploads/properties/images/gold-tower-b3-05-01-3.webp',
    '/uploads/properties/images/gold-tower-b3-05-01-4.webp',
    '/uploads/properties/images/gold-tower-b3-05-01-5.webp',
    '/uploads/properties/images/gold-tower-b3-05-01-6.webp',
    '/uploads/properties/images/gold-tower-b3-05-01-7.webp',
    '/uploads/properties/images/gold-tower-b3-05-01-8.webp',
    '/uploads/properties/images/gold-tower-b3-05-01-9.webp',
    '/uploads/properties/images/gold-tower-b3-05-01-10.webp',
    '/uploads/properties/images/gold-tower-b3-05-01-11.webp',
    '/uploads/properties/images/gold-tower-b3-05-01-12.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Gold Tower' AND "unitNo" = 'B3-05-01';

-- Marina Pinnacle - Unit 5105  (own)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-marina-pinnacle-tower-skyscraper-landscape.png',
    '/uploads/properties/images/marina-pinnacle-5105-1.webp',
    '/uploads/properties/images/marina-pinnacle-5105-2.webp',
    '/uploads/properties/images/marina-pinnacle-5105-3.webp',
    '/uploads/properties/images/marina-pinnacle-5105-4.webp',
    '/uploads/properties/images/marina-pinnacle-5105-5.webp',
    '/uploads/properties/images/marina-pinnacle-5105-6.webp',
    '/uploads/properties/images/marina-pinnacle-5105-7.webp',
    '/uploads/properties/images/marina-pinnacle-5105-8.webp',
    '/uploads/properties/images/marina-pinnacle-5105-9.webp',
    '/uploads/properties/images/marina-pinnacle-5105-10.webp',
    '/uploads/properties/images/marina-pinnacle-5105-11.webp',
    '/uploads/properties/images/marina-pinnacle-5105-12.webp',
    '/uploads/properties/images/marina-pinnacle-5105-13.webp',
    '/uploads/properties/images/marina-pinnacle-5105-14.webp',
    '/uploads/properties/images/marina-pinnacle-5105-15.webp',
    '/uploads/properties/images/marina-pinnacle-5105-16.webp',
    '/uploads/properties/images/marina-pinnacle-5105-17.webp',
    '/uploads/properties/images/marina-pinnacle-5105-18.webp',
    '/uploads/properties/images/marina-pinnacle-5105-19.webp',
    '/uploads/properties/images/marina-pinnacle-5105-20.webp',
    '/uploads/properties/images/marina-pinnacle-5105-21.webp',
    '/uploads/properties/images/marina-pinnacle-5105-22.webp',
    '/uploads/properties/images/marina-pinnacle-5105-23.webp',
    '/uploads/properties/images/marina-pinnacle-5105-24.webp',
    '/uploads/properties/images/marina-pinnacle-5105-25.webp',
    '/uploads/properties/images/marina-pinnacle-5105-26.webp',
    '/uploads/properties/images/marina-pinnacle-5105-27.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Marina Pinnacle' AND "unitNo" = '5105';

-- Marina Pinnacle - Unit 5904  (reuse 5105)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-marina-pinnacle-tower-skyscraper-landscape.png',
    '/uploads/properties/images/marina-pinnacle-5105-1.webp',
    '/uploads/properties/images/marina-pinnacle-5105-2.webp',
    '/uploads/properties/images/marina-pinnacle-5105-3.webp',
    '/uploads/properties/images/marina-pinnacle-5105-4.webp',
    '/uploads/properties/images/marina-pinnacle-5105-5.webp',
    '/uploads/properties/images/marina-pinnacle-5105-6.webp',
    '/uploads/properties/images/marina-pinnacle-5105-7.webp',
    '/uploads/properties/images/marina-pinnacle-5105-8.webp',
    '/uploads/properties/images/marina-pinnacle-5105-9.webp',
    '/uploads/properties/images/marina-pinnacle-5105-10.webp',
    '/uploads/properties/images/marina-pinnacle-5105-11.webp',
    '/uploads/properties/images/marina-pinnacle-5105-12.webp',
    '/uploads/properties/images/marina-pinnacle-5105-13.webp',
    '/uploads/properties/images/marina-pinnacle-5105-14.webp',
    '/uploads/properties/images/marina-pinnacle-5105-15.webp',
    '/uploads/properties/images/marina-pinnacle-5105-16.webp',
    '/uploads/properties/images/marina-pinnacle-5105-17.webp',
    '/uploads/properties/images/marina-pinnacle-5105-18.webp',
    '/uploads/properties/images/marina-pinnacle-5105-19.webp',
    '/uploads/properties/images/marina-pinnacle-5105-20.webp',
    '/uploads/properties/images/marina-pinnacle-5105-21.webp',
    '/uploads/properties/images/marina-pinnacle-5105-22.webp',
    '/uploads/properties/images/marina-pinnacle-5105-23.webp',
    '/uploads/properties/images/marina-pinnacle-5105-24.webp',
    '/uploads/properties/images/marina-pinnacle-5105-25.webp',
    '/uploads/properties/images/marina-pinnacle-5105-26.webp',
    '/uploads/properties/images/marina-pinnacle-5105-27.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Marina Pinnacle' AND "unitNo" = '5904';

-- Marina Plaza - Unit 3503  (own)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-marina-plaza-tower-skyscraper-landscape.png',
    '/uploads/properties/images/marina-plaza-3503-1.webp',
    '/uploads/properties/images/marina-plaza-3503-2.webp',
    '/uploads/properties/images/marina-plaza-3503-3.webp',
    '/uploads/properties/images/marina-plaza-3503-4.webp',
    '/uploads/properties/images/marina-plaza-3503-5.webp',
    '/uploads/properties/images/marina-plaza-3503-6.webp',
    '/uploads/properties/images/marina-plaza-3503-7.webp',
    '/uploads/properties/images/marina-plaza-3503-8.webp',
    '/uploads/properties/images/marina-plaza-3503-9.webp',
    '/uploads/properties/images/marina-plaza-3503-10.webp',
    '/uploads/properties/images/marina-plaza-3503-11.webp',
    '/uploads/properties/images/marina-plaza-3503-12.webp',
    '/uploads/properties/images/marina-plaza-3503-13.webp',
    '/uploads/properties/images/marina-plaza-3503-14.webp',
    '/uploads/properties/images/marina-plaza-3503-15.webp',
    '/uploads/properties/images/marina-plaza-3503-16.webp',
    '/uploads/properties/images/marina-plaza-3503-17.webp',
    '/uploads/properties/images/marina-plaza-3503-18.webp',
    '/uploads/properties/images/marina-plaza-3503-19.webp',
    '/uploads/properties/images/marina-plaza-3503-20.webp',
    '/uploads/properties/images/marina-plaza-3503-21.webp',
    '/uploads/properties/images/marina-plaza-3503-22.webp',
    '/uploads/properties/images/marina-plaza-3503-23.webp',
    '/uploads/properties/images/marina-plaza-3503-24.webp',
    '/uploads/properties/images/marina-plaza-3503-25.webp',
    '/uploads/properties/images/marina-plaza-3503-26.webp',
    '/uploads/properties/images/marina-plaza-3503-27.webp',
    '/uploads/properties/images/marina-plaza-3503-28.webp',
    '/uploads/properties/images/marina-plaza-3503-29.webp',
    '/uploads/properties/images/marina-plaza-3503-30.webp',
    '/uploads/properties/images/marina-plaza-3503-31.webp',
    '/uploads/properties/images/marina-plaza-3503-32.webp',
    '/uploads/properties/images/marina-plaza-3503-33.webp',
    '/uploads/properties/images/marina-plaza-3503-34.webp',
    '/uploads/properties/images/marina-plaza-3503-35.webp',
    '/uploads/properties/images/marina-plaza-3503-36.webp',
    '/uploads/properties/images/marina-plaza-3503-37.webp',
    '/uploads/properties/images/marina-plaza-3503-38.webp',
    '/uploads/properties/images/marina-plaza-3503-39.webp',
    '/uploads/properties/images/marina-plaza-3503-40.webp',
    '/uploads/properties/images/marina-plaza-3503-41.webp',
    '/uploads/properties/images/marina-plaza-3503-42.webp',
    '/uploads/properties/images/marina-plaza-3503-43.webp',
    '/uploads/properties/images/marina-plaza-3503-44.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Marina Plaza' AND "unitNo" = '3503';

-- Mazaya - Unit 2905  (own)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-mazaya-business-avenue-skyscraper-landscape.png',
    '/uploads/properties/images/mazaya-2905-1.webp',
    '/uploads/properties/images/mazaya-2905-2.webp',
    '/uploads/properties/images/mazaya-2905-3.webp',
    '/uploads/properties/images/mazaya-2905-4.webp',
    '/uploads/properties/images/mazaya-2905-5.webp',
    '/uploads/properties/images/mazaya-2905-6.webp',
    '/uploads/properties/images/mazaya-2905-7.webp',
    '/uploads/properties/images/mazaya-2905-8.webp',
    '/uploads/properties/images/mazaya-2905-9.webp',
    '/uploads/properties/images/mazaya-2905-10.webp',
    '/uploads/properties/images/mazaya-2905-11.webp',
    '/uploads/properties/images/mazaya-2905-12.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Mazaya' AND "unitNo" = '2905';

-- Prime Residency 3 - Unit 320  (own, NO HERO)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/prime-residency-3-320-1.webp',
    '/uploads/properties/images/prime-residency-3-320-2.webp',
    '/uploads/properties/images/prime-residency-3-320-3.webp',
    '/uploads/properties/images/prime-residency-3-320-4.webp',
    '/uploads/properties/images/prime-residency-3-320-5.webp',
    '/uploads/properties/images/prime-residency-3-320-6.webp',
    '/uploads/properties/images/prime-residency-3-320-7.webp',
    '/uploads/properties/images/prime-residency-3-320-8.webp',
    '/uploads/properties/images/prime-residency-3-320-9.webp',
    '/uploads/properties/images/prime-residency-3-320-10.webp',
    '/uploads/properties/images/prime-residency-3-320-11.webp',
    '/uploads/properties/images/prime-residency-3-320-12.webp',
    '/uploads/properties/images/prime-residency-3-320-13.webp',
    '/uploads/properties/images/prime-residency-3-320-14.webp',
    '/uploads/properties/images/prime-residency-3-320-15.webp',
    '/uploads/properties/images/prime-residency-3-320-16.webp',
    '/uploads/properties/images/prime-residency-3-320-17.webp',
    '/uploads/properties/images/prime-residency-3-320-18.webp',
    '/uploads/properties/images/prime-residency-3-320-19.webp',
    '/uploads/properties/images/prime-residency-3-320-20.webp',
    '/uploads/properties/images/prime-residency-3-320-21.webp',
    '/uploads/properties/images/prime-residency-3-320-22.webp',
    '/uploads/properties/images/prime-residency-3-320-23.webp',
    '/uploads/properties/images/prime-residency-3-320-24.webp',
    '/uploads/properties/images/prime-residency-3-320-25.webp',
    '/uploads/properties/images/prime-residency-3-320-26.webp',
    '/uploads/properties/images/prime-residency-3-320-27.webp',
    '/uploads/properties/images/prime-residency-3-320-28.webp',
    '/uploads/properties/images/prime-residency-3-320-29.webp',
    '/uploads/properties/images/prime-residency-3-320-30.webp',
    '/uploads/properties/images/prime-residency-3-320-31.webp',
    '/uploads/properties/images/prime-residency-3-320-32.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Prime Residency 3' AND "unitNo" = '320';

-- Silver Tower - Unit 11K  (own)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-silver-tower-skyscraper-landscape.png',
    '/uploads/properties/images/silver-tower-11k-1.webp',
    '/uploads/properties/images/silver-tower-11k-2.webp',
    '/uploads/properties/images/silver-tower-11k-3.webp',
    '/uploads/properties/images/silver-tower-11k-4.webp',
    '/uploads/properties/images/silver-tower-11k-5.webp',
    '/uploads/properties/images/silver-tower-11k-6.webp',
    '/uploads/properties/images/silver-tower-11k-7.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Silver Tower' AND "unitNo" = '11K';

-- Silver Tower - Unit 4K  (own)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-silver-tower-skyscraper-landscape.png',
    '/uploads/properties/images/silver-tower-4k-1.webp',
    '/uploads/properties/images/silver-tower-4k-2.webp',
    '/uploads/properties/images/silver-tower-4k-3.webp',
    '/uploads/properties/images/silver-tower-4k-4.webp',
    '/uploads/properties/images/silver-tower-4k-5.webp'
  ], "updatedAt" = now()
WHERE "buildingName" = 'Silver Tower' AND "unitNo" = '4K';

COMMIT;
