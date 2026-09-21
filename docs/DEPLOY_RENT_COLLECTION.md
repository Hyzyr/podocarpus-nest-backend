# Deploying the Rent Collection release

Date: 2026-09-16
Commits: `4d8d505` (schedules) · `08e2993` (monthly table) + the dashboard chart fix
General reference: [SERVER_UPDATE_CHECKLIST.md](SERVER_UPDATE_CHECKLIST.md) — this
is case **C** (database change), spelled out for this specific release.

---

## What this release does to the database

**One migration:** `20260914192232_add_rent_collection_schedule`. It is
**purely additive** — every statement in it is one of:

| Statement | Target |
|---|---|
| `CREATE TABLE` | `RentInstallment` (new) |
| `CREATE TYPE` | `RentFrequency`, `InstallmentStatus` (new) |
| `ALTER TYPE … ADD VALUE` ×4 | `PaymentType` gains `SEMI_ANNUAL`, `QUARTERLY`, `BI_MONTHLY`, `CUSTOM` |
| `ALTER TABLE … ADD COLUMN` | `TenantLease` +3, `RentPayment` +3 (all nullable or defaulted) |
| `CREATE INDEX` ×5, `ADD CONSTRAINT` ×2 | on the new table / columns |

There is **no** `DROP`, `DELETE`, `TRUNCATE`, `ALTER COLUMN` or `UPDATE`
anywhere in it. No existing row is read, rewritten or removed. Verify for
yourself before you run it:

```bash
grep -iE "drop|delete|truncate|update|alter column" \
  prisma/migrations/20260914192232_add_rent_collection_schedule/migration.sql
# expect: no output
```

**Existing data keeps working.** Leases with no schedule report zero scheduled
and their payments count as ad-hoc; `collection-tracker` falls back to
`annualRent`. No backfill is required to deploy — see §6 for when you do want it.

---

## 1. Check this one thing first

The migration uses `ALTER TYPE … ADD VALUE`, which **cannot run inside a
transaction on PostgreSQL 11 or older** — and Prisma wraps each migration in a
transaction. On PG 12+ it is fine.

```bash
psql "$DATABASE_URL" -c "show server_version;"
```

Local dev is on **18.1**. If the server reports **12 or higher, you're fine** and
nothing special is needed. If it somehow reports 11 or lower, stop and tell me —
the migration has to be split into one `ADD VALUE` per file.

---

## 2. Back up. Not optional.

The migration is additive, but a backup is what makes every later step
reversible without thinking.

```bash
pg_dump "$DATABASE_URL" -Fc -f ~/backup-before-rent-collection-$(date +%F-%H%M).dump
ls -lh ~/backup-before-rent-collection-*.dump    # confirm it is not 0 bytes
```

Note the payment count now, so you can prove nothing moved afterwards:

```bash
psql "$DATABASE_URL" -c \
  'select count(*) as payments, sum(amount) as total from "RentPayment";'
```

Write the two numbers down.

---

## 3. Deploy

```bash
cd /path/to/podocarpus-nest-backend
git pull

npm install                 # package.json is unchanged this release, but harmless
npx prisma migrate deploy   # NOT migrate dev. NEVER migrate reset.
npx prisma generate
npm run build

# restart however the server runs it, e.g.
pm2 restart podocarpus-api
```

**Order matters:** migrate *before* restarting. The new code needs the new
columns; the old code ignores them, so the window between the two is safe.

Expected `migrate deploy` output:

```
1 migration found in prisma/migrations
Applying migration `20260914192232_add_rent_collection_schedule`
The following migration have been applied: …
```

If it says **"No pending migrations"**, the database already has it — that is
fine, not an error.

---

## 4. Verify

```bash
# a) the migration is recorded, not rolled back
psql "$DATABASE_URL" -c \
  'select migration_name, finished_at, rolled_back_at from "_prisma_migrations"
   order by finished_at desc limit 1;'

# b) NOTHING MOVED — must equal what you wrote down in step 2
psql "$DATABASE_URL" -c \
  'select count(*) as payments, sum(amount) as total from "RentPayment";'

# c) the new table exists and is empty (expected: 0 until you backfill)
psql "$DATABASE_URL" -c 'select count(*) from "RentInstallment";'
```

