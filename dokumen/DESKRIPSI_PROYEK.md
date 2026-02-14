# Kantin Untung - Sistem Pencatatan Keuangan

## Deskripsi Proyek

**Kantin Untung** adalah aplikasi web full-stack untuk pencatatan dan manajemen keuangan kantin dengan sistem role-based access control. Aplikasi ini dirancang untuk memudahkan pemilik kantin dalam mengelola transaksi keuangan dan memberikan akses terbatas kepada pegawai.

## Tech Stack

- **Frontend**: Quasar Framework + Vue.js 3 (Composition API)
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Token)
- **State Management**: Pinia

## Fitur Utama

### Role Pegawai
- Input transaksi pemasukan (penjualan)
- Input transaksi pengeluaran (operasional)
- Melihat transaksi milik sendiri

### Role Pemilik
- Melihat semua transaksi dari semua pegawai
- Dashboard dengan laporan harian & bulanan
- Manajemen user (CRUD pegawai)
- Edit dan hapus transaksi
- Laporan keuangan dengan filter tanggal

## Keamanan

- JWT Authentication dengan automatic token refresh
- Password hashing menggunakan bcrypt
- Input validation dan sanitization
- Rate limiting untuk API endpoints
- SQL injection protection dengan Sequelize ORM

## Deployment

Aplikasi dapat di-deploy menggunakan:
- **Frontend**: Vercel, Netlify, atau Railway
- **Backend**: Railway, Render, atau Heroku
- **Database**: Supabase PostgreSQL atau Railway PostgreSQL

---

**Status**: Production Ready  
**Tahun Pengembangan**: 2026  
**Tipe Proyek**: Personal Project / Portfolio
