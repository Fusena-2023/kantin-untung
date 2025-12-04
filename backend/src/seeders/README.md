# User Management Scripts

Script-script untuk mengelola user di database Kantin Untung.

## Script yang Tersedia

### 1. Membuat User Default
```bash
npm run seed:users
# atau
node src/seeders/create-default-users.js
```

**User yang dibuat:**
- **Pemilik**: 
  - Username: `admin`
  - Password: `admin123`
  - Email: `admin@kantin.com`
  - Role: Pemilik (akses penuh)

- **Pegawai 1**:
  - Username: `pegawai1`
  - Password: `pegawai123`
  - Email: `pegawai1@kantin.com`
  - Role: Pegawai (akses terbatas)

- **Pegawai 2**:
  - Username: `pegawai2`
  - Password: `pegawai123`
  - Email: `pegawai2@kantin.com`
  - Role: Pegawai (akses terbatas)

### 2. Melihat Daftar User
```bash
npm run list:users
# atau
node src/seeders/list-users.js
```

Menampilkan semua user yang ada di database beserta detail lengkapnya.

### 3. Menghapus Semua User
```bash
npm run delete:users
# atau
node src/seeders/delete-all-users.js
```

**⚠️ HATI-HATI**: Script ini menghapus SEMUA user dari database. Gunakan dengan bijak!

## Permission Roles

### Pemilik (ID: 1)
- ✅ Lihat semua transaksi
- ✅ Buat transaksi
- ✅ Edit transaksi
- ✅ Hapus transaksi
- ✅ Lihat laporan
- ✅ Kelola user (CRUD)
- ✅ Akses dashboard

### Pegawai (ID: 2)
- ✅ Lihat transaksi sendiri
- ✅ Buat transaksi
- ❌ Edit/hapus transaksi
- ❌ Lihat laporan
- ❌ Kelola user
- ❌ Akses dashboard

## Database Structure

### Roles Table
```sql
id | name     | display_name | permissions
1  | pemilik  | Pemilik      | [full_access_array]
2  | pegawai  | Pegawai      | [limited_access_array]
```

### Users Table
```sql
id | username | email              | full_name            | role_id | is_active
-----|----------|-------------------|---------------------|---------|----------
uuid | admin    | admin@kantin.com  | Administrator Pemilik| 1       | true
uuid | pegawai1 | pegawai1@kantin.com| Pegawai Satu        | 2       | true
uuid | pegawai2 | pegawai2@kantin.com| Pegawai Dua         | 2       | true
```

## Login Testing

Setelah menjalankan seeder, Anda bisa login di:
**Frontend URL**: http://localhost:9001/#/login

**Test Credentials:**
- Pemilik: `admin` / `admin123`
- Pegawai: `pegawai1` / `pegawai123` atau `pegawai2` / `pegawai123`

## Troubleshooting

### Error "User sudah ada"
Script akan otomatis skip user yang sudah ada. Jika ingin membuat ulang, hapus dulu dengan `npm run delete:users`

### Error koneksi database
Pastikan:
1. PostgreSQL running
2. Database `kantin_untung_db` sudah dibuat
3. File `.env` sudah dikonfigurasi dengan benar

### Error permission
Pastikan user PostgreSQL memiliki permission untuk CREATE, INSERT, UPDATE, DELETE pada database.