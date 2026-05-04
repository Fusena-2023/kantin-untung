-- ============================================================
-- 🔐 KANTIN UNTUNG — RLS SECURITY SETUP
-- Jalankan di Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- ============================================================
-- STEP 1: AKTIFKAN RLS DI SEMUA TABEL PUBLIC
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plate_counts ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- STEP 2: POLICIES UNTUK TABEL 'users'
-- Service role (backend Express.js) = full access
-- Authenticated (Supabase client) = read own data only
-- Anon = no access (default deny oleh RLS)
-- ============================================================

CREATE POLICY "service_role_users_all"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_users_select_own"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id::text = auth.uid()::text);


-- ============================================================
-- STEP 3: POLICIES UNTUK TABEL 'transactions'
-- ============================================================

CREATE POLICY "service_role_transactions_all"
  ON public.transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_transactions_select_own"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);


-- ============================================================
-- STEP 4: POLICIES UNTUK TABEL 'roles'
-- ============================================================

CREATE POLICY "service_role_roles_all"
  ON public.roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Roles adalah data referensi, semua authenticated user boleh baca
CREATE POLICY "authenticated_roles_select"
  ON public.roles
  FOR SELECT
  TO authenticated
  USING (true);


-- ============================================================
-- STEP 5: POLICIES UNTUK TABEL 'categories'
-- ============================================================

CREATE POLICY "service_role_categories_all"
  ON public.categories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Categories adalah data referensi, semua authenticated user boleh baca
CREATE POLICY "authenticated_categories_select"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (true);


-- ============================================================
-- STEP 6: POLICIES UNTUK TABEL 'plate_counts'
-- ============================================================

CREATE POLICY "service_role_plate_counts_all"
  ON public.plate_counts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_plate_counts_select_own"
  ON public.plate_counts
  FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);


-- ============================================================
-- STEP 7: FIX SENSITIVE COLUMNS EXPOSED
-- Cabut akses langsung dari anon/authenticated ke tabel sensitif
-- (Semua akses melalui backend Express.js via service_role)
-- ============================================================

-- Cabut akses password column
REVOKE SELECT (password) ON public.users FROM anon;
REVOKE SELECT (password) ON public.users FROM authenticated;

-- Cabut akses penuh dari anon ke semua tabel sensitif
REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.transactions FROM anon;
REVOKE ALL ON public.plate_counts FROM anon;


-- ============================================================
-- STEP 8: VERIFIKASI — Jalankan query ini untuk memastikan
-- ============================================================

SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'transactions', 'roles', 'categories', 'plate_counts')
ORDER BY tablename;

-- Hasil yang diharapkan:
-- | schemaname | tablename     | rowsecurity |
-- |------------|---------------|-------------|
-- | public     | categories    | true        |
-- | public     | plate_counts  | true        |
-- | public     | roles         | true        |
-- | public     | transactions  | true        |
-- | public     | users         | true        |
