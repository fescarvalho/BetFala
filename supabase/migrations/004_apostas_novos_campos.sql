-- ============================================================
-- BetFala - Migration 004: Novos campos em apostas
-- Execute no SQL Editor do Supabase para adicionar as colunas
-- is_freebet e bonus_percent
-- ============================================================

ALTER TABLE public.apostas
  ADD COLUMN IF NOT EXISTS is_freebet BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS bonus_percent NUMERIC(10,2);

COMMENT ON COLUMN public.apostas.is_freebet IS 'Indica se a aposta foi feita como Freebet';
COMMENT ON COLUMN public.apostas.bonus_percent IS 'Percentual de bônus aplicado aos lucros da aposta';
