# Podocarpus Backend — Setup & Deployment Guide

---

## 1. Environment Variables

Create a `.env` file in the project root. All variables below:

### Required

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/dbname` | PostgreSQL connection string. Used by Prisma ORM and seed script. |
| `JWT_SECRET` | `a-long-random-string-min-32-chars` | Signs access & refresh JWT tokens. **Must be unique per environment.** |
| `COOKIE_SECRET` | `another-random-string-min-32-chars` | Encrypts Fastify session cookies. **Must be unique per environment.** |

### Server

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3030` | HTTP listen port. |
| `NODE_ENV` | — | Set to `production` on server. Controls: secure cookies, cookie domain, query logging. |

### Domain & URLs

| Variable | Default | Description |
|----------|---------|-------------|
| `WEBSITE_DOMAIN` | `pdcps.co` | Cookie domain in production. Set to your domain (e.g. `.pdcps.co` for subdomains). |
| `WEBSITE_URL` | `https://pdcps.co` | Frontend URL. Used in email templates and redirects. |
| `UPLOADS_LOCATION` | `/uploads` | URL prefix for uploaded files. Maps to local `uploads/` directory. |

### Email (SMTP)

| Variable | Default | Description |
|----------|---------|-------------|
| `MAIL_HOST` | — | SMTP server hostname. Dev: `sandbox.smtp.mailtrap.io`. Prod: your SMTP provider. |
| `MAIL_USER` | — | SMTP username / API key. |
| `MAIL_PASS` | — | SMTP password / API secret. |

> **Note**: SMTP port is hardcoded to `2525` in `src/shared/mailer/mailer.service.ts`. Change it there if your provider uses 587/465.

### Seed-Only (Used during `prisma db seed`)

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_EMAIL` | `admin@podocarpus.local` | Superadmin account email. |
| `ADMIN_PASSWORD` | `admin123` | Superadmin account password. **Change immediately after first login.** |

---

## 2. `.env` Template

Copy this into `.env` and fill in your values:

```env
# ── Server ──────────────────────────────────────────
PORT=3030
NODE_ENV=development

# ── Database ────────────────────────────────────────
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/podocarpus"

# ── Secrets (generate unique values!) ───────────────
JWT_SECRET="CHANGE-ME-use-openssl-rand-base64-32"
COOKIE_SECRET="CHANGE-ME-use-openssl-rand-base64-32"

# ── Domain ──────────────────────────────────────────
WEBSITE_DOMAIN="pdcps.co"
WEBSITE_URL="https://pdcps.co"
UPLOADS_LOCATION="/uploads"

# ── Email (SMTP) ───────────────────────────────────
MAIL_HOST="sandbox.smtp.mailtrap.io"
MAIL_USER=""
MAIL_PASS=""

# ── Seed (superadmin account) ──────────────────────
ADMIN_EMAIL="admin@podocarpus.local"
ADMIN_PASSWORD="CHANGE-ME-strong-password"
```

Generate secrets:
```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

---

## 3. First-Time Server Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm or pnpm

### Step-by-step

```bash
# 1. Install dependencies
npm install

# 2. Create .env file (see template above)
#    Make sure DATABASE_URL points to your PostgreSQL instance

# 3. Run database migrations
npx prisma migrate deploy        # production (applies existing migrations)
npx prisma migrate dev            # development (creates new migrations)

# 4. Seed the database (creates superadmin + 29 properties + 3 events)
npx prisma db seed

# 5. Build the project
npm run build

# 6. Start the server
npm run start:prod                # production
npm run dev                       # development (watch mode)
```

### Verify it's running
```
GET http://localhost:3030/api/swagger     → Swagger UI
GET http://localhost:3030/api/properties  → Should return 29 properties
```

---

## 4. Manual Server-Side Tasks

These actions require manual execution — they are NOT automated:

### On Every Deployment

| # | Task | Command | When |
|---|------|---------|------|
| 1 | Apply migrations | `npx prisma migrate deploy` | Every deployment with schema changes |
| 2 | Build | `npm run build` | Every deployment |
| 3 | Restart server | Restart your process manager | After build |

### One-Time Setup

| # | Task | Command / Action | Notes |
|---|------|-----------------|-------|
| 1 | Create database | `CREATE DATABASE podocarpus;` in psql | Before first migration |
| 2 | Run migrations | `npx prisma migrate deploy` | Creates all tables |
| 3 | Run seed | `npx prisma db seed` | Creates superadmin (1), properties (29), events (3) |
| 4 | Change admin password | Login → change password | Default is `admin123` or your `ADMIN_PASSWORD` env |
| 5 | Upload property images | Copy `.avif` files to `uploads/properties/images/` | See image list below |
| 6 | Configure SMTP | Set `MAIL_HOST`, `MAIL_USER`, `MAIL_PASS` | For password reset emails |
| 7 | Set `NODE_ENV=production` | In `.env` or system env | Enables secure cookies + domain binding |

