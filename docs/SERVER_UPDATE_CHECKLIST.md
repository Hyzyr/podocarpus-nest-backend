# Server Update Checklist (so I don't forget)

Quick reminders for updating the **backend** on the server.
Full detail is in [SETUP.md](./SETUP.md) — this is just the "don't forget" version.

---

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
npm run build
# restart the server
```
> Use `migrate deploy` on the server — NOT `migrate dev`.
> Never run `migrate reset` on production (it wipes data).

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
