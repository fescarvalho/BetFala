'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Aposta, ApostaInsert, ApostaUpdate } from '@/types/aposta';
import { MOCK_APOSTAS } from '@/lib/mock-data';

const USE_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'SUA_ANON_KEY_AQUI';

// ============================================================
// Hook de CRUD de apostas — suporta modo mock e Supabase real
// ============================================================
export function useApostas() {
  const [apostas, setApostas] = useState<Aposta[]>(MOCK_APOSTAS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = !USE_MOCK ? createClient() : null;

  // --- Buscar apostas ---
  const fetchApostas = useCallback(async () => {
    if (USE_MOCK) {
      setApostas(MOCK_APOSTAS);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase!
        .from('apostas')
        .select('*')
        .order('data_criacao', { ascending: false });

      if (err) throw err;
      setApostas(data as Aposta[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao buscar apostas');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // --- Inserir aposta ---
  const inserirAposta = useCallback(
    async (nova: ApostaInsert): Promise<boolean> => {
      if (USE_MOCK) {
        const mockAposta: Aposta = {
          id: `mock-${Date.now()}`,
          user_id: 'mock-user',
          data_criacao: new Date().toISOString(),
          status: 'Aberta',
          ...nova,
        };
        setApostas((prev) => [mockAposta, ...prev]);
        return true;
      }
      setLoading(true);
      setError(null);
      try {
        const {
          data: { user },
        } = await supabase!.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error: err } = await supabase!
          .from('apostas')
          .insert({ ...nova, user_id: user.id, status: 'Aberta' })
          .select()
          .single();

        if (err) throw err;
        setApostas((prev) => [data as Aposta, ...prev]);
        return true;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erro ao inserir aposta');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // --- Atualizar status ---
  const atualizarAposta = useCallback(
    async (update: ApostaUpdate): Promise<boolean> => {
      if (USE_MOCK) {
        setApostas((prev) =>
          prev.map((a) =>
            a.id === update.id ? { ...a, ...update } : a
          )
        );
        return true;
      }
      setLoading(true);
      setError(null);
      try {
        const { id, ...campos } = update;
        const { error: err } = await supabase!
          .from('apostas')
          .update(campos)
          .eq('id', id);

        if (err) throw err;
        setApostas((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...campos } : a))
        );
        return true;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erro ao atualizar aposta');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // --- Excluir aposta ---
  const excluirAposta = useCallback(
    async (id: string): Promise<boolean> => {
      if (USE_MOCK) {
        setApostas((prev) => prev.filter((a) => a.id !== id));
        return true;
      }
      setLoading(true);
      setError(null);
      try {
        const { error: err } = await supabase!
          .from('apostas')
          .delete()
          .eq('id', id);

        if (err) throw err;
        setApostas((prev) => prev.filter((a) => a.id !== id));
        return true;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erro ao excluir aposta');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  return {
    apostas,
    loading,
    error,
    fetchApostas,
    inserirAposta,
    atualizarAposta,
    excluirAposta,
    isMockMode: USE_MOCK,
  };
}