### When Adding Properties Manually

If you add properties through the admin panel, images are handled automatically
via the upload API. The seed data uses placeholder image paths that need
physical files.

### Property Placeholder Images to Create

Drop these into `uploads/properties/images/`:

```
marina-pinnacle-5105.avif       al-jawhara-1205.avif
marina-pinnacle-5904.avif       al-jawhara-907.avif
prime-residency-3-320.avif      al-jawhara-1408.avif
al-jawhara-1107.avif            al-jawhara-1308.avif
al-jawhara-1307.avif            al-jawhara-1108.avif
al-jawhara-2010.avif            al-jawhara-1110.avif
al-jawhara-1608.avif            al-jawhara-1208.avif
al-jawhara-1207.avif            al-jawhara-1007.avif
al-jawhara-1405.avif            al-jawhara-1508.avif
al-jawhara-1310.avif            al-jawhara-1505.avif
al-jawhara-1305.avif            gold-tower-b3-05-01.avif
al-jawhara-1105.avif            mazaya-2905.avif
al-jawhara-1210.avif            silver-tower-11k.avif
                                silver-tower-4k.avif
                                marina-plaza-3503.avif
```

> Fortune Tower (units 2005/2006) already has real images in `uploads/`.

---

## 5. Seed Behavior

The seed is **idempotent** — safe to run multiple times:

| Entity | Seed Count | Behavior if Data Exists |
|--------|-----------|------------------------|
| Superadmin | 1 | Skips if any superadmin exists |
| Properties | 29 | Skips if property count > 0 |
| Events | 3 | Skips if event count > 0 |

**To re-seed from scratch** (destructive):
```bash
# Drop all data and re-apply migrations
npx prisma migrate reset

# This automatically runs seed after reset
```

**To add new seed data** without resetting:
1. Edit `prisma/seed-data.ts`
2. Adjust the seed logic in `prisma/seed.ts` if needed
3. Run `npx prisma db seed`

---

## 6. Available Scripts

| Script | Command | Use |
|--------|---------|-----|
| Development | `npm run dev` | Watch mode with hot reload |
| Build | `npm run build` | Compile TypeScript to `dist/` |
| Production | `npm run start:prod` | Run compiled app |
| Debug | `npm run start:debug` | Debug mode with inspector |
| Lint | `npm run lint` | ESLint with auto-fix |
| Format | `npm run format` | Prettier formatting |
| Test | `npm test` | Run unit tests |
| E2E Test | `npm run test:e2e` | Run end-to-end tests |
| Migrate | `npm run migrate` | Create new Prisma migration |
| Seed | `npm run prisma:seed` | Seed database |

---

## 7. API Access Points

| URL | Description |
|-----|-------------|
| `http://localhost:{PORT}/api/` | API base (all routes prefixed with `/api`) |
| `http://localhost:{PORT}/swagger` | Swagger UI (interactive API docs) |
| `http://localhost:{PORT}/swagger-json` | OpenAPI JSON spec |
| `http://localhost:{PORT}/uploads/` | Static file serving (uploaded images/docs) |

---

## 8. User Roles & Default Access

| Role | Created By | Default State | Notes |
|------|-----------|---------------|-------|
| `superadmin` | Seed script | Enabled | Full access, manage everything |
| `admin` | Registration | **Disabled** | Requires superadmin to enable via `/api/users/:id/enable` |
| `broker` | Registration | **Disabled** | Requires admin/superadmin to enable |
| `investor` | Registration | Enabled | Can create contracts, view properties |

> Admins and brokers register but stay **disabled** until a superadmin manually
> enables them. This is by design for security.

---

## 9. Production Checklist

```
[ ] DATABASE_URL points to production PostgreSQL
[ ] JWT_SECRET is a unique 32+ character random string
[ ] COOKIE_SECRET is a unique 32+ character random string
[ ] NODE_ENV=production is set
[ ] WEBSITE_DOMAIN matches your actual domain
[ ] WEBSITE_URL matches your frontend URL
[ ] MAIL_HOST/USER/PASS configured for real SMTP (not Mailtrap)
[ ] SMTP port updated if not 2525 (in mailer.service.ts)
[ ] CORS origins updated in main.ts if using different domains
[ ] Migrations applied: npx prisma migrate deploy
[ ] Seed run: npx prisma db seed
[ ] Admin password changed after first login
[ ] Property images uploaded to uploads/properties/images/
[ ] uploads/ directory has proper write permissions
[ ] Process manager configured (PM2, systemd, Docker)
[ ] Reverse proxy (Nginx) in front of Fastify for SSL + static files
[ ] Firewall: only expose 80/443, not the raw PORT
```

---

*Podocarpus Backend v0.0.1 — Setup Guide*
