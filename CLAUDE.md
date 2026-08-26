# CLAUDE.md — podocarpus-nest-backend

Guidance for Claude Code working in this repo. (GitHub Copilot reads the same rules
from `.github/copilot-instructions.md`.)

---

## Worklog — keep `WORKLOG.md` current

After finishing any meaningful task in this repo, add an entry to
[`WORKLOG.md`](WORKLOG.md) at the repo root. This is the project's running record so
nobody has to dig through git history to see what changed and why.

### When to log
Log an entry when you:
- add a feature, fix a bug, refactor, change config, or upgrade dependencies;
- **do or help with an operational task the user describes in chat — even if it never
  becomes a commit.** Watch the user's messages for these and log them. Examples of
  phrasing → what to record:
  - "upload it to the server", "deploy", "push to prod" → **Deployed / uploaded build to server**
  - "refresh / restart the server" → **Server refresh**
  - "renew / update the SSL", "the certificate expired" → **SSL certificate update**
  - "I generated images for properties", "rename them to match the units" → **Generated & renamed property images**
  - "run the migrations", "I uploaded the migrated things" → **Database migration uploaded**
  - "seeded the data", "imported the CSV" → **Data seed / import**
  - "pointed the domain", "changed DNS / CORS" → **Domain / DNS change**

If the user describes doing one of these themselves, still log it — the worklog tracks
project activity, not just your edits. When in doubt whether something is worth logging,
log it briefly.

### When NOT to log
Skip: questions, code reading, exploratory discussion, planning that didn't ship, or
throwaway experiments the user says to drop.

### Where & format
- File: `WORKLOG.md` (repo root). Newest entries at the **top**, grouped under a
  `## YYYY-MM` month heading — create the month heading if it isn't there yet.
- Append only. Never rewrite or delete past entries.
- Entry shape:

  ```
  ### YYYY-MM-DD — Short title
  - **Type:** Feature | Fix | Refactor | Ops | Media | Data | Deps | Docs
  - **Did:** what changed, in plain language
  - **Impact:** what it improved or fixed   (omit if obvious)
  ```

### Writing rules
- Past tense, factual, 1–3 lines. One entry per task; batch tiny related edits into one.
- Use today's date. Group related same-day work into a single entry when it reads better.
- **Never** put secrets, credentials, tokens, or private wallet/server addresses in the log.
- Adding to `WORKLOG.md` is expected and does not need a separate confirmation.

---

## Project

NestJS (Fastify adapter) + Prisma over PostgreSQL, Swagger-documented REST API.
Modules: `auth`, `users`, `properties`, `contracts`, `events`, `appointments`,
`investments`, `payments`, `landing`, notifications, KYC, mailer, storage.