Then the app:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://<domain>/health        # 200
curl -s -o /dev/null -w '%{http_code}\n' https://<domain>/swagger-json  # 200
curl -s -o /dev/null -w '%{http_code}\n' https://<domain>/api/payments/monthly  # 401
```

That last one returning **401** is correct — it proves the new route is mounted
and the admin guard is working.

Finally, log into the admin UI and confirm the Monthly Collection chart has
bars. If it is blank, see §5.

---

## 5. If the charts are blank

Almost certainly a **frontend field**, not the database.

`dashboard.monthly[]` has three series, and only one of them has data before you
backfill:

| Field | Source | Before backfill |
|---|---|---|
| `scheduled` | installments, by due date | **0** |
| `collected` | money against those installments | **0** |
| `received` | all payments, by paid date | **your real cash** |

Plot **`received`** for the cash-flow chart. `scheduled` vs `collected` is the
collection-performance chart and stays legitimately empty until schedules exist.

Sanity check straight from the API:

```bash
curl -s -H "Authorization: Bearer <admin-token>" \
  "https://<domain>/api/payments/dashboard?year=2025&listSize=1" \
  | jq '{collected: .totals.collected, months: [.monthly[] | select(.received > 0) | .month]}'
```

If `totals.collected` is non-zero, the backend has your money and the chart is a
frontend wiring issue.

---

## 6. Backfilling schedules — separate, later, optional

**Do not do this in the same window as the deploy.** Deploy, verify, let it sit.
The backfill is a data decision, not a release step.

It generates a collection schedule for each legacy lease and attaches its
existing payments. It only inserts `RentInstallment` rows and sets
`RentPayment.installmentId` — **no payment amount or date is ever modified.**

```bash
# 1. dry run — writes nothing, prints exactly what it would do
npx tsx scripts/backfill-rent-schedules.ts

# 2. read the output. Check the "scheduled per calendar year" figure against
#    what you expect this year's rent roll to be.

# 3. one lease first, to see the result in the UI before doing all of them
npx tsx scripts/backfill-rent-schedules.ts --lease=<uuid> --apply

# 4. everything
npx tsx scripts/backfill-rent-schedules.ts --apply

# reverse it at any time — detaches payments, deletes the generated installments
npx tsx scripts/backfill-rent-schedules.ts --undo --apply
```

### The cadence decision is yours

The script defaults every lease to **ANNUAL**, because that matches what
`annualRent` already asserts. `--infer-frequency` will guess from payment
history instead — but on the current data **11 of 27 leases came out as coin
flips** (3 payments a year sits exactly between semi-annual and quarterly), and
a wrong cadence means wrong due dates, which means the dashboard chasing tenants
who are not actually late.

Better approach for anything you care about: leave the default, then set the real
cadence per lease through the UI (`PUT /tenant-leases/:id/schedule`), where a
human is choosing knowingly.

---

## 7. Rolling back

**The migration does not need rolling back.** It is additive, so the previous
release runs against the migrated database untouched — old code simply ignores
the new columns and table.

So a rollback is a code rollback only:

```bash
git checkout <previous-commit>
npm run build
pm2 restart podocarpus-api
```

Leave the database alone. If you have already backfilled and want that undone,
use `--undo --apply` from §6 rather than restoring the dump — it is narrower and
does not lose anything recorded since the deploy.

Restore from the step-2 dump only as a genuine last resort, and be aware it
discards everything written since you took it.

---

## 8. Frontend coordination

One change can break an existing screen: **`PaymentType` gained four values**
(`SEMI_ANNUAL`, `QUARTERLY`, `BI_MONTHLY`, `CUSTOM`). A label map, a `switch`
without a `default`, or a zod enum over the old two values will render blank or
throw once such a payment exists.

Nothing produces those values until somebody creates a non-annual schedule, so
there is no rush — but ship the frontend update before you start using the new
cadences. Details in [RENT_COLLECTION_FRONTEND.md](RENT_COLLECTION_FRONTEND.md) §7.

---

## Summary

| Step | Risk | Reversible |
|---|---|---|
| 1 · PG version check | none | — |
| 2 · Backup | none | — |
| 3 · `migrate deploy` + restart | **low** — additive only | code rollback alone; DB needs nothing |
| 4 · Verify | none | — |
| 6 · Backfill | medium — cadence is a judgement call | yes, `--undo --apply` |
