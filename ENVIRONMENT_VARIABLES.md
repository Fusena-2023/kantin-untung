# 🔐 Environment Variables Complete Guide

## Backend Environment Variables

### Wajib Dikonfigurasi di Production

#### `DATABASE_URL` (CRITICAL)
```
Deskripsi: Connection string lengkap ke PostgreSQL
Format: postgresql://user:password@host:port/database
Contoh: postgresql://postgres:mypass123@postgres.railway.internal:5432/railway
Sumber: Railway → PostgreSQL → Connect tab
```

#### `JWT_SECRET` (CRITICAL - SECURITY)
```
Deskripsi: Secret key untuk sign/verify JWT tokens
Format: Random string min 32 characters
Contoh: aB1234567890123456789012345678901234567890=
Generate: ./generate-jwt-secret.sh (atau generate-jwt-secret.bat)
⚠️ JANGAN pernah share atau commit ke GitHub!
```

#### `NODE_ENV` (RECOMMENDED)
```
Deskripsi: Environment mode
Value: production
Pengaruh: Logging, error handling, optimization
```

#### `PORT` (OPTIONAL)
```
Deskripsi: Port yang di-listen backend
Default: 3001
Value: 3001 (atau port lain yang available)
Note: Railway auto-assign jika tidak set
```

#### `FRONTEND_URL` (CRITICAL - CORS)
```
Deskripsi: URL frontend untuk CORS whitelist
Format: https://domain.com (tanpa trailing slash)
Contoh: https://kantin-untung.vercel.app
Sumber: Vercel dashboard setelah deploy
⚠️ HARUS match EXACTLY dengan domain Vercel!
```

### Optional Environment Variables

#### `RATE_LIMIT_WINDOW_MS`
```
Deskripsi: Time window untuk rate limiting (milliseconds)
Default: 900000 (15 menit)
Value: 900000
Pengaruh: Mencegah abuse/brute force
```

#### `RATE_LIMIT_MAX`
```
Deskripsi: Max requests per window
Default: 100
Value: 100
Pengaruh: Berapa banyak request dibolehkan per 15 menit
```

#### `LOG_LEVEL`
```
Deskripsi: Level logging
Opsi: debug, info, warn, error
Default: info
```

---

## Frontend Environment Variables

### Wajib Dikonfigurasi di Production

#### `VITE_API_URL` (CRITICAL)
```
Deskripsi: Base URL untuk API backend
Format: https://domain.com/api (dengan /api)
Contoh: https://kantin-untung.up.railway.app/api
Sumber: Railway backend URL + /api
Lokasi: Vercel Settings → Environment Variables
```

### Optional Frontend Variables

#### `VITE_APP_TITLE`
```
Deskripsi: Browser tab title
Default: Kantin Untung
Value: Kantin Untung
```

---

## How to Set Environment Variables

### Method 1: Railway Dashboard (RECOMMENDED)

**For Backend:**
```
1. railway.app → Login
2. Select backend service
3. Variables tab
4. Click "Add variable"
5. Input KEY dan VALUE
6. Auto redeploy saat save
```

**Add these:**
```
PORT = 3001
NODE_ENV = production
DATABASE_URL = [paste full connection string]
DB_HOST = postgres.railway.internal
DB_USER = postgres
DB_PASSWORD = [password from connection string]
DB_NAME = railway
DB_PORT = 5432
JWT_SECRET = [generate dengan script]
FRONTEND_URL = [Vercel URL setelah deploy]
RATE_LIMIT_WINDOW_MS = 900000
RATE_LIMIT_MAX = 100
```

### Method 2: Vercel Dashboard (For Frontend)

**For Frontend:**
```
1. vercel.com → Login
2. Select kantin-untung project
3. Settings → Environment Variables
4. Add variable
5. VITE_API_URL = [Railway URL]/api
6. Trigger redeploy
```

### Method 3: Via CLI

