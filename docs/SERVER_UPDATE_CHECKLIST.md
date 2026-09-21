# Server Update Checklist (so I don't forget)

Quick reminders for updating the **backend** on the server.
Full detail is in [SETUP.md](./SETUP.md) — this is just the "don't forget" version.

---

> **Next deploy carries TWO migrations.** Run section C once —
> `npx prisma migrate deploy` applies both in order.
>
> 1. `add_refresh_sessions` (auth hardening, 2026-09-20) — every existing
>    session is invalidated: users are silently logged out and must sign in
>    again. Frontend should move logout to `POST /auth/logout` (the GET route
>    still works but is deprecated).
> 2. `lease_annual_rent_only` (2026-09-21) — drops `monthlyRent`,
>    `paymentFrequency` and `paymentAnchorDay` from `TenantLease` after
>    backfilling `annualRent = monthlyRent × 12`, so no lease loses its rent
>    figure. **Breaking for the frontend** — see
>    [LEASE_ANNUAL_RENT_FRONTEND.md](./LEASE_ANNUAL_RENT_FRONTEND.md); deploy
>    the matching frontend build with it.
>
> After the restart, run section D — the rent collection views stay empty
> until the leases have collection schedules.

## Golden rule
The server does NOT read your local `.env`. If you change env variables locally,
you MUST also change them **on the server** and **restart**. Nothing is automatic.

---

## A. I changed CODE only (no new env, no DB change)
```bash
git pull
npm install          # only if package.json changed
npm run build
# restart the server (PM2 / systemd / whatever runs it)
```

## B. I added or changed an ENV VARIABLE
1. Edit the `.env` **on the server** (not just local).
2. Add the SAME key on the server that you added locally.
3. Rebuild + restart:
```bash
npm run build
# restart the server
```
> Env changes only take effect AFTER a restart.

## C. I changed the DATABASE (schema.prisma / new migration)
```bash
git pull
npm install
npx prisma migrate deploy    # applies migrations, no shadow DB
npx prisma generate    # or migrate deploy if schema also changed
npm run build
# restart the server
```
> Use `migrate deploy` on the server — NOT `migrate dev`.
> Never run `migrate reset` on production (it wipes data).
> Always `pg_dump` first, and note the row counts of anything that matters so
> you can prove nothing moved afterwards.

> **Rent collection release** (schedules, dashboard, monthly table) has its own
> step-by-step runbook: [DEPLOY_RENT_COLLECTION.md](./DEPLOY_RENT_COLLECTION.md).

## D. Rent collection views look empty on the server

If the collection tracker / monthly table show no upcoming or overdue rent, the
leases have no **collection schedule** (installment rows). Generate them from
the leases' own data — safe to run on production, and safe to re-run:

```bash
npx tsx prisma/backfill-schedules.ts --dry   # preview: which leases, which cadence
npx tsx prisma/backfill-schedules.ts         # apply (active leases only)
npx tsx prisma/backfill-schedules.ts --all   # also schedule ended/inactive leases
```

It only ADDS installments to leases that have none, and links existing payments
to the dates they settle. It never deletes, edits or invents a payment. The
cadence is inferred from each tenant's own payment history; an admin can
overwrite any schedule afterwards with `PUT /api/tenant-leases/{id}/schedule`.

> `prisma/demo-payments.ts` is the opposite — it INVENTS payments for a
> good-looking demo and refuses to run with `NODE_ENV=production`. Never run it
> on the live server.

---

## Env variables that live on the server
Keep these set in the server `.env`. Secrets must NOT be committed to git.

| Key | Notes |
|-----|-------|
| `DATABASE_URL` | Production Postgres, not localhost |
| `JWT_SECRET` | Unique long random string |
| `COOKIE_SECRET` | Unique long random string |
| `NODE_ENV` | `production` |
| `WEBSITE_DOMAIN` | e.g. `.pdcps.co` |
| `WEBSITE_URL` | e.g. `https://pdcps.co` |
| `MAIL_HOST` | `smtp.gmail.com` |
| `MAIL_PORT` | `465` |
| `MAIL_SECURE` | `true` |
| `MAIL_USER` | `support@pdcps.co` |
| `MAIL_PASS` | Google App Password (rotate if ever leaked) |
| `MAIL_FROM` | `support@pdcps.co` |
| `MAIL_FROM_NAME` | `Podocarpus` |
| `GOOGLE_CLIENT_ID` | Same ID as the frontend uses |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Only used the first time you seed |

> The frontend needs its own env too: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
> (same value) and the `NEXT_PUBLIC_API_BASE_URL`. Update those in the
> Next.js repo separately.

---

## After ANY deploy — quick check
- Open `https://<your-domain>/swagger` → loads = server is up.
- Test login still works.
- If you changed email settings, trigger a forgot-password and confirm the email arrives.

---

## Google login — one-time server things (don't forget)
1. `GOOGLE_CLIENT_ID` is set in the server `.env`.
2. In **console.cloud.google.com** → the OAuth client → **Authorized JavaScript origins**,
   add every real site address (e.g. `https://pdcps.co`). No trailing slash.
   Without this, the Google button fails in production.

---

## Security reminders
- Never commit `.env` (it is git-ignored — keep it that way).
- If a password/secret ever gets pasted somewhere public, **regenerate it**
  and update the server `.env`, then restart.
- Change the default admin password after the first login.
