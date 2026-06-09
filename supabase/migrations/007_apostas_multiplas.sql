-- ============================================================
-- BetFala — Migration 007: Adicionar campos para Apostas Múltiplas
-- Execute este script no SQL Editor do Supabase
-- ============================================================

ALTER TABLE public.apostas
ADD COLUMN IF NOT EXISTS tipo_aposta TEXT DEFAULT 'Simples',
ADD COLUMN IF NOT EXISTS detalhes_selecoes JSONB,
ADD COLUMN IF NOT EXISTS odd_total NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS valor_apostado NUMERIC(10,2);

-- Atualiza a constraint de status caso 'Cashout' não esteja nela (apenas por segurança)
-- Caso já exista no 006_apostas_cashout.sql, não há problema.

COMMENT ON COLUMN public.apostas.tipo_aposta IS 'Simples | Multipla';
COMMENT ON COLUMN public.apostas.detalhes_selecoes IS 'Array JSON com os dados de cada seleção da aposta';
