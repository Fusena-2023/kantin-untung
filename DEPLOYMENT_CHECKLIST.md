# ✅ Deployment Checklist - Kantin Untung

## Pre-Deployment Checklist

### Repository & Code
- [ ] Semua code sudah di-commit dan push ke GitHub
- [ ] Branch `main` adalah production branch
- [ ] README.md sudah updated
- [ ] Tidak ada hardcoded credentials di code
- [ ] `.env` file ada di `.gitignore`

### Frontend (Quasar/Vue)
- [ ] `frontend/src/boot/axios.js` menggunakan `process.env.VITE_API_URL`
- [ ] `package.json` build command: `quasar build`
- [ ] Test build locally: `npm run build`
- [ ] `dist/spa` folder ter-generate dengan sempurna

### Backend (Node.js/Express)
- [ ] `backend/src/app.js` CORS menggunakan `process.env.FRONTEND_URL`
- [ ] `package.json` start script: `node src/app.js`
- [ ] Semua environment variables di `.env.production.example` documented
- [ ] Database migrations ready di `src/migrations/`
- [ ] Seeders ready di `src/seeders/`

---

## Step-by-Step Deployment

### 1️⃣ GitHub Setup (5 menit)
- [ ] Login ke GitHub
- [ ] Verifikasi repo `kantin-untung` public/accessible
- [ ] Catat repo URL: `https://github.com/YOUR_USERNAME/kantin-untung`

### 2️⃣ Railway Setup (15 menit)

#### Database Setup
- [ ] Buka https://railway.app dan sign in dengan GitHub
- [ ] Create New Project → Provision PostgreSQL
- [ ] Tunggu 2-3 menit sampai PostgreSQL ready
- [ ] Click PostgreSQL service
- [ ] Tab "Connect" → Copy full CONNECTION_STRING
  ```
  postgresql://postgres:xxxxx@postgres.railway.internal:5432/railway
  ```
- [ ] **Catat semua values ini:**
  - DB_HOST: postgres.railway.internal
  - DB_USER: postgres  
  - DB_PASSWORD: (dari connection string)
  - DB_NAME: railway
  - DB_PORT: 5432

#### Backend Deployment
- [ ] Klik "New" → "GitHub Repo"
- [ ] Cari dan select `kantin-untung`
- [ ] Vercel akan auto-detect Node.js
- [ ] Tab "Variables", add environment variables:
  ```
  PORT=3001
  NODE_ENV=production
  DATABASE_URL=[paste connection string full]
  DB_HOST=postgres.railway.internal
  DB_USER=postgres
  DB_PASSWORD=[password dari connection string]
  DB_NAME=railway
  DB_PORT=5432
  JWT_SECRET=[generate dengan: openssl rand -base64 32]
  FRONTEND_URL=[akan set setelah Vercel deploy]
  ```
- [ ] Deploy mulai otomatis
- [ ] Tunggu sampai "✓ Deployed"
- [ ] **Catat Public URL backend:**
  ```
  https://[project-name].up.railway.app
  ```
- [ ] Test: `curl https://[project-name].up.railway.app/health`

### 3️⃣ Vercel Frontend Setup (10 menit)
- [ ] Buka https://vercel.com dan sign in dengan GitHub
- [ ] Click "Add New" → "Project"
- [ ] Import `kantin-untung` repository
- [ ] **Configure Project:**
  - Framework: Quasar (atau auto-detect)
  - Root Directory: `frontend`
  - Build Command: `npm run build`
  - Output Directory: `dist/spa`
  - Install Command: `npm install`

- [ ] Tab "Environment Variables", add:
  ```
  VITE_API_URL=https://[railway-backend-url].up.railway.app/api
  ```

- [ ] Click "Deploy"
- [ ] Tunggu build selesai (~2-3 menit)
- [ ] **Catat Public URL frontend:**
  ```
  https://kantin-untung.vercel.app
  ```

### 4️⃣ Update Backend FRONTEND_URL (2 menit)
- [ ] Kembali ke Railway dashboard
- [ ] Select backend service
- [ ] Tab "Variables"
- [ ] Update `FRONTEND_URL` dengan Vercel URL:
  ```
  FRONTEND_URL=https://kantin-untung.vercel.app
  ```
- [ ] Backend otomatis re-deploy

### 5️⃣ Database Initialization (5 menit)

**Option A: Via psql (Recommended)**
```bash
# Install psql client jika belum
# Windows: https://www.postgresql.org/download/windows/
# macOS: brew install postgresql
# Linux: apt-get install postgresql-client

# Connect ke database Railway
psql "postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway"

# Jalankan migrations (copy-paste dari backend/src/migrations/)
# Atau jalankan seeders
```

**Option B: Via Backend API (jika ada endpoint)**
```bash
curl -X POST https://[railway-backend].up.railway.app/api/init-db
```

**Option C: Manual di Railway Console**
- [ ] Di Railway dashboard → PostgreSQL service
- [ ] Tab "Data" → gunakan Query editor
- [ ] Paste migration SQL

