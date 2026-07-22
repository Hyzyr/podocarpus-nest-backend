# Rotate Secrets — step by step

Two secrets were pasted in a chat earlier, so replace them.
Do them in order. Simple steps, no rush.

Two secrets to rotate:
1. **Email App Password** (used to send email) — MUST rotate, it's live.
2. **Google OAuth client secret** — rotate to be safe (NOT used by login, so nothing breaks).

---

## PART 1 — Email App Password

This is the password in the backend `.env` at `MAIL_PASS`.
The mailbox is **support@pdcps.co**.

### Step 1 — Open the mailbox's security page
1. Open a browser, sign in as **support@pdcps.co**.
2. Go to **myaccount.google.com**  → left menu **Security**.
   (This is the MAILBOX's own account — NOT admin.google.com.)

### Step 2 — Make a NEW App Password
1. In **Security**, find **App passwords**.
   (If you don't see it: 2-Step Verification must be ON for this mailbox. It already is.)
2. Create a new app password. Name it something like `podocarpus-backend-2`.
3. Google shows a 16-letter password like `abcd efgh ijkl mnop`. **Copy it.**

### Step 3 — Put the new one in the server `.env`
1. Open the `.env` **on the server** (and your local one too).
2. Replace the value of `MAIL_PASS` with the new password:
   ```
   MAIL_PASS="abcd efgh ijkl mnop"
   ```
   (spaces are fine)
3. Save.

### Step 4 — Restart + test
1. Restart the backend (so it reads the new password).
2. Trigger a forgot-password email → confirm it arrives.

### Step 5 — Delete the OLD App Password
1. Back on **myaccount.google.com → Security → App passwords**.
2. Find the OLD one (the one you were using before).
3. Click the trash/delete icon to revoke it.

✅ Email secret rotated.

---

## PART 2 — Google OAuth client secret

This is the `GOCSPX-...` secret. Your login button does **NOT** use it,
so rotating it will **not** break login. We just retire the exposed one.

### Step 1 — Open the OAuth client
1. Go to **console.cloud.google.com**.
2. Pick the project that has app **pdcps-website**.
3. Left menu: **APIs & Services** → **Credentials**.
4. Under **OAuth 2.0 Client IDs**, click your **Web** client
   (ID starts `159292725516-...`).

### Step 2 — Add a new secret
1. On the client page, find **Client secrets**.
2. Click **Add secret** (this creates a fresh one).
   - The **Client ID stays the same** — only the secret changes.
   - So `GOOGLE_CLIENT_ID` in both repos does NOT need changing. Good.

### Step 3 — Remove the old secret
1. Still on the same page, find the OLD secret (`GOCSPX-...` you pasted before).
2. Click **Disable**, then **Delete** it.

### Step 4 — (only if you store the secret somewhere)
- The backend login flow does **not** use the client secret, so there's usually
  nothing to update.
- If you ever added `GOOGLE_CLIENT_SECRET` to a `.env` or a server, replace it
  with the new one there and restart. (Right now it's not used anywhere.)

✅ OAuth secret rotated.

---

## Done — final check
- [ ] New App Password in server `.env`, backend restarted, test email received.
- [ ] Old App Password deleted.
- [ ] New Google client secret created, old one deleted.
- [ ] `GOOGLE_CLIENT_ID` unchanged in both repos (correct — only the secret changed).

> Reminder: never paste passwords/secrets into chats or commits again.
> Keep them only in `.env` (which is git-ignored).
