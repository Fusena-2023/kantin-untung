# Kantin Untung - Sistem Pencatatan Keuangan

Aplikasi web full-stack untuk pencatatan keuangan kantin dengan role-based access control menggunakan Quasar Framework (Vue.js), Node.js/Express, dan PostgreSQL.

## 🚀 Fitur Utama

### Role Pegawai:
- ✅ Input transaksi pemasukan (penjualan)
- ✅ Input transaksi pengeluaran (operasional)  
- ✅ Melihat transaksi milik sendiri

### Role Pemilik:
- ✅ Melihat semua transaksi
- ✅ Laporan harian & bulanan
- ✅ CRUD manajemen user (tambah pegawai)
- ✅ Edit/hapus transaksi

## 🛠️ Tech Stack

- **Frontend**: Quasar Framework + Vue.js 3 (Composition API)
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT
- **State Management**: Pinia
- **UI Components**: Quasar Components
- **CSS**: SCSS with Quasar Variables

## 📋 Prerequisites

Sebelum menjalankan aplikasi, pastikan Anda sudah menginstall:

- [Node.js](https://nodejs.org/) (v16 atau lebih tinggi)
- [PostgreSQL](https://www.postgresql.org/) (v12 atau lebih tinggi)
- [Git](https://git-scm.com/)

## 🚀 Quick Start

### 1. Setup Database PostgreSQL

```bash
# Masuk ke PostgreSQL
psql -U postgres

# Buat database
CREATE DATABASE kantin_untung_db;

# Buat user (optional)
CREATE USER kantinuser WITH ENCRYPTED PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE kantin_untung_db TO kantinuser;
```

### 2. Setup Backend

```bash
# Masuk ke folder backend
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit file .env sesuai konfigurasi database Anda
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=kantin_untung_db
# DB_USER=postgres
# DB_PASSWORD=your_password

# Jalankan server development
npm run dev
```

### 3. Setup Frontend

```bash
# Masuk ke folder frontend  
cd frontend

# Install dependencies
npm install

# Jalankan server development
npm run dev
```

### 4. Akses Aplikasi

- **Frontend**: http://localhost:9000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health

## 📁 Struktur Project

```
kantin-untung/
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── config/         # Database & app configuration
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/     # Authentication & error handling
│   │   ├── models/         # Sequelize models (User, Transaction)
│   │   ├── routes/         # API endpoints
│   │   └── utils/          # Helper functions
│   ├── .env               # Environment variables
│   └── package.json
│
├── frontend/               # Quasar Vue.js App
│   ├── src/
│   │   ├── components/    # Reusable Vue components
│   │   ├── layouts/       # Page layouts
│   │   ├── pages/         # Application pages
│   │   ├── router/        # Vue Router configuration
│   │   ├── services/      # API service layer
│   │   ├── stores/        # Pinia state management
│   │   └── utils/         # Utility functions
│   └── package.json
│
└── .github/
    └── copilot-instructions.md  # GitHub Copilot workspace instructions
```

## 🔐 Default Login

Setelah setup selesai, Anda perlu membuat user pertama melalui API:

```bash
# POST /api/auth/register
{
  "username": "admin",
  "email": "admin@kantin.com", 
  "password": "admin123",
  "fullName": "Administrator",
  "role": "pemilik"
}
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register user
- `POST /api/auth/logout` - Logout user

### Transactions
- `GET /api/transactions` - Get transactions (dengan filtering)
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction (pemilik only)

### Reports (Pemilik Only)
- `GET /api/reports/dashboard` - Dashboard summary
- `GET /api/reports/daily` - Daily report
- `GET /api/reports/monthly` - Monthly report
- `GET /api/reports/range` - Custom date range report

### Users (Pemilik Only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🛡️ Security Features

- JWT Authentication dengan automatic token refresh
- Password hashing menggunakan bcrypt
- Input validation dan sanitization
- Rate limiting untuk API endpoints
- CORS configuration
- SQL injection protection dengan Sequelize ORM

## 🔧 Development

### VS Code Tasks

Gunakan VS Code tasks untuk development:

- `Ctrl+Shift+P` → `Tasks: Run Task` → `Start Backend Server`
- `Ctrl+Shift+P` → `Tasks: Run Task` → `Start Frontend Server`
- `Ctrl+Shift+P` → `Tasks: Run Task` → `Start Both Servers`

### Environment Variables

**Backend (.env)**:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kantin_untung_db
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:9000
```

## 🚀 Production Deployment

### Backend
```bash
npm run start
```

### Frontend
```bash
npm run build
# Files will be in dist/ folder
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Contact

Project Link: [https://github.com/yourusername/kantin-untung](https://github.com/yourusername/kantin-untung)

---

⚡ **Built with love for efficient canteen financial management** ⚡