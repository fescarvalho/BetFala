-- ============================================================
-- BetFala — Migration 001: Tabela apostas + RLS
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Criar tabela apostas
CREATE TABLE IF NOT EXISTS public.apostas (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data_criacao     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  times_apostados  TEXT NOT NULL,
  detalhe_aposta   TEXT,
  odd              NUMERIC(10,2) NOT NULL CHECK (odd > 1),
  stake            NUMERIC(10,2) NOT NULL CHECK (stake > 0),
  status           TEXT NOT NULL DEFAULT 'Aberta'
                     CHECK (status IN ('Aberta','Green','Red','Void'))
);

-- 2. Habilitar Row Level Security
ALTER TABLE public.apostas ENABLE ROW LEVEL SECURITY;

-- 3. Política SELECT — usuário vê apenas suas apostas
CREATE POLICY "apostas_select_own"
  ON public.apostas
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Política INSERT — usuário só insere com user_id = seu UID
CREATE POLICY "apostas_insert_own"
  ON public.apostas
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Política UPDATE — usuário só atualiza as suas
CREATE POLICY "apostas_update_own"
  ON public.apostas
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Política DELETE — usuário só exclui as suas
CREATE POLICY "apostas_delete_own"
  ON public.apostas
  FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Índice para ordenação por data (performance)
CREATE INDEX IF NOT EXISTS apostas_user_data_idx
  ON public.apostas (user_id, data_criacao DESC);

-- 8. Comentários
COMMENT ON TABLE public.apostas IS 'Registro de apostas esportivas por usuário';
COMMENT ON COLUMN public.apostas.status IS 'Aberta | Green | Red | Void';
