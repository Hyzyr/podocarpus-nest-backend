# Google Email SMTP Setup

This guide switches the backend from sandbox SMTP credentials to a real Google-managed mailbox.

## Recommended Option

Use a dedicated Google mailbox for the app, for example `noreply@yourdomain.com`.

Best practice:

- Use Google Workspace if you send from your company domain.
- Turn on 2-Step Verification on that mailbox.
- Create an App Password only for the backend.
- Do not use the mailbox's normal login password inside `.env`.

## What Changed In The Backend

The mailer now reads all SMTP settings from environment variables instead of assuming port `2525`.

Current supported variables:

```env
MAIL_HOST="smtp.gmail.com"
MAIL_PORT="465"
MAIL_SECURE="true"
MAIL_USER="noreply@yourdomain.com"
MAIL_PASS="your-google-app-password"
MAIL_FROM="noreply@yourdomain.com"
MAIL_FROM_NAME="Podocarpus Real Estate LLC"
```

## Step 1. Prepare The Google Account

If you are using Google Workspace:

1. Create or choose the mailbox you want the app to send from.
2. Confirm the domain is already verified in Google Workspace.
3. Enable 2-Step Verification for that mailbox.

If you are using a standard Gmail account:

1. Sign in to the mailbox.
2. Enable 2-Step Verification.

## Step 2. Generate An App Password

1. Open the Google Account security page.
2. Go to `Security`.
3. Under `How you sign in to Google`, open `App passwords`.
4. Create a new app password for the backend mailer.
5. Copy the generated password and store it safely.

Notes:

- Google shows the password with spaces. Nodemailer accepts it with or without spaces.
- If `App passwords` is missing, 2-Step Verification is not fully enabled yet.

## Step 3. Update `.env`

Set these values in your production `.env`:

```env
MAIL_HOST="smtp.gmail.com"
MAIL_PORT="465"
MAIL_SECURE="true"
MAIL_USER="noreply@yourdomain.com"
MAIL_PASS="paste-your-app-password-here"
MAIL_FROM="noreply@yourdomain.com"
MAIL_FROM_NAME="Podocarpus Real Estate LLC"
```

Why these values:

- `smtp.gmail.com` is Google's SMTP server.
- Port `465` uses implicit TLS.
- `MAIL_SECURE=true` tells Nodemailer to connect securely from the start.
- `MAIL_FROM` controls the visible sender address.

## Step 4. Restart The Backend

After updating `.env`, restart the Nest application so the new SMTP settings are loaded.

## Step 5. Test Email Delivery

The easiest live test in this project is the forgot-password flow, because it already sends mail.

Suggested test flow:

1. Use a real user account in the database.
2. Trigger the forgot-password endpoint from your frontend or API client.
3. Confirm the email arrives in Inbox or Spam.
4. Open the reset link and verify the token works.

If delivery fails, check:

- `MAIL_USER` is the same mailbox that created the app password.
- `MAIL_PASS` is the Google app password, not the mailbox login password.
- The server can reach `smtp.gmail.com:465`.
- Your sending domain has proper SPF, DKIM, and DMARC records if using Google Workspace.

## Security Checklist

- Use a dedicated sender mailbox such as `noreply@yourdomain.com`.
- Store SMTP secrets only in environment variables or a secret manager.
- Never commit app passwords to git.
- Rotate the app password if it is exposed.
- Keep `MAIL_FROM` aligned with the authenticated mailbox to reduce spoofing issues.
- Configure SPF, DKIM, and DMARC for better deliverability.

## Optional: Google Workspace SMTP Relay

If you later want server-based relay instead of mailbox app-password auth, use Google Workspace SMTP relay.

That path is better when:

- multiple apps need to send mail,
- you want IP-based relay rules,
- or you do not want per-mailbox app passwords.

Typical relay settings are:

```env
MAIL_HOST="smtp-relay.gmail.com"
MAIL_PORT="587"
MAIL_SECURE="false"
```

That requires relay configuration in Google Workspace Admin and is more operationally strict than the app-password setup above.

## Recommended Production Sender Identity

Use a branded sender such as:

```env
MAIL_FROM="noreply@pdcps.co"
MAIL_FROM_NAME="Podocarpus Real Estate LLC"
```

That is the cleanest professional setup for password resets and system notifications.