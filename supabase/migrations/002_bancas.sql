-- ============================================================
-- BetFala - Migration 002: Bancas + relacionamento com apostas
-- Execute depois da migration 001 no SQL Editor do Supabase.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bancas (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome           TEXT NOT NULL,
  saldo_inicial  NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (saldo_inicial >= 0),
  data_criacao   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.bancas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bancas_select_own" ON public.bancas;
CREATE POLICY "bancas_select_own"
  ON public.bancas
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bancas_insert_own" ON public.bancas;
CREATE POLICY "bancas_insert_own"
  ON public.bancas
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bancas_update_own" ON public.bancas;
CREATE POLICY "bancas_update_own"
  ON public.bancas
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bancas_delete_own" ON public.bancas;
CREATE POLICY "bancas_delete_own"
  ON public.bancas
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS bancas_user_data_idx
  ON public.bancas (user_id, data_criacao DESC);

ALTER TABLE public.apostas
  ADD COLUMN IF NOT EXISTS banca_id UUID REFERENCES public.bancas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS apostas_banca_idx
  ON public.apostas (banca_id);

COMMENT ON TABLE public.bancas IS 'Bancas de apostas por usuario';
COMMENT ON COLUMN public.apostas.banca_id IS 'Banca associada a aposta';