**Railway CLI:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Set variables
railway variables set JWT_SECRET "your-secret-here"
railway variables set FRONTEND_URL "https://..."

# View all
railway variables
```

**Vercel CLI:**
```bash
# Install
npm i -g vercel

# Login
vercel login

# Set env
vercel env add VITE_API_URL
# Enter value: https://...

# Pull to local
vercel env pull
```

---

## Database Connection Details

### From Railway PostgreSQL

**Format 1: Full Connection String**
```
postgresql://postgres:password@postgres.railway.internal:5432/railway
```

**Format 2: Individual Components**
```
DB_HOST = postgres.railway.internal
DB_USER = postgres
DB_PASSWORD = your-password-here
DB_NAME = railway
DB_PORT = 5432
```

**How to Extract from Railway:**
1. Railway dashboard → PostgreSQL service
2. Connect tab → Connection String
3. Copy the full string OR individual components

---

## Frontend API URL Configuration

### In Code (axios.js)
```javascript
// Automatically uses process.env.VITE_API_URL in production
const api = axios.create({
  baseURL: process.env.VITE_API_URL || 'http://localhost:3001/api'
})
```

### Local Development
```javascript
// Uses localhost if VITE_API_URL not set
// (default fallback)
```

### Production (Vercel)
```javascript
// Uses VITE_API_URL dari environment variables
// https://kantin-untung.up.railway.app/api
```

---

## JWT Secret Generation

### Secure Method 1: Using OpenSSL (Recommended)

```bash
# Linux/Mac
openssl rand -base64 32

# Output: aB123456789...== (32+ characters)
```

### Method 2: Using Online Generator
```
https://generate-random.org/base64
(copy 32+ characters)
```

### Method 3: Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Method 4: Using Windows PowerShell
```powershell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Random).ToString() + (Get-Date).Ticks))
```

### IMPORTANT: What NOT to Do
```
❌ DO NOT use "password" atau "secret"
❌ DO NOT use birthdate atau simple string
❌ DO NOT reuse production secret di development
❌ DO NOT share secret dengan tim via chat
```

---

## Verification Checklist

### After Setting Variables

#### Backend
- [ ] Railway backend service berstatus "Running"
- [ ] Logs tidak menunjukkan connection errors
- [ ] Health check: `curl https://[railway-url]/health`
- [ ] Response: `{"status":"OK",...}`

#### Frontend
- [ ] Vercel deployment succeeded
- [ ] Build logs tidak ada error
- [ ] Browser: Open app → Console clear dari error
- [ ] Network tab: API calls ke Railway URL

#### Database
- [ ] PostgreSQL service running di Railway
- [ ] Can connect: `psql [connection-string]`
- [ ] Tables exist (dari migrations)
- [ ] Data loaded (dari seeders)

---

## Common Variable Mistakes & Fixes

### ❌ CORS Error
```
Problem: Origin 'https://vercel.app' not allowed
Cause: FRONTEND_URL tidak match di Railway
Fix: Check Rails env var FRONTEND_URL = exact Vercel domain
```

### ❌ DB Connection Error
```
Problem: connect ECONNREFUSED
Cause: DATABASE_URL salah format atau DB offline
Fix: 1) Verify PostgreSQL running
     2) Test psql connection locally
     3) Check DATABASE_URL format exact
```

### ❌ JWT Error
```
Problem: JsonWebTokenError: invalid token
Cause: JWT_SECRET berbeda di prod vs code
Fix: Verify JWT_SECRET set di Railway
     Restart backend service
```

### ❌ API URL Wrong
```
Problem: API calls 404 atau network error
Cause: VITE_API_URL incorrect
Fix: Check Vercel env var = [Railway URL]/api
     Clear browser cache
     Redeploy frontend
```

---

## Environment Variable Security

### Best Practices ✅

1. **Never commit .env to GitHub**
   ```
   .env
   .env.local
   .env.production
   Hanya commit: .env.example
   ```

