# Worklog — podocarpus-nest-backend

Running record of what was done in this repo, so we don't have to dig through git
history. Includes non-git work too (deployments, image generation, SSL, migrations).

**How to add an entry** — see the "Worklog" section in [CLAUDE.md](CLAUDE.md) /
[.github/copilot-instructions.md](.github/copilot-instructions.md).
Newest first, grouped by `## YYYY-MM`. Append only; don't rewrite past entries.

> Entries marked _(approx. — adjust)_ are operational actions reconstructed from
> memory rather than commits; correct the dates when you know them.

---

## 2026-09

### 2026-09-20 — Auth hardening: token types, refresh-session revocation, POST logout
- **Type:** Fix
- **Did:** Closed the auth gaps found during the frontend session-timeout investigation. Refresh tokens now carry `type: 'refresh'` + a random `jti` and are rejected everywhere except /auth/refresh (an access token pasted into the refresh cookie can no longer mint new tokens, and vice versa). Added a `RefreshSession` table (migration `add_refresh_sessions`): a SHA-256 hash of each refresh token is stored on issue, rotated on every refresh, and deleted on logout — so logout now revokes the session server-side and a stolen refresh token dies with it. Fixed the refresh cookie maxAge (was 14 days around a 7-day JWT; both now derive from one constant). Logout is now `POST /auth/logout` (204); the old GET stays as a deprecated alias until the frontend switches, then should be deleted. Verified end-to-end with a live-server smoke test (9 checks: rotation, reuse-rejection, cross-type rejection, revocation on logout).
- **Impact:** Leaked access tokens can't be laundered into long-lived sessions, and logout actually kills the session. Deploy note: run `npx prisma migrate deploy`; existing refresh cookies predate the type claim and DB rows, so every user is logged out once after this ships (access tokens keep working up to 2h).

### 2026-09-16 — Typed Swagger response for collection-tracker
- **Type:** Fix / Docs
- **Did:** `GET /payments/collection-tracker` was the only payments endpoint without a response schema (`description: 'Collection tracker data'` and nothing else), so the frontend had to hand-write its types. Added `CollectionTrackerDto` (+ Tracker row/summary/installment/payment DTOs) and verified the schema key-for-key against the live service output for both occupied and vacant rows. Flagged in the DTO that `frequency` reads ANNUAL even for unconfigured leases — `scheduled` is the real signal.
- **Impact:** Every payments endpoint now generates client types; the tracker's hand-written frontend types can be deleted.

