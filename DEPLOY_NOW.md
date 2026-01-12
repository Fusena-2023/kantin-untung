# 🚀 Panduan Deploy Gratis - Kantin Untung

Website ini akan di-host di:
- **Frontend (Vercel)**: Gratis unlimited
- **Backend + Database (Railway)**: $5 credit gratis per bulan

## 📋 Prasyarat

1. ✅ Akun GitHub (sudah ada repo `kantin-untung`)
2. ✅ Email untuk daftar Vercel & Railway

---

## LANGKAH 1: Push Kode ke GitHub

Pastikan semua perubahan sudah di-push:

```bash
cd d:\aplikasi\kantin-untung
git add .
git commit -m "Add deployment configuration"
git push origin main
```

---

## LANGKAH 2: Deploy Backend di Railway (10 menit)

### 2.1 Buat Akun Railway
1. Buka https://railway.app
2. Klik **"Login"** → **"Login with GitHub"**
3. Authorize Railway

### 2.2 Buat PostgreSQL Database
1. Di dashboard Railway, klik **"New Project"**
2. Pilih **"Provision PostgreSQL"**
3. Tunggu 1-2 menit sampai database ready ✅
4. Klik database → Tab **"Variables"**
5. Copy nilai `DATABASE_URL` (simpan sementara di notepad)

### 2.3 Deploy Backend dari GitHub
1. Di project yang sama, klik **"New"** → **"GitHub Repo"**
2. Pilih repository `kantin-untung`
3. Railway akan mendeteksi sebagai monorepo
4. Pilih folder **`backend`** sebagai root directory
5. Tunggu build selesai

### 2.4 Set Environment Variables
1. Klik service backend → Tab **"Variables"**
2. Klik **"New Variable"** dan tambahkan:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | (paste dari langkah 2.2) |
| `JWT_SECRET` | `kantin-untung-secret-key-2024-production` |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `FRONTEND_URL` | `https://kantin-untung.vercel.app` (update nanti setelah dapat URL Vercel) |

3. Klik **"Deploy"** untuk redeploy

### 2.5 Catat URL Backend
1. Klik tab **"Settings"** → **"Networking"**
2. Klik **"Generate Domain"**
3. Catat URL seperti: `https://kantin-untung-backend-production.up.railway.app`

---

## LANGKAH 3: Deploy Frontend di Vercel (5 menit)

### 3.1 Buat Akun Vercel
1. Buka https://vercel.com
2. Klik **"Sign Up"** → **"Continue with GitHub"**
3. Authorize Vercel

### 3.2 Import Project
1. Klik **"Add New..."** → **"Project"**
2. Pilih repository `kantin-untung`
3. **PENTING**: Set konfigurasi ini:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/spa`

### 3.3 Set Environment Variable
1. Buka **Environment Variables**
2. Tambahkan:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://[URL-RAILWAY-ANDA]/api` |

Contoh: `https://kantin-untung-backend-production.up.railway.app/api`

3. Klik **"Deploy"**

### 3.4 Catat URL Frontend
Setelah deploy selesai, catat URL seperti:
`https://kantin-untung.vercel.app`

---

## LANGKAH 4: Update FRONTEND_URL di Railway

1. Kembali ke Railway → Backend service → **Variables**
2. Edit `FRONTEND_URL` dengan URL Vercel yang baru didapat
3. Railway akan auto-redeploy

---

## LANGKAH 5: Inisialisasi Database

### Via Railway Query Editor:
1. Railway Dashboard → Klik PostgreSQL database
2. Tab **"Data"** → **"Query"**
3. Jalankan query untuk membuat user default:

```sql
-- Cek apakah tabel sudah ada (backend akan auto-create via Sequelize)
SELECT * FROM "Users" LIMIT 1;
```

Jika tabel belum ada, backend akan membuat otomatis saat pertama kali diakses.

### Membuat User Pertama (Admin):
Jalankan query ini di Railway:

```sql
-- Buat role jika belum ada
INSERT INTO "Roles" (name, "createdAt", "updatedAt") 
VALUES ('pemilik', NOW(), NOW()), ('pegawai', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Lihat ID role pemilik
SELECT id FROM "Roles" WHERE name = 'pemilik';
```

Kemudian buat user admin via API atau daftar langsung di website.

---

## LANGKAH 6: Test Deployment ✅

### Test Backend API:
```bash
curl https://[URL-RAILWAY-ANDA]/health
```

Harusnya return:
```json
{"status":"OK","message":"Server berjalan dengan baik"}
```

### Test Frontend:
1. Buka `https://[URL-VERCEL-ANDA]`
2. Halaman login harus muncul
3. Daftar user baru atau login dengan user yang sudah ada

---

## 🎉 Selesai!

Website Anda sekarang live di:
- **Frontend**: `https://kantin-untung.vercel.app`
- **Backend API**: `https://[railway-url]/api`

---

## ❓ Troubleshooting

### Error CORS:
- Pastikan `FRONTEND_URL` di Railway sesuai dengan URL Vercel
- Jangan ada trailing slash (`/`) di akhir URL

### Database Connection Error:
- Pastikan `DATABASE_URL` sudah di-copy dengan benar
- Railway PostgreSQL harus dalam status "Active"

### Build Failed di Vercel:
- Pastikan Root Directory = `frontend`
- Pastikan Build Command = `npm run build`
- Pastikan Output Directory = `dist/spa`

### 401 Unauthorized:
- Pastikan `JWT_SECRET` sama di semua environment
- Clear localStorage browser dan login ulang

---

## 💰 Estimasi Biaya

| Service | Cost |
|---------|------|
| Vercel Frontend | **$0** (gratis unlimited) |
| Railway Backend | **$0-5** (free $5 credit/bulan) |
| Railway PostgreSQL | Termasuk dalam credit |
| **TOTAL** | **$0/bulan** (untuk usage kecil-menengah) |

Railway memberikan $5 credit gratis per bulan yang cukup untuk:
- ~500 jam runtime
- ~1GB database storage
- Cocok untuk aplikasi skala kecil-menengah
