# 🚀 Panduan Deployment Kantin Untung (Hosting Gratis)

## Pilihan Hosting Gratis Rekomendasi

### **Opsi 1: Vercel + Railway (TERBAIK)**
- **Frontend**: Vercel (gratis, unlimited)
- **Backend**: Railway (gratis $5/bulan)
- **Database**: Railway PostgreSQL (included)
- **Keunggulan**: Mudah setup, auto-deploy dari GitHub, CDN global

### **Opsi 2: Netlify + Render**
- **Frontend**: Netlify (gratis)
- **Backend**: Render (gratis dengan sleep mode)
- **Database**: Render PostgreSQL
- **Catatan**: Backend bisa sleep jika tidak ada traffic

### **Opsi 3: GitHub Pages + Railway**
- **Frontend**: GitHub Pages (static, gratis)
- **Backend**: Railway
- **Catatan**: Harus build frontend sebagai static site

---

## 🎯 Panduan Deployment Vercel + Railway

### **STEP 1: Persiapkan Repository GitHub**

```bash
# Pastikan semua changes sudah di-commit
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### **STEP 2: Setup Database di Railway**

1. **Buat akun Railway**
   - Kunjungi [railway.app](https://railway.app)
   - Sign in dengan GitHub

2. **Buat Project Baru**
   - Click "New Project"
   - Click "Provision PostgreSQL"
   - Tunggu sampai selesai

3. **Catat Connection String**
   - Di tab "Connect", copy PostgreSQL connection string
   - Format: `postgresql://user:password@host:port/database`

### **STEP 3: Deploy Backend ke Railway**

1. **Setup New Service**
   - Klik "New" → "GitHub Repo"
   - Pilih `kantin-untung` repository
   - Pilih branch `main`

2. **Configure Environment Variables**
   - Variables tab di Railway, add:
   ```
   PORT=3001
   NODE_ENV=production
   DATABASE_URL=postgresql://user:password@host:port/database
   DB_HOST=your-host
   DB_USER=your-user
   DB_PASSWORD=your-password
   DB_NAME=railway
   DB_PORT=5432
   JWT_SECRET=your-super-secret-key-min-32-chars-here!
   FRONTEND_URL=https://your-vercel-domain.vercel.app
   ```

3. **Setup Start Script**
   - Railway akan otomatis mendeteksi `npm start` dari package.json
   - Atau set custom start command: `node src/app.js`

4. **Catat Public URL**
   - Setelah deploy, catat URL backend (misal: `https://kantin-untung-prod.up.railway.app`)

### **STEP 4: Deploy Frontend ke Vercel**

1. **Buat akun Vercel**
   - Kunjungi [vercel.com](https://vercel.com)
   - Sign in dengan GitHub

2. **Import Project**
   - Click "Add New" → "Project"
   - Import `kantin-untung` repository
   - Vercel akan auto-detect Quasar project

3. **Configure Build Settings**
   ```
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist/spa
   Install Command: npm install
   ```

4. **Set Environment Variables**
   - Dalam Vercel dashboard → Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-railway-backend.up.railway.app/api`

5. **Deploy**
   - Click "Deploy"
   - Tunggu process selesai
   - Catat URL frontend (misal: `https://kantin-untung.vercel.app`)

### **STEP 5: Update Konfigurasi Aplikasi**

#### Update Frontend Axios Config
**File**: `frontend/src/boot/axios.js`
```javascript
const api = axios.create({
  baseURL: process.env.VITE_API_URL || 'http://localhost:3001/api'
})
```

#### Update Backend CORS
**File**: `backend/src/app.js`
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:9000',
  credentials: true,
}));
```

### **STEP 6: Initialize Database**

Setelah backend ter-deploy:

1. **SSH ke Railway Container (Optional)**
   ```bash
   # Atau run migration via API
   ```

2. **Atau Manual via Query Client**
   - Connect ke database menggunakan PostgreSQL client
   - Run migration files di `backend/src/migrations/`

3. **Seed Default Users**
   - Jalankan seeder untuk membuat user default
   - `backend/src/seeders/create-default-users.js`

### **STEP 7: Testing**

1. **Test Health Check**
   ```
   GET https://your-railway-backend.up.railway.app/health
   ```

2. **Test Login**
   - Akses `https://your-vercel-domain.vercel.app`
   - Coba login dengan credentials dari seeder

3. **Monitor Logs**
   - Vercel: Deployments → Logs
   - Railway: Service → Logs

---

## 📝 Environment Variables Checklist

### **Backend (.env)**
```
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
DB_HOST=your-host
DB_USER=your-user
DB_PASSWORD=your-password
DB_NAME=railway
DB_PORT=5432
JWT_SECRET=your-secret-key-min-32-chars
FRONTEND_URL=https://your-frontend-domain.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### **Frontend (.env atau Vercel Settings)**
```
VITE_API_URL=https://your-backend-domain.up.railway.app/api
```

---

## 🔧 Troubleshooting

### **CORS Error**
- Pastikan `FRONTEND_URL` di backend sesuai dengan domain Vercel
- Restart backend service

### **Database Connection Error**
- Verifikasi `DATABASE_URL` string format
- Check PostgreSQL adalah public/accessible
- Railway: Network tab untuk check public URL

### **Token/Auth Issues**
- Clear browser localStorage: `localStorage.clear()`
- Check JWT_SECRET konsisten di production
- Verify token dalam Network tab

### **Build Failure di Vercel**
```bash
# Debug build locally
cd frontend
npm run build
```

---

## 💡 Tips & Best Practices

1. **Auto-Deploy**: GitHub push otomatis trigger deploy di Vercel & Railway
2. **Health Check**: Endpoint `/health` untuk monitoring
3. **Backup Database**: Railway auto-backup, tapi backup manual lebih aman
4. **Monitoring**: Enable logs di both platform
5. **Custom Domain**: Bisa connect domain custom ke Vercel (vercel.com/docs)

---

## 📚 Referensi Berguna

- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Quasar Build Guide](https://quasar.dev/quasar-cli-vite/build-commands)
- [Express Deployment](https://expressjs.com/en/advanced/best-practice-performance.html)

---

## ⚠️ Limitasi Gratis

| Platform | Free Tier | Batasan |
|----------|-----------|---------|
| **Vercel** | Unlimited | 100GB bandwidth/bulan |
| **Railway** | $5/bulan | Cukup untuk small project |
| **PostgreSQL** | Included | 5GB storage |

**Budget**: ~$5/bulan untuk production-ready app

---

## 🎉 Setelah Deployment

1. **Test semua fitur** di production
2. **Setup monitoring** & alerts
3. **Backup database** secara berkala
4. **Update dependencies** untuk security
5. **Dokumentasi** untuk team

Selamat! Aplikasi Anda sekarang live! 🚀