### 2026-09-16 — Deployment runbook for the rent collection release
- **Type:** Docs
- **Did:** Wrote `docs/DEPLOY_RENT_COLLECTION.md` — the ordered production steps for this release: the PostgreSQL 12+ precondition (the migration's `ALTER TYPE … ADD VALUE` cannot run in a transaction on PG 11 or older), backup and row-count-before/after proof, `migrate deploy` then restart in that order, post-deploy verification including the expected 401 on the new guarded route, what to do if the charts read blank, and the backfill as a separate later decision. Linked it from `SERVER_UPDATE_CHECKLIST.md`.
- **Impact:** Because the migration is additive, rollback is a code rollback only — the previous release runs fine against the migrated database, which the runbook states explicitly so nobody reaches for the dump unnecessarily.

### 2026-09-16 — Fix empty dashboard chart; add rent schedule backfill
- **Type:** Fix / Data
- **Did:** `dashboard.monthly[]` was built only from installments, so it read all zeros for the 27 pre-existing leases that have payments but no schedule — the Monthly Collection chart went blank when the frontend switched from `collection-tracker` to `dashboard`. Added a third series, `received` (all payments bucketed by paid date, ad-hoc included), which charts real cash regardless of whether a schedule exists; `scheduled`/`collected` keep their schedule-anchored meaning. Also added `scripts/backfill-rent-schedules.ts` — dry-run by default, `--apply` to write, `--undo` to reverse — which generates schedules for legacy leases and attaches their existing payments by standard arrears allocation. Cadence defaults to ANNUAL; `--infer-frequency` guesses from payment history and flags coin-flip cases.
- **Impact:** Charts show data again with no migration needed. Confirmed no data was lost: the migration contains only CREATE/ADD statements, and all 27 leases, 75 payments and AED 2,695,957.46 are intact.

### 2026-09-15 — Frontend implementation guide for the monthly payments tables
- **Type:** Docs
- **Did:** Wrote `docs/MONTHLY_PAYMENTS_TABLE_FRONTEND.md` — how to build the three views off the single `GET /payments/monthly` call (portfolio rent roll, tenant ledger, cell detail): sticky-column layout, a cell-render decision table keyed on column position × status, the impossible status combinations, an installment→month index so a late payment can name the month it settles, caching and empty states, and a worked example from the backend smoke run.
- **Impact:** The `NONE`-cell-with-money case (rent paid in a later month) is the one that silently loses figures in a naive renderer; it now has an explicit rule, a code path and a sanity check.

### 2026-09-15 — Month-by-month rent collection table
- **Type:** Feature
- **Did:** Added `GET /api/payments/monthly` — the rent-roll grid: one row per tenant, one cell per month, bucketed server-side. Each cell reports what was *owed for* that month (`amountDue`/`amountPaid`/`balance`/`status`) separately from what *arrived during* it (`receivedInMonth`/`adHocInMonth`/`payments[]`), so rent paid late is counted in both places correctly. Columns are flagged `isPast`/`isCurrent`/`isFuture` and carry their own totals for the footer row. Filters: `year` or `from`/`to`, `propertyId`, `leaseId`, `activeLeasesOnly`, `hideEmptyRows`, `includePayments`. Documented in Swagger and in `docs/RENT_COLLECTION_FRONTEND.md` §4b.
- **Impact:** Admins get one call for "past months: full payment history, current and future months: what's paid and what isn't" — previously it would have taken twelve requests and would still have missed off-schedule payments, which have no due date to bucket by.

### 2026-09-15 — Frontend handoff docs for rent collection
- **Type:** Docs
- **Did:** Wrote `docs/RENT_COLLECTION_FRONTEND.md` (model, TS types, every endpoint with real bodies, compatibility notes, gotchas, build order) and a paste-ready `.github/prompts/frontend-rent-collection.prompt.md` for the frontend repo. Added reusable prompts so this doesn't get rewritten each time: `.github/prompts/new-feature.prompt.md` (`/feature`) for building a backend feature, and `.github/prompts/frontend-handoff.prompt.md` (`/frontend-handoff`) for producing the handover pair.
- **Impact:** Frontend can implement rent collection straight from the docs; the two biggest trip hazards (the grown `PaymentType` enum, the intentional 409 on replacing a paid schedule) are called out explicitly.

### 2026-09-15 — Rent collection schedules (tenant payment dates, dashboard, manual collection)
- **Type:** Feature
- **Did:** Added a `RentInstallment` model plus `RentFrequency` / `InstallmentStatus` enums so each tenant lease carries concrete rent collection dates. `POST /tenant-leases` now takes an optional `paymentSchedule` (ANNUAL / SEMI_ANNUAL / QUARTERLY / BI_MONTHLY / MONTHLY, or CUSTOM dates), with `GET|PUT /tenant-leases/:id/schedule` to assign or replace it later. New admin endpoints under `/payments`: `GET /dashboard` (collected, upcoming, overdue, monthly chart), `GET /installments` (filterable, paginated), `POST /installments/:id/collect` (accept a payment — amount defaults to the outstanding balance), `PATCH`/`DELETE /installments/:id` (reprice, move, note, waive, cancel). Payments gained `installmentId`, `method` and `reference`; creating, editing or deleting one re-derives the installment's paid total and status. `collection-tracker` now reports against the schedule and falls back to `annualRent` for older leases. Every endpoint and response is typed in Swagger.
- **Impact:** Admins can plan when rent is due per tenant, see what has been collected versus what is coming or late, and record payments — including off-schedule ones with notes — from a documented API.

---

## 2026-08

### 2026-08-08 — Property image regeneration tooling
- **Type:** Data / Media
- **Did:** Generated and renamed property images to match unit records, and added SQL scripts (`scripts/photo-recreate/`) to repopulate image URLs for Al Jawhara, Fortune Tower, Gold Tower, Marina Pinnacle, Marina Plaza, Mazaya, Prime Residency 3, and Silver Tower.
- **Impact:** Correct property photos now render on the dashboard and public site.

### 2026-08-05 — User removal safety, Google login hardening, dependency upgrades
- **Type:** Feature / Deps
- **Did:** Added role checks and self-deletion prevention to user removal; improved the Google login flow (role handling + error responses); upgraded Fastify / `@fastify/static` / `find-my-way` and added a `js-yaml` override.
- **Impact:** Safer admin user management, more reliable Google auth, stable build.

### 2026-08-03 — Email template browser preview
- **Type:** Feature
- **Did:** Added a browser preview for mailer templates.

## 2026-07

### 2026-07-31 — Notification refactor + consistent API error contracts
- **Type:** Refactor / Feature
- **Did:** Restructured the notification system, corrected Swagger contracts, fixed a boot-time crash, and standardized API error handling and response contracts.
- **Impact:** Consistent API responses and a stable startup.

### 2026-07-30 — Branded transactional email
- **Type:** Feature
- **Did:** Branded email template with reusable sender selection; added a `mail:test` script for real test sends.

### 2026-07-23 — Email confirmation flows + Prisma schema split
- **Type:** Feature / Refactor
- **Did:** Email confirmation flows (extra contact emails, signup disown); split the monolithic Prisma schema into multiple files; added email-setup and secret-rotation docs.

### 2026-07-22 — Google authentication
- **Type:** Feature
- **Did:** Implemented Google authentication with the supporting schema/migration; added a server update checklist.

### 2026-07 — Ops: SSL certificate update _(approx. — adjust)_
- **Type:** Ops
- **Did:** Renewed/updated the SSL certificate for the production domain.

## 2026-06

### 2026-06-01 — Billing (Stripe + PayPal) + landing API
- **Type:** Feature
- **Did:** Implemented the billing module with Stripe and PayPal integration; enhanced landing-page data and API.
- **Impact:** Enabled Pro subscription payments.

### 2026-06 — Ops: server refresh / redeploy _(approx. — adjust)_
- **Type:** Ops
- **Did:** Refreshed and redeployed the backend build to the server.

## 2026-04

### 2026-04-23 — Multi-format property images
- **Type:** Media / Feature
- **Did:** Added multi-format property images and new properties to uploads.

### 2026-04 — Ops: uploaded build to server _(approx. — adjust)_
- **Type:** Ops
- **Did:** Uploaded and deployed the updated backend build, including migrated data.
