-- ==============================================================================
-- Migração 003: Tabela de Transações (Depósitos e Saques)
-- ==============================================================================

-- 1. Cria a tabela de transações
CREATE TABLE IF NOT EXISTS public.transacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banca_id UUID NOT NULL REFERENCES public.bancas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('deposito', 'saque')),
  valor NUMERIC NOT NULL CHECK (valor > 0),
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilita RLS (Row Level Security)
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;

-- 3. Cria as políticas de segurança (Apenas o próprio usuário pode ver e editar suas transações)
CREATE POLICY "Usuários podem ver suas próprias transações"
ON public.transacoes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias transações"
ON public.transacoes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias transações"
ON public.transacoes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias transações"
ON public.transacoes FOR DELETE
USING (auth.uid() = user_id);
