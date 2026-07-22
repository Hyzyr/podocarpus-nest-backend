# START HERE — what's left to do

Email is done. Google login is almost done. This file lists ONLY the things
still left, so you don't have to re-read old steps.

---

## ✅ Already done (no action needed)
- Email sending works (from **support@pdcps.co**).
- Google login backend code + both `.env` files (`GOOGLE_CLIENT_ID`).

## ⏳ Left to do — 3 things

### 1. Build the frontend Google button (code)
Open a new session **in the Next.js repo** and say:
*"do the GOOGLE_LOGIN_PLAN."*
The plan file there has everything: `podocarpus-next/docs/GOOGLE_LOGIN_PLAN.md`

### 2. Allow your website in Google Console (you, in browser)
Needed or the Google popup is blocked.
1. **console.cloud.google.com** → **APIs & Services** → **Credentials**
2. Open your **Web** OAuth client (ID starts `159292725516-...`)
3. Box **"Authorized JavaScript origins"** → **+ ADD URI** for each
   (no slash, no path):
   ```
   http://localhost:3000
   http://podocarpus.test
   https://pdcps.co
   ```
   (add the real live domain too when the site is live)
4. **SAVE** → wait ~5 min.
> Do NOT touch "Authorized redirect URIs" — not needed for this login style.

### 3. Rotate the leaked secrets (security)
An App Password + a Google secret were pasted in chat once.
Full steps: [ROTATE_SECRETS.md](./ROTATE_SECRETS.md)

---

## Test when done
Start backend + site → sign-in page → click Google button → should log in.

## Reference docs
- If email ever breaks: [GOOGLE_EMAIL_SETUP.md](./GOOGLE_EMAIL_SETUP.md)
- Deploying/updating the server: [SERVER_UPDATE_CHECKLIST.md](./SERVER_UPDATE_CHECKLIST.md)
- Full server setup: [SETUP.md](./SETUP.md)
