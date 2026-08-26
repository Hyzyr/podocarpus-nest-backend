# Worklog — podocarpus-nest-backend

Running record of what was done in this repo, so we don't have to dig through git
history. Includes non-git work too (deployments, image generation, SSL, migrations).

**How to add an entry** — see the "Worklog" section in [CLAUDE.md](CLAUDE.md) /
[.github/copilot-instructions.md](.github/copilot-instructions.md).
Newest first, grouped by `## YYYY-MM`. Append only; don't rewrite past entries.

> Entries marked _(approx. — adjust)_ are operational actions reconstructed from
> memory rather than commits; correct the dates when you know them.

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