2. **Use strong JWT_SECRET**
   ```
   ✅ 32+ random characters
   ✅ Generated dengan crypto tool
   ❌ "password123"
   ❌ "secret"
   ❌ "admin"
   ```

3. **Rotate secrets regularly**
   ```
   Production: Change JWT_SECRET every 3-6 months
   Keep old secret untuk decode existing tokens
   ```

4. **Audit who has access**
   ```
   ✅ Only developers perlu access railway.app
   ❌ Jangan share password Railway
   ❌ Jangan share JWT_SECRET
   ```

5. **Use separate secrets untuk dev/prod**
   ```
   Development: JWT_SECRET = dev-secret-only-123
   Production: JWT_SECRET = secure-prod-secret-xxxxx
   ```

---

## Variable Naming Convention

```
DATABASE_URL         # Full connection string
DB_HOST             # Hostname only
DB_USER             # Username only
DB_PASSWORD         # Password only
DB_NAME             # Database name only
DB_PORT             # Port only

JWT_SECRET          # Secret key for JWT
NODE_ENV            # environment mode
PORT                # Server port
FRONTEND_URL        # Frontend domain
VITE_API_URL        # Frontend → Backend URL

RATE_LIMIT_*        # Rate limiting configs
LOG_LEVEL           # Logging level
```

---

## Production Checklist

Before going live:

- [ ] All required variables set in both platforms
- [ ] JWT_SECRET is secure & random
- [ ] FRONTEND_URL matches Vercel domain exactly
- [ ] DATABASE_URL tested & working
- [ ] VITE_API_URL set di Vercel dengan /api suffix
- [ ] No hardcoded values di code
- [ ] All variables use production values
- [ ] Health endpoint responds 200
- [ ] API calls work from frontend
- [ ] Login/authentication works
- [ ] Database queries return data

---

## Emergency Operations

### If JWT_SECRET Compromised
```bash
1. Generate new JWT_SECRET
2. Update Railway env variable
3. Restart backend service
4. Users akan logout (token lama invalid)
5. Beri tahu users untuk login ulang
```

### If DATABASE_URL Compromised
```bash
1. Change PostgreSQL password di Railway
2. Update DATABASE_URL env var
3. Restart backend
4. Update any backups
```

### If FRONTEND_URL Wrong
```bash
1. Deploy baru di Vercel (akan dapat URL baru)
2. Copy Vercel URL yang benar
3. Update FRONTEND_URL di Railway
4. Restart backend
5. Clear frontend cache jika perlu
```

---

## Testing Environment Variables

### Test Backend Connection
```bash
# Via curl
curl -H "Content-Type: application/json" \
  https://[railway-url]/health

# Via psql
psql [DATABASE_URL]
\dt  # List tables
\q   # Exit
```

### Test Frontend API
```javascript
// Browser console
fetch('https://[railway-url]/api/health')
  .then(r => r.json())
  .then(d => console.log(d))
```

### Test JWT
```javascript
// Backend logs when login
// Check Railway logs untuk JWT generation
```

---

## Reference Table

| Variable | Where | Required | Example |
|----------|-------|----------|---------|
| DATABASE_URL | Railway Env | ✅ | `postgresql://...` |
| JWT_SECRET | Railway Env | ✅ | `aB123456...` |
| FRONTEND_URL | Railway Env | ✅ | `https://app.vercel.app` |
| VITE_API_URL | Vercel Env | ✅ | `https://api.railway.app/api` |
| NODE_ENV | Railway Env | ✅ | `production` |
| PORT | Railway Env | ⚠️ | `3001` |
| DB_HOST | Railway Env | ⚠️ | `postgres.railway.internal` |
| RATE_LIMIT_* | Railway Env | ❌ | `900000` |

---

**Last Updated:** December 2025
**Status:** Ready for Production ✅
