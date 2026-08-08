-- PROD: INITIAL full rebuild (tower hero + curated photos). Keyed on id.
-- ⚠ SUPERSEDED for some properties — re-running this REVERTS them:
--     Prime Residency 320 -> now 5 photos      (see update-prime.sql)
--     All Al Jawhara units -> now one shared set (see update-aljawhara.sql)
-- If you re-run this file, re-apply update-prime.sql and update-aljawhara.sql after.
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
WHERE id = '57ef2ea0-158a-4db9-beec-d1458657152d';

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
WHERE id = '37d99e85-bd6d-4b67-95ed-87814647c764';

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
WHERE id = '95297102-fe26-4440-84b7-99f046ec0a54';

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
WHERE id = 'bc121720-981d-4e93-a51f-3105232e4b6a';

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
WHERE id = '0f6c51ef-074a-4b76-8de1-8fed08c1004a';

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
WHERE id = '3b0cd9a3-7415-47d7-b240-824f0f8f3c16';

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
WHERE id = '9cb4927a-aa29-4a86-aceb-e4badc6e687a';

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
WHERE id = 'c83ce2bf-5ab3-482f-9afe-75e9e608fb67';

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
WHERE id = '578586d1-0869-481f-8d4c-49b014e74347';

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
WHERE id = '7d79a594-6e64-44de-ac21-3c4a61ce8dd9';

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
WHERE id = 'bd4f88c5-849c-4cef-a5df-2027becf57e7';

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
WHERE id = 'b623de63-7bac-4283-9324-c17f498cebe5';

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
WHERE id = 'a7ea5964-4f4e-4d2b-838b-ddddf2482307';

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
WHERE id = '8046e677-fa8d-4f04-8218-8d1389a2d643';

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
WHERE id = '767c5337-1dce-4ef9-a994-bc2d14e63d17';

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
WHERE id = 'f691001f-770a-4798-bbd3-a321806b43ae';

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
WHERE id = 'e49bd894-eb95-4b5c-bd14-37ae6c6386e9';

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
WHERE id = '8f6cc04d-d67f-46f9-988e-edd9a47428f8';

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
WHERE id = '71487eb8-18f4-429b-a432-d768368621b0';

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
WHERE id = 'e38c80e9-baea-4ec0-995d-81308bb33946';

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
WHERE id = '99a443cd-4f7b-4927-aaaf-e9e5a42b5216';

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
WHERE id = '23bc5634-eafa-4468-87bd-da6d0bbfb8ee';

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
WHERE id = 'eb3f0abe-7dc0-445b-869e-322def7f6967';

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
WHERE id = '960defb4-ab64-4f53-834a-20145f45efed';

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
WHERE id = '10def9d7-b008-479e-a799-5d394edc5390';

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
WHERE id = 'e57d7ac7-5d09-42f1-a907-ec8bf8d4e3a0';

-- Silver Tower - Unit 4K  (own)
UPDATE "Property" SET images = ARRAY[
    '/uploads/properties/images/uae-dubai-silver-tower-skyscraper-landscape.png',
    '/uploads/properties/images/silver-tower-4k-1.webp',
    '/uploads/properties/images/silver-tower-4k-2.webp',
    '/uploads/properties/images/silver-tower-4k-3.webp',
    '/uploads/properties/images/silver-tower-4k-4.webp',
    '/uploads/properties/images/silver-tower-4k-5.webp'
  ], "updatedAt" = now()
WHERE id = '3302329d-08f3-4d17-8459-72b373a6b774';

COMMIT;
