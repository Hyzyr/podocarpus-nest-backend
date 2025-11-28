# 💻 Local Prisma 7 Setup

Quick guide to complete the Prisma 7 migration on your local machine.

---

## 🎯 3-Step Setup

### Step 1: Upgrade Node.js

You have Node.js 22.21.0 already installed via fnm. Activate it:

```bash
# Set as default
fnm default 22.21.0

# Restart terminal, then verify
node --version  # Should show v22.21.0
```

**Alternative (if above doesn't work):**

**PowerShell:**
```powershell
fnm env --use-on-cd | Out-String | Invoke-Expression
fnm use 22.21.0
```

**Git Bash:**
```bash
eval "$(fnm env --use-on-cd)"
fnm use 22.21.0
```

### Step 2: Install Prisma 7

```bash
npm install prisma@7.0.1 @prisma/client@7.0.1
```

### Step 3: Update Schema & Generate

Remove the `url` line from `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  # Remove this line: url = env("DATABASE_URL")
}
```

Then generate:

```bash
npx prisma generate
```

---

## ✅ Test Everything

```bash
# Test Prisma works
npx prisma --version  # Should show 7.0.1

# Start app
npm run dev
```

---

## 🔍 What's Already Done

✅ `prisma/prisma.config.ts` created
✅ `prisma.service.ts` updated
✅ `seed.ts` updated
✅ `package.json` updated

You just need to:
1. Upgrade Node.js
2. Install Prisma 7
3. Remove `url` from schema

---

## ⚠️ Troubleshooting

### fnm doesn't work in terminal

Add to your shell profile:

**PowerShell** (`notepad $PROFILE`):
```powershell
fnm env --use-on-cd | Out-String | Invoke-Expression
```

**Git Bash** (`~/.bashrc`):
```bash
eval "$(fnm env --use-on-cd)"
```

Then restart terminal.

### VSCode shows old Node version

1. Close VSCode
2. Open new terminal with correct Node version
3. Start VSCode from terminal: `code .`

---

## 📦 Server Deployment

For deploying to production server, see **[PRISMA_7_MIGRATION_GUIDE.md](./PRISMA_7_MIGRATION_GUIDE.md)**
