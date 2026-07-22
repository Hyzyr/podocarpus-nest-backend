# Email (SMTP) — reference

Email is **set up and working**. It sends from **support@pdcps.co** via Google
Workspace SMTP. You don't need to do anything unless it breaks.

## Current settings (in server `.env`)
```env
MAIL_HOST="smtp.gmail.com"
MAIL_PORT="465"
MAIL_SECURE="true"
MAIL_USER="support@pdcps.co"
MAIL_PASS="<google app password>"
MAIL_FROM="support@pdcps.co"
MAIL_FROM_NAME="Podocarpus"
```
`MAIL_PASS` is a Google **App Password** (not the mailbox login password).

## If email stops working
1. Check `MAIL_PASS` is still a valid App Password for **support@pdcps.co**.
   - Make a new one: sign in as that mailbox → **myaccount.google.com → Security → App passwords**.
   - See [ROTATE_SECRETS.md](./ROTATE_SECRETS.md) for the full steps.
2. Make sure the server can reach `smtp.gmail.com:465`.
3. Restart the backend after any `.env` change.
4. Test with the forgot-password flow and check Inbox + Spam.

## Deliverability (nice to have)
For fewer spam issues, make sure the `pdcps.co` domain has SPF (already set),
and enable **DKIM** in admin.google.com. DMARC is optional.