### 6️⃣ Test Application (5 menit)
- [ ] Buka https://kantin-untung.vercel.app di browser
- [ ] Test login dengan credentials dari seeder
- [ ] Coba input transaksi
- [ ] Check Network tab: API calls should hit Railway URL
- [ ] Test report generation

---

## Post-Deployment Verification

### Health Checks
- [ ] Frontend loads tanpa error (check browser console)
- [ ] Backend health endpoint: `GET /health` → 200 OK
- [ ] API endpoint test: `GET /api/users` → 401 (auth required) atau 200
- [ ] Database connected: Check Railway PostgreSQL tab

### Testing User Flows
- [ ] Login as Employee (Pegawai)
  - [ ] Input pemasukan
  - [ ] Input pengeluaran
  - [ ] View own transactions
  
- [ ] Login as Owner (Pemilik)
  - [ ] View all transactions
  - [ ] Generate reports
  - [ ] Manage users
  - [ ] Edit/delete transactions

### Logs & Monitoring
- [ ] Check Vercel Logs (Deployments → [latest] → Logs)
  - [ ] Build successful
  - [ ] No error messages
  
- [ ] Check Railway Logs (Service → Logs)
  - [ ] Backend running
  - [ ] Database connected
  - [ ] No connection errors

---

## Common Issues & Solutions

### ❌ CORS Error
**Problem**: Frontend tidak bisa reach backend
**Solution**: 
1. Verify `FRONTEND_URL` di Railway env vars match Vercel domain exactly
2. Check `VITE_API_URL` di Vercel env vars point to Railway backend
3. Restart both services

### ❌ Database Connection Error
**Problem**: Backend error connecting to PostgreSQL
**Solution**:
1. Verify `DATABASE_URL` format is correct
2. Check PostgreSQL service di Railway adalah "Running"
3. Verify connection string matches exactly
4. Try: `psql "postgresql://..."` locally to test

### ❌ Build Failed on Vercel
**Problem**: Frontend build failed
**Solution**:
```bash
# Test build locally
cd frontend
npm ci
npm run build
# Check error messages
```

### ❌ Blank Page / 404 di Frontend
**Problem**: Page shows 404
**Solution**:
1. Vercel Setting → Git → Uncheck "Include source maps in production"
2. Check Output Directory is `dist/spa` not `dist`
3. Redeploy from Vercel dashboard

### ❌ Token/Authentication Issues
**Problem**: Login fails, token invalid
**Solution**:
1. Clear localStorage: Open DevTools → Application → Storage → Clear All
2. Verify `JWT_SECRET` di Railway env vars is set dan sama di production
3. Check token format di Network tab
4. Restart backend service

---

## Useful Commands

### Testing Backend Locally (before deploy)
```bash
cd backend
npm install
npm run seed:users    # Create default users
npm start            # Run server
# Test: curl http://localhost:3001/health
```

### Testing Frontend Build (before deploy)
```bash
cd frontend
npm install
npm run build        # Build production
npx quasar serve dist/spa  # Preview build
# Open: http://localhost:4173
```

### Connect to Railway PostgreSQL Locally
```bash
psql "postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway"
```

### Check Railway Logs in Real-time
```bash
# Dari Railway CLI (install dulu)
railway up              # Select service
railway logs            # Watch real-time logs
```

---

## Performance Optimization (Optional)

- [ ] Enable Vercel Analytics
- [ ] Enable Railway Observability
- [ ] Setup error tracking (Sentry, Rollbar)
- [ ] Configure CDN for images/assets
- [ ] Setup automated database backups

---

## Cost Estimation (Monthly)

| Service | Free Tier | Usage | Cost |
|---------|-----------|-------|------|
| Vercel | Unlimited | Frontend | $0 |
| Railway PostgreSQL | $5 credit | Database | ~$2-5 |
| Railway Compute | $5 credit | Backend | ~$2-5 |
| **Total** | | | **~$0-5** |

*Catatan: Railway memberikan $5 free credit per bulan, cukup untuk hobby/small project*

---

## Next Steps After Deployment

1. **Monitoring**
   - [ ] Setup error alerts
   - [ ] Monitor server logs daily
   - [ ] Check database size regularly

2. **Maintenance**
   - [ ] Backup database weekly
   - [ ] Update dependencies monthly
   - [ ] Review security settings quarterly

3. **Scaling** (if needed)
   - [ ] Upgrade Railway plan
   - [ ] Add Redis for caching
   - [ ] Optimize database queries

4. **Documentation**
   - [ ] Document deployment steps untuk team
   - [ ] Create runbook untuk common issues
   - [ ] Document custom configurations

---

## Support & Resources

- 🆘 Vercel Support: https://vercel.com/support
- 🆘 Railway Support: https://railway.app/support
- 📖 Railway Docs: https://docs.railway.app
- 📖 Vercel Docs: https://vercel.com/docs
- 💬 Railway Community: https://railway.app/community

---

**Last Updated**: December 2025
**Status**: ✅ Ready for Deployment
