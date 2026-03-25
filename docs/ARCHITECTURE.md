# Podocarpus Backend — Architecture Analysis

> **NestJS 11 + Fastify 5 + Prisma 7 + PostgreSQL**
> Reviewed: March 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Module Dependency Graph](#3-module-dependency-graph)
4. [Directory Structure](#4-directory-structure)
5. [Data Model (Prisma)](#5-data-model-prisma)
6. [Module Breakdown](#6-module-breakdown)
7. [Auth & Security](#7-auth--security)
8. [API Route Map](#8-api-route-map)
9. [What's Good](#9-whats-good)
10. [Issues & Recommendations](#10-issues--recommendations)
11. [Immediate TODOs](#11-immediate-todos)
12. [Seed Status](#12-seed-status)

---

## 1. Project Overview

Real estate investment platform serving investors, brokers, and admins in
Dubai. Core flows: browse properties → submit investment contract → admin
approves → track ROI. Side features: events, appointments, global
notifications, KYC autofill for contracts.

```
Investor ──► Browse Properties ──► Draft Contract ──► Publish ──► Admin Review
                                       │                              │
                                  KYC Autofill                  Approve/Reject
                                       │                              │
                                  Save Form Data              Contract Active
```

---

## 2. Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Runtime | Node.js + TypeScript (ES2023) | Strict null checks ✓ |
| Framework | NestJS 11 | Module/Controller/Service pattern |
| HTTP | Fastify 5 | ~2× Express throughput |
| ORM | Prisma 7 + `@prisma/adapter-pg` | Native PostgreSQL pool |
| Database | PostgreSQL | 26 migrations applied |
| Auth | JWT via HttpOnly cookies | Access 2h + Refresh 7d |
| Validation | class-validator (DTOs) + Zod (contracts) | Global ValidationPipe |
| Docs | Swagger / OpenAPI | Served at `/swagger` |
| Email | Nodemailer (SMTP) | Password resets |
| File Storage | Local disk (`/uploads/`) | 6 MB limit, fastify-multipart |

---

## 3. Module Dependency Graph

```
AppModule
├── ConfigModule (global)
├── DatabaseModule ──────────── PrismaService (singleton)
├── MailerModule ────────────── MailerService
├── StorageModule ───────────── StorageService (file uploads)
├── DataModule ──────────────── DataService (countries JSON)
├── NotificationsModule ─────── NotificationsService + GlobalNotificationsService
│
├── AuthModule
│   ├── JwtModule (access 2h / refresh 7d)
│   ├── PassportModule (JWT strategy via cookies)
│   └── UsersModule (dependency)
│
├── UsersModule
│   ├── UsersService, KycService
│   └── DatabaseModule
│
├── PropertiesModule
│   ├── PropertiesService, StatisticsService, TenantLeasesService
│   ├── StorageModule, NotificationsModule
│   └── DatabaseModule
│
├── ContractsModule ⭐ (most complex)
│   ├── ContractsService, InvestmentStatisticsService
│   ├── NotificationsModule
│   └── DatabaseModule
│
├── InvestmentsModule
│   └── DatabaseModule
│
├── EventsModule + EventStatusModule
│   ├── EventsService, UserEventStatusService
│   ├── StorageModule, NotificationsModule
│   └── DatabaseModule
│
└── AppointmentModule
    ├── AppointmentService
    ├── NotificationsModule
    └── DatabaseModule
```

---

## 4. Directory Structure

```
src/
├── main.ts                      # Bootstrap: Fastify, CORS, Helmet, Swagger
├── app.module.ts                # Root module, imports all feature modules
│
├── auth/                        # Registration, Login, JWT, Password Reset
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.constants.ts
│   ├── auth-notifications.service.ts
│   └── dto/
│
├── users/                       # User CRUD, KYC Autofill
│   ├── users.module.ts
│   ├── controllers/             # UsersAdminController, KycController
│   ├── services/                # UsersService, KycService
│   └── dto/
│
├── properties/                  # Property CRUD, Statistics, Leases
│   ├── properties.module.ts
│   ├── controllers/             # Properties, Statistics, TenantLeases
│   ├── services/                # Properties, Stats, Notifications, Leases
│   └── dto/
│
├── contracts/                   # Investment Contracts (draft→publish→approve)
│   ├── contracts.module.ts
│   ├── controllers/             # Contracts, InvestmentStatistics
│   ├── services/                # Contracts, Stats, Notifications
│   └── dto/                     # Zod-based form schema + class-validator DTOs
│
├── investments/                 # Investor <> Property binding
│   ├── investments.module.ts
│   ├── investments.controller.ts
│   └── investments.service.ts
│
├── events/                      # Company Events (CRUD + User status tracking)
│   ├── events.module.ts
│   ├── event.status.module.ts
│   ├── controllers/
│   ├── services/
│   └── dto/
│
├── appointments/                # Property Viewing Appointments
│   ├── appointments.module.ts
│   ├── dto/
│   └── services/
│
├── common/                      # Cross-cutting: guards, decorators, constants
│   ├── constants/
│   ├── decorators/              # @CurrentUser, @Roles
│   ├── dto/                     # FileAttachmentDto, ContractFormData (Zod)
│   ├── guards/                  # JwtAuthGuard, RolesGuard
│   ├── strategies/              # JwtStrategy (cookie + bearer)
│   ├── types/
│   └── utils/                   # safeFilename, zodKeysToSelect
│
└── shared/                      # Infrastructure modules
    ├── database/                # PrismaService (pg Pool adapter)
    ├── mailer/                  # Nodemailer SMTP wrapper
    ├── storage/                 # Local file upload + serve
    ├── data/                    # Static reference data (countries)
    ├── notifications/           # Per-user notifications
    └── global-notifications/    # Role-targeted system announcements
```

**Assessment**: Clean separation. Each feature module owns its controllers,
services, and DTOs. Shared infrastructure is properly isolated. No circular
dependencies detected.

---

## 5. Data Model (Prisma)

### Entity Relationship Summary

```
AppUser (1) ──── (1) InvestorProfile
    │   └──── (1) BrokerProfile
    │   └──── (1) AdminProfile
    │   └──── (1) UserKycProfile
    │   └──── (*) Contract
    │   └──── (*) Notification
    │   └──── (*) ActivityLog
    │
    ├── Property (*) ◄── (1) AppUser (owner)
    │   ├── TenantLease (*)
    │   ├── InvestmentStatistics (*)
    │   ├── AvailabilitySlot (*)
    │   └── UserPropertyStatus (*)
    │
    ├── Contract (*) ──── Property (1)
    │   ├── ContractVersion (*)      # immutable snapshots
    │   ├── ContractChangeSet (*)    # JSON Merge Patch (RFC 7386)
    │   ├── ContractSignature (*)    # evidence-backed
    │   └── ContractEvent (*)        # audit trail
    │
    ├── Event (*)
    │   └── UserEventStatus (*)
    │
    ├── Appointment (*)
    │
    ├── GlobalNotification (*)
    │   └── GlobalNotificationView (*)
    │
    └── Notification (*)
```

### Key Model Details

| Model | Rows (seed) | Key Fields |
|-------|-------------|------------|
| `AppUser` | 1 (superadmin) | role (investor/broker/admin/superadmin), isEnabled |
| `Property` | 29 | contractValue, netRoiMin/Max, isVacant, isTaxFreeZone, serviceCharge |
| `Contract` | — | formData (JSON), status (8 states), version, multi-party signatures |
| `Event` | 3 | status (DRAFT→UPCOMING→OPEN→ENDED/CANCELLED) |
| `TenantLease` | — | monthlyRent, startDate/endDate, occupancyRate |
| `InvestmentStatistics` | — | monthlyROI, totalProfit, expenses, occupancyRate |

---

## 6. Module Breakdown

### Auth
- **Register**: Creates user → auto-enable (investors) or disabled (admins)
- **Login**: Validates credentials → set HttpOnly JWT cookies (access + refresh)
- **Logout**: Clear cookies
- **Refresh**: Rotate access token from refresh token
- **Password Reset**: Email SMTP → tokenized reset link → `/auth/reset-password`
- **Onboarding**: Step-by-step profile completion flow

### Contracts ⭐ (Core Business Logic)
```
Create Draft ──► Update Draft ──► Publish ──► Admin Review ──► Active
  (investor)      (investor)     (validates)   (admin/super)
                                     │
                              KYC data saved      Reject ──► Back to Draft?
                              for future reuse    Suspend / Terminate / Complete
```

**Permission matrix** (see `docs/CONTRACT_PERMISSIONS.md`):

| Action | Investor | Admin | Superadmin |
|--------|----------|-------|------------|
| Create/Edit Draft | ✅ `formData` only | ❌ | ❌ |
| Publish (draft→pending) | ✅ | ❌ | ❌ |
| Admin fields (status, broker, dates, payment) | ❌ | ✅ | ✅ |
| Delete | draft/pending only | any | any |

**Form data** uses Zod schema for deep validation: buyer details, Emirates ID,
passport, documents (each with specific URL fields for scanned copies).

### Properties
- Full CRUD with admin-only create/update/delete
- **Search**: Filters by city, area, size range, ROI range, status, tax zone
- **Statistics**: Overview (counts, totals), trends (weekly/monthly/quarterly/yearly)
- **Tenant Leases**: Create lease → auto-toggle `isVacant` on property
- **Documents**: JSON array (`PropertyDocumentDto[]`) stored on property

### Notifications (Dual System)
1. **User Notifications**: Direct (userId + type) — one-to-one
2. **Global Notifications**: Role-targeted — one-to-many with individual view/dismiss tracking, expiration, analytics (view rates, role breakdown, hourly trends)

---

## 7. Auth & Security

| Aspect | Implementation | Status |
|--------|---------------|--------|
| Password hashing | bcrypt (10 rounds) | ✅ Solid |
| JWT storage | HttpOnly + Secure + SameSite=Lax cookies | ✅ XSS-resistant |
| Token lifetime | Access 2h / Refresh 7d | ✅ Reasonable |
| Role enforcement | `@Roles()` decorator + `RolesGuard` | ✅ Declarative |
| Input validation | Global ValidationPipe (whitelist + transform) | ✅ |
| CORS | Explicit origins (localhost:3000, pdcps.co) | ✅ |
| Helmet | CSP + security headers via @fastify/helmet | ✅ |
| File upload | 6 MB limit, filename sanitization (safeFilename) | ✅ |
| CSRF | ⚠️ No CSRF tokens (SameSite=Lax partially mitigates) | Review |
| Rate limiting | ❌ Not implemented | Add |
| Secrets | Env-based with fallback defaults | ⚠️ Defaults are unsafe for prod |

---

## 8. API Route Map

### Public (No Auth)
```
POST   /auth/register
POST   /auth/login
POST   /auth/forgot-password
POST   /auth/reset-password
GET    /properties              # list enabled properties
GET    /properties/search       # filtered search
GET    /data/countries          # reference data
```

### Authenticated (Any Role)
```
GET    /auth/me
GET    /auth/refresh
POST   /auth/logout
POST   /auth/onboarding
GET    /properties/:id
GET    /notifications
PATCH  /notifications/:id/read
GET    /global-notifications
POST   /global-notifications/:id/view
POST   /global-notifications/:id/dismiss
POST   /appointments
GET    /appointments
PATCH  /appointments/:id
GET    /events
```

### Investor-Only
```
POST   /contracts/draft
PATCH  /contracts/draft/:id
POST   /contracts/publish/:id
GET    /contracts               # own contracts
GET    /investments             # own properties
DELETE /contracts/:id           # draft/pending only
```

### Admin / Superadmin
```
GET    /users/all
GET    /users/:id/full-info
PATCH  /users/:id/enable
POST   /properties
PATCH  /properties/:id
DELETE /properties/:id
GET    /properties/statistics/overview
GET    /properties/statistics/trends
POST   /tenant-leases
PUT    /tenant-leases/:id
DELETE /tenant-leases/:id
PATCH  /contracts/:id          # admin fields only
GET    /contracts/all
POST   /events
PATCH  /events/:id
DELETE /events/:id
POST   /global-notifications   # create announcements
```

---

## 9. What's Good

1. **Clean module boundaries** — Each feature is self-contained with its own
   controllers, services, and DTOs. No God services.

2. **Fastify over Express** — Higher throughput, better schema support. Good
   call for a production-facing API.

3. **Contract workflow is well-designed** — Draft→publish→review pattern with
   strict permission separation between investors (form data) and admins
   (administrative fields). Versioning + changesets + signatures = proper
   audit trail.

4. **Dual notification system** — Per-user direct notifications + role-targeted
   global announcements with analytics. Covers both operational and
   system-level communication.

5. **Cookie-based JWT** — HttpOnly + Secure + SameSite avoids XSS token theft
   that plagues localStorage-based auth.

6. **Idempotent seeding** — Checks existing data before inserting. Safe to run
   multiple times.

7. **Prisma 7 with native pg adapter** — Direct PostgreSQL pool instead of the
   slower Prisma engine. Lower latency.

8. **KYC autofill** — Smart UX: investor fills KYC once, contract forms auto-
   populate on subsequent submissions.

9. **Zod + class-validator coexistence** — Zod for deep nested contract forms,
   class-validator for standard DTOs. Each used where it excels.

10. **Property statistics module** — Built-in analytics (trends by period,
    occupancy tracking) ready for dashboard.

---

## 10. Issues & Recommendations

### Critical (Fix Before Production)

| # | Issue | Location | Recommendation |
|---|-------|----------|----------------|
| C1 | **Hardcoded JWT/Cookie secrets with fallback defaults** | `src/common/constants/` | Remove fallback defaults. Fail fast if `JWT_SECRET` or `COOKIE_SECRET` are not set in env. Add startup validation (Zod or Joi config schema). |
| C2 | **No rate limiting** | Global | Add `@nestjs/throttler` — at minimum on `/auth/login`, `/auth/register`, `/auth/forgot-password`. DoS and brute-force are wide open. |
| C3 | **Seed transaction uses global override hack** | `prisma/seed.ts` lines 150-165 | The `(global as any).prisma = tx` trick doesn't actually make `seedSuperAdmin()` / `seedProperties()` use the transaction client — they reference the module-level `prisma` const, not `global.prisma`. The transaction wrapper is effectively a no-op. Either pass `tx` as a parameter to each seed function or remove the transaction claim. |
| C4 | **No CSRF protection** | `main.ts` | SameSite=Lax only prevents cross-site POST from different origins on some browsers. Add `@fastify/csrf-protection` or use double-submit cookie pattern. |

### High Priority

| # | Issue | Location | Recommendation |
|---|-------|----------|----------------|
| H1 | **No test files** | `src/` | Zero `.spec.ts` files. Add at minimum: auth flow, contract lifecycle, property CRUD, role guard. Start with e2e tests using Prisma test DB. |
| H2 | **Local file storage only** | `src/shared/storage/` | Single-server limitation. For any multi-instance deployment, move to S3/R2/GCS with signed URLs. Abstract behind `StorageService` interface now. |
| H3 | **No pagination on list endpoints** | Properties, Events, Users, Contracts controllers | All list endpoints return unbounded results. Add cursor or offset pagination DTOs. |
| H4 | **Missing property owner validation** | `PropertiesService` | When creating tenant leases or updating properties, verify the requesting admin has permission for that specific property (not just any admin). |
| H5 | **Contract `formData` is untyped JSON in DB** | `schema.prisma` | Prisma stores it as `Json`. The Zod schema validates on write, but nothing prevents manual DB edits from breaking the schema. Consider a validation trigger or migration to typed columns for critical fields. |

### Medium Priority

| # | Issue | Location | Recommendation |
|---|-------|----------|----------------|
| M1 | **No request logging / APM** | Global | Add a Fastify request logging hook or NestJS interceptor for request IDs, duration, status codes. Essential for debugging production issues. |
| M2 | **Email service has no queue** | `MailerModule` | Synchronous email sending blocks the request. Use BullMQ or a lightweight queue for async delivery + retries. |
| M3 | **No soft deletes** | All models | Hard deletes lose audit trail. Add `deletedAt` to `AppUser`, `Property`, `Contract` at minimum. |
| M4 | **Missing database indexes** | `schema.prisma` | No explicit indexes on frequently queried fields like `Property.area`, `Property.status`, `Contract.status`, `AppUser.role`. Add `@@index` directives. |
| M5 | **Static file serving in API process** | `main.ts` | Serving uploaded files via Fastify static wastes API server resources. Move to Nginx/CDN in production. |
| M6 | **Property `images` is String array** | `schema.prisma` | No structured metadata (dimensions, alt text, order). Consider a `PropertyImage` model or at minimum a JSON schema. |

### Low Priority / Nice-to-Have

| # | Issue | Recommendation |
|---|-------|----------------|
| L1 | No WebSocket/SSE for real-time notifications | Add gateway for push notifications |
| L2 | No API versioning (`/v1/`) | Add versioning before public release |
| L3 | No health check endpoint | Add `/health` with DB ping |
| L4 | No OpenAPI response schemas | Add `@ApiResponse` decorators |
| L5 | Events have hardcoded 2025 dates in seed | Update to dynamic relative dates |

---

## 11. Immediate TODOs

Priority order for next sprint:

```
1. [ ] Fix seed.ts transaction bug (C3) — pass `tx` to seed functions
2. [ ] Add @nestjs/throttler rate limiting (C2)
3. [ ] Remove secret fallback defaults, add env validation (C1)
4. [ ] Add pagination to all list endpoints (H3)
5. [ ] Add database indexes for hot queries (M4)
6. [ ] Add request logging interceptor (M1)
7. [ ] Write first e2e test suite (H2)
8. [ ] Add /health endpoint (L3)
```

---

## 12. Seed Status

| Item | Count | Status |
|------|-------|--------|
| Superadmin | 1 | ✅ Ready (env-configurable email/password) |
| Properties | 29 | ✅ Ready (all from Assets CSV, placeholder images set) |
| Events | 3 | ✅ Ready (Dubai events) |

**Placeholder images** — 28 properties have placeholder paths like
`/uploads/properties/images/{building}-{unit}.avif`. Property #26 (Fortune
Tower 2005/2006) already has real images. Drop actual `.avif` files into
`uploads/properties/images/` matching these names:

```
marina-pinnacle-5105.avif    al-jawhara-1405.avif    al-jawhara-1305.avif
marina-pinnacle-5904.avif    al-jawhara-1205.avif    al-jawhara-1105.avif
prime-residency-3-320.avif   al-jawhara-907.avif     al-jawhara-1210.avif
al-jawhara-1107.avif         al-jawhara-1408.avif    al-jawhara-1505.avif
al-jawhara-1307.avif         al-jawhara-1308.avif    gold-tower-b3-05-01.avif
al-jawhara-2010.avif         al-jawhara-1108.avif    mazaya-2905.avif
al-jawhara-1608.avif         al-jawhara-1110.avif    silver-tower-11k.avif
al-jawhara-1207.avif         al-jawhara-1208.avif    silver-tower-4k.avif
al-jawhara-1007.avif         al-jawhara-1508.avif    marina-plaza-3503.avif
al-jawhara-1310.avif
```

**Run seed**: `npx prisma db seed` (requires `DATABASE_URL` in `.env`)

---

*Generated from codebase analysis — Podocarpus NestJS Backend v0.0.1*
