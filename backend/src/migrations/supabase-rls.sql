-- ============================================================
-- Supabase Row Level Security (RLS) Setup
-- 
-- Jalankan script ini di: Supabase Dashboard > SQL Editor
-- 
-- KONTEKS APP INI:
-- - Backend menggunakan Express + JWT sendiri (bukan Supabase Auth)
-- - Backend terhubung via service_role key → otomatis bypass RLS
-- - Client TIDAK akses Supabase langsung, selalu lewat Express API
-- 
-- SOLUSI: Enable RLS (deny-all by default untuk anon/PostgREST)
-- Tidak perlu policy tambahan karena service_role sudah bypass RLS
-- ============================================================

-- Enable RLS pada semua tabel
-- (deny-all untuk akses PostgREST langsung; service_role tetap bypass)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plate_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CATATAN PENTING:
-- Setelah ALTER TABLE di atas, tidak ada policy yang dibuat.
-- Ini berarti:
--   ✅ anon/authenticated (PostgREST) → DIBLOKIR (deny-all)
--   ✅ service_role (backend Express) → TETAP BISA AKSES (bypass RLS)
--   ✅ Security warning di Supabase Dashboard → HILANG
-- ============================================================

-- ============================================================
-- Verifikasi: cek status RLS setelah dijalankan
-- Semua kolom rls_enabled harus bernilai 'true'
-- ============================================================
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'plate_counts', 'categories', 'transactions', 'roles')
ORDER BY tablename;
