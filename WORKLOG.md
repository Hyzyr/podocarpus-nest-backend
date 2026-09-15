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
