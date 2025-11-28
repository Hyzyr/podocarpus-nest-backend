# 🚀 Prisma 7 Migration Guide

Simple step-by-step guide to migrate from Prisma 6 to Prisma 7 on your server.

---

## ⚡ Quick Migration (4 Steps)

### Step 1: Pull Latest Code

```bash
git pull origin main
```

### Step 2: Upgrade Node.js

**Check current version:**
```bash
node --version
```

**If below 22.12, upgrade:**

```bash
# Using nvm
nvm install 22.12
nvm use 22.12

# OR using fnm
fnm install 22.12
fnm use 22.12
fnm default 22.12

# Verify
node --version  # Should show v22.12.0 or higher
```

> **Note**: Prisma 7 requires Node.js **20.19+**, **22.12+**, or **24.0+**

### Step 3: Install Prisma 7

```bash
npm install prisma@7.0.1 @prisma/client@7.0.1
```

### Step 4: Generate & Deploy

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Start the application
npm run start:prod
```

---

## ✅ Verification

After migration, verify everything works:

```bash
# Check Prisma version
npx prisma --version  # Should show 7.x

# Test database connection
npx prisma db pull

# Check application starts
npm run dev
```

---

## 📋 What Changed?

The code you pulled includes these updates:

| File | Change |
|------|--------|
| `prisma/schema.prisma` | ❌ Removed `url` from datasource |
| `prisma/prisma.config.ts` | ✅ New config file (auto-used) |
| `package.json` | ❌ Removed `prisma.seed` field |
| `src/.../prisma.service.ts` | ✅ Updated with datasource config |
| `prisma/seed.ts` | ✅ Updated with datasource config |

**You don't need to change these files** - they're already updated in the code you pulled.

---

## 🔧 Troubleshooting

### Issue: "Prisma only supports Node.js 22.12+"

**Fix:** Upgrade Node.js (see Step 2)

### Issue: Environment variable not found

**Fix:** Ensure `.env` file exists with:
```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

### Issue: Migration fails

**Fix:** Check migration status first:
```bash
npx prisma migrate status
npx prisma migrate resolve --rolled-back <migration-name>
npx prisma migrate deploy
```

---

## 🐳 Docker Deployment

If using Docker, ensure your Dockerfile:

```dockerfile
# Use Node.js 22.12+
FROM node:22.12-alpine

# Copy Prisma files
COPY prisma ./prisma

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Start app
CMD ["npm", "run", "start:prod"]
```

---

## 🔄 Rollback (if needed)

If something goes wrong:

```bash
# Restore previous commit
git checkout <previous-commit-hash>

# Reinstall dependencies
npm ci

# Generate Prisma Client
npx prisma generate
```

---

## 📚 References

- [Prisma 7 Docs](https://pris.ly/d/config-datasource)
- [Node.js Downloads](https://nodejs.org/)
