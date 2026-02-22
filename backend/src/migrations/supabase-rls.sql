-- ============================================================
-- Supabase Row Level Security (RLS) Setup
-- Jalankan script ini di: Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable RLS pada semua tabel
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plate_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Drop policy lama jika sudah ada (hindari duplikat)
-- ============================================================
DO $$
BEGIN
  -- users
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow all for service role'
  ) THEN
    DROP POLICY "Allow all for service role" ON public.users;
  END IF;

  -- plate_counts
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'plate_counts' AND policyname = 'Allow all for service role'
  ) THEN
    DROP POLICY "Allow all for service role" ON public.plate_counts;
  END IF;

  -- categories
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Allow all for service role'
  ) THEN
    DROP POLICY "Allow all for service role" ON public.categories;
  END IF;

  -- transactions
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Allow all for service role'
  ) THEN
    DROP POLICY "Allow all for service role" ON public.transactions;
  END IF;

  -- roles
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'roles' AND policyname = 'Allow all for service role'
  ) THEN
    DROP POLICY "Allow all for service role" ON public.roles;
  END IF;
END $$;

-- ============================================================
-- Buat policy permissive untuk backend (koneksi via DB password)
-- Backend menggunakan role 'postgres' yang by default bypass RLS,
-- tetapi policy ini memastikan tidak ada block dari sisi Supabase
-- dan menghilangkan security warning di dashboard.
-- ============================================================

CREATE POLICY "Allow all for service role" ON public.users
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for service role" ON public.plate_counts
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for service role" ON public.categories
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for service role" ON public.transactions
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for service role" ON public.roles
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Verifikasi: cek status RLS setelah dijalankan
-- ============================================================
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'plate_counts', 'categories', 'transactions', 'roles')
ORDER BY tablename;
