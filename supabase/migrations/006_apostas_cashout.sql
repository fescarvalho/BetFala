-- ============================================================
-- BetFala — Migration 006: Adicionar campo valor_cashout e atualizar status
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Adicionar o novo campo valor_cashout
ALTER TABLE public.apostas
ADD COLUMN IF NOT EXISTS valor_cashout NUMERIC(10,2);

-- 2. Atualizar a restrição do campo status para permitir 'Cashout'
-- A restrição do script 001 foi criada sem nome, o padrão gerado pelo Postgres costuma ser 'apostas_status_check'.
ALTER TABLE public.apostas DROP CONSTRAINT IF EXISTS apostas_status_check;

-- Adicionar novamente a restrição com o novo status Cashout
ALTER TABLE public.apostas
ADD CONSTRAINT apostas_status_check CHECK (status IN ('Aberta', 'Green', 'Red', 'Void', 'Cashout'));

-- 3. Atualizar comentário
COMMENT ON COLUMN public.apostas.status IS 'Aberta | Green | Red | Void | Cashout';
