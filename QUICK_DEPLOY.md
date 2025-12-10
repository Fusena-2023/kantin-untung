# 🚀 Quick Deployment Reference - Kantin Untung

## 5-Minute Quick Start

### Prasyarat
- [ ] GitHub account dengan repo push
- [ ] Akses ke email untuk signup

### Deployment Flow

```
GitHub Repo 
    ↓
├─→ Vercel (Frontend)    → https://kantin-untung.vercel.app
└─→ Railway (Backend)    → https://kantin-untung.up.railway.app
    └─→ PostgreSQL DB    → Internal
```

---

## Langkah 1: Railway Backend Setup (10 menit)

```
1. railway.app → Sign in GitHub
2. New Project → Provision PostgreSQL
3. Wait 2-3 minutes
4. Copy CONNECTION_STRING dari tab "Connect"
5. New Service → GitHub Repo
6. Select kantin-untung
7. Add Variables:
   - DATABASE_URL: [paste full string]
   - JWT_SECRET: [generate random 32 char]
   - NODE_ENV: production
   - PORT: 3001
   - FRONTEND_URL: [set later after Vercel]
8. Wait deploy ✓
9. Note URL: https://XXXX.up.railway.app
```

---

## Langkah 2: Vercel Frontend Setup (5 menit)

```
1. vercel.com → Sign in GitHub
2. Add New → Project
3. Import kantin-untung
4. Configure:
   - Root: frontend
   - Build: npm run build
   - Output: dist/spa
5. Add Variable:
   - VITE_API_URL: https://[railway-url]/api
6. Deploy ✓
7. Note URL: https://kantin-untung.vercel.app
```

---

## Langkah 3: Update Railway FRONTEND_URL (2 menit)

```
1. Railway → Backend Service
2. Variables → Edit FRONTEND_URL
3. Set: https://kantin-untung.vercel.app
4. Save (auto redeploy)
```

---

## Langkah 4: Database Initialization (5 menit)

**Option A: Via psql**
```bash
psql "postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway"
# Paste migration SQL
# \q to exit
```

**Option B: Via Railway UI**
```
Railway → PostgreSQL → Data tab → Query editor
Paste & run migration SQL
```

---

## Langkah 5: Test

```bash
# Test API
curl https://[railway-url].up.railway.app/health

# Visit Frontend
https://kantin-untung.vercel.app

# Login test
Email: admin@kantin.id
Password: (dari seeder)
```

---

## Environment Variables Reference

### Railway Backend
```env
DATABASE_URL=postgresql://postgres:pwd@postgres.railway.internal:5432/railway
DB_HOST=postgres.railway.internal
DB_USER=postgres
DB_PASSWORD=xxxxx
DB_NAME=railway
DB_PORT=5432
JWT_SECRET=your-secret-32-chars-here
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://kantin-untung.vercel.app
```

### Vercel Frontend
```env
VITE_API_URL=https://[railway-url].up.railway.app/api
```

---

## Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| CORS Error | Verify FRONTEND_URL matches Vercel domain exactly |
| Blank Page | Check VITE_API_URL in Vercel env vars |
| DB Connection | Verify DATABASE_URL format, test with psql |
| Login Fails | Clear localStorage, check JWT_SECRET |
| 404 Frontend | Check Output Directory is `dist/spa` |

---

## Logs Location

| Platform | Where | How |
|----------|-------|-----|
| Vercel | Deployments → [latest] → Logs | Browser UI |
| Railway | Service → Logs tab | Browser UI |
| PostgreSQL | Railway → PostgreSQL → Logs | Browser UI |

---

## Cost

**Free tier covers:**
- Vercel: ∞ bandwidth
- Railway: $5 credit/month
- Database: ∞ (included in Railway credit)

**Total Cost**: $0 if under $5/month usage

---

## Success Indicators ✅

- [ ] Frontend loads without console errors
- [ ] Backend health check returns 200
- [ ] Login works
- [ ] Can input transaction
- [ ] Network tab shows API calls to Railway URL
- [ ] Reports page loads data

---

## Next: Full Documentation

→ Read `DEPLOYMENT_GUIDE.md` for detailed steps
→ Read `DEPLOYMENT_CHECKLIST.md` for complete verification

---

## Emergency Rollback

If something wrong:
```
1. Vercel: Deployments → [previous] → Revert
2. Railway: Redeploy from previous build
3. Check logs for error messages
```

---

**You're ready!** 🎉
