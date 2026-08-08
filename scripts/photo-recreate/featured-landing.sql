-- PROD: feature one property per tower on the landing page (ignore Prime Residency).
-- Keyed on real id. featuredRank orders the landing (asc, nulls last).
-- NOTE: featuredRank does NOT filter — the landing must request ?limit=7 to show
-- exactly these 7 and nothing else. (Default limit is 4, max 8.)
BEGIN;

-- clear every existing rank first
UPDATE "Property" SET "featuredRank" = NULL;

UPDATE "Property" SET "featuredRank" = 1 WHERE id = '99a443cd-4f7b-4927-aaaf-e9e5a42b5216'; -- Marina Pinnacle - 5105
UPDATE "Property" SET "featuredRank" = 2 WHERE id = 'eb3f0abe-7dc0-445b-869e-322def7f6967'; -- Marina Plaza - 3503
UPDATE "Property" SET "featuredRank" = 3 WHERE id = 'e49bd894-eb95-4b5c-bd14-37ae6c6386e9'; -- Al Jawhara - 2010
UPDATE "Property" SET "featuredRank" = 4 WHERE id = 'e38c80e9-baea-4ec0-995d-81308bb33946'; -- Gold Tower - B3-05-01
UPDATE "Property" SET "featuredRank" = 5 WHERE id = 'e57d7ac7-5d09-42f1-a907-ec8bf8d4e3a0'; -- Silver Tower - 11K
UPDATE "Property" SET "featuredRank" = 6 WHERE id = '71487eb8-18f4-429b-a432-d768368621b0'; -- Fortune Tower - 2005/2006
UPDATE "Property" SET "featuredRank" = 7 WHERE id = '960defb4-ab64-4f53-834a-20145f45efed'; -- Mazaya - 2905

COMMIT;
