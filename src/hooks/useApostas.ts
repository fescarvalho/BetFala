'use client';

import { startTransition, useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Banca, Aposta, ApostaInsert, ApostaUpdate, Transacao, TipoTransacao } from '@/types/aposta';
import { MOCK_APOSTAS } from '@/lib/mock-data';

const USE_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'SUA_ANON_KEY_AQUI';

const normalizeBanca = (banca: Banca): Banca => ({
  ...banca,
  saldo_inicial: Number(banca.saldo_inicial),
});

const normalizeAposta = (aposta: Aposta): Aposta => ({
  ...aposta,
  odd: Number(aposta.odd),
  stake: Number(aposta.stake),
});

const normalizeTransacao = (t: Transacao): Transacao => ({
  ...t,
  valor: Number(t.valor),
});

// ============================================================
// Hook de CRUD de apostas e bancas — suporta modo mock e Supabase
// ============================================================
export function useApostas() {
  const [bancas, setBancas] = useState<Banca[]>([]);
  const [activeBancaId, setActiveBancaId] = useState<string>('');
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('[BetFala] Modo Mock ativo:', USE_MOCK);

  const supabase = !USE_MOCK ? createClient() : null;

  // --- Inicialização e persistência no modo Mock ---
  useEffect(() => {
    if (USE_MOCK) {
      // 1. Carregar bancas
      const savedBancas = localStorage.getItem('betfala_bancas');
      let loadedBancas: Banca[] = [];
      if (savedBancas) {
        loadedBancas = JSON.parse(savedBancas);
      } else {
        loadedBancas = [
          {
            id: 'banca-1',
            user_id: 'mock-user',
            nome: 'Banca Principal',
            saldo_inicial: 1000,
            data_criacao: new Date(Date.now() - 30 * 86400000).toISOString(),
          },
          {
            id: 'banca-2',
            user_id: 'mock-user',
            nome: 'Banca Alavancagem',
            saldo_inicial: 500,
            data_criacao: new Date(Date.now() - 10 * 86400000).toISOString(),
          },
        ];
        localStorage.setItem('betfala_bancas', JSON.stringify(loadedBancas));
      }
      // 2. Carregar activeBancaId
      const savedActiveId = localStorage.getItem('betfala_active_banca_id');
      const activeId = savedActiveId && loadedBancas.some((b) => b.id === savedActiveId)
        ? savedActiveId
        : loadedBancas[0]?.id || '';
      localStorage.setItem('betfala_active_banca_id', activeId);

      // 3. Carregar apostas
      const savedApostas = localStorage.getItem('betfala_apostas');
      let loadedApostas: Aposta[];
      if (savedApostas) {
        loadedApostas = JSON.parse(savedApostas);
      } else {
        loadedApostas = MOCK_APOSTAS.map((a) => ({
          ...a,
          banca_id: a.banca_id || 'banca-1',
        }));
        localStorage.setItem('betfala_apostas', JSON.stringify(loadedApostas));
      }

      // 4. Carregar transacoes
      const savedTransacoes = localStorage.getItem('betfala_transacoes');
      let loadedTransacoes: Transacao[] = [];
      if (savedTransacoes) {
        loadedTransacoes = JSON.parse(savedTransacoes);
      } else {
        localStorage.setItem('betfala_transacoes', JSON.stringify([]));
      }

      startTransition(() => {
        setBancas(loadedBancas);
        setActiveBancaId(activeId);
        setApostas(loadedApostas);
        setTransacoes(loadedTransacoes);
      });
    }
  }, []);

  // --- Buscar bancas (Supabase) ---
  const fetchBancas = useCallback(async () => {
    if (USE_MOCK) return;
    try {
      const { data, error: err } = await supabase!
        .from('bancas')
        .select('*')
        .order('data_criacao', { ascending: true });

      if (err) {
        console.warn('Tabela bancas não encontrada no Supabase. Usando fallback local.', err);
        // Fallback local
        const local = localStorage.getItem('betfala_bancas');
        const fallback = local ? JSON.parse(local) : [
          {
            id: 'banca-1',
            user_id: 'supabase-fallback',
            nome: 'Banca Principal',
            saldo_inicial: 1000,
            data_criacao: new Date().toISOString(),
          }
        ];
        setBancas(fallback);
        setActiveBancaId((prev) => prev && fallback.some((b: Banca) => b.id === prev) ? prev : fallback[0].id);
        return;
      }
      if (data && data.length > 0) {
        const normalized = (data as Banca[]).map(normalizeBanca);
        setBancas(normalized);
        setActiveBancaId((prev) => prev && normalized.some((b) => b.id === prev) ? prev : normalized[0].id);
        return;
      }

      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) return;

      const { data: created, error: createErr } = await supabase!
        .from('bancas')
        .insert({
          user_id: user.id,
          nome: 'Banca Principal',
          saldo_inicial: 1000,
        })
        .select()
        .single();

      if (createErr) throw createErr;
      const banca = normalizeBanca(created as Banca);
      setBancas([banca]);
      setActiveBancaId(banca.id);
    } catch (e) {
      console.error('Erro ao buscar bancas:', e);
    }
  }, [supabase]);

  // --- Buscar apostas ---
  const fetchApostas = useCallback(async () => {
    if (USE_MOCK) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase!
        .from('apostas')
        .select('*')
        .order('data_criacao', { ascending: false });

      if (err) throw err;
      setApostas((data as Aposta[]).map(normalizeAposta));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao buscar apostas');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // --- Buscar Transações ---
  const fetchTransacoes = useCallback(async () => {
    if (USE_MOCK) return;
    try {
      const { data, error: err } = await supabase!
        .from('transacoes')
        .select('*')
        .order('data_criacao', { ascending: true });

      if (err) throw err;
      setTransacoes((data as Transacao[]).map(normalizeTransacao));
    } catch (e: unknown) {
      console.warn('Erro ao buscar transacoes ou tabela não existe:', e);
    }
  }, [supabase]);

  // Carregar dados iniciais para o Supabase
  useEffect(() => {
    if (!USE_MOCK) {
      queueMicrotask(() => {
        fetchBancas().then(() => { fetchApostas(); fetchTransacoes(); });
      });
    }
  }, [fetchBancas, fetchApostas, fetchTransacoes]);

  // --- Inserir banca ---
  const inserirBanca = useCallback(
    async (nome: string, saldoInicial: number): Promise<boolean> => {
      const novaBanca = {
        nome,
        saldo_inicial: saldoInicial,
        data_criacao: new Date().toISOString(),
      };

      if (USE_MOCK) {
        const bancaCompleta: Banca = {
          id: `banca-${Date.now()}`,
          user_id: 'mock-user',
          ...novaBanca,
        };
        const updated = [...bancas, bancaCompleta];
        setBancas(updated);
        localStorage.setItem('betfala_bancas', JSON.stringify(updated));
        setActiveBancaId(bancaCompleta.id);
        localStorage.setItem('betfala_active_banca_id', bancaCompleta.id);
        return true;
      }

      setLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase!.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error: err } = await supabase!
          .from('bancas')
          .insert({ ...novaBanca, user_id: user.id })
          .select()
          .single();

        if (err) {
          console.warn('Falha ao salvar banca no Supabase. Salvando localmente.', err);
          const bancaCompleta: Banca = {
            id: `banca-${Date.now()}`,
            user_id: user.id,
            ...novaBanca,
          };
          const updated = [...bancas, bancaCompleta];
          setBancas(updated);
          localStorage.setItem('betfala_bancas', JSON.stringify(updated));
          setActiveBancaId(bancaCompleta.id);
          return true;
        }

        const bancaReal = normalizeBanca(data as Banca);
        setBancas((prev) => [...prev, bancaReal]);
        setActiveBancaId(bancaReal.id);
        return true;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erro ao criar banca');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [supabase, bancas]
  );

  // --- Atualizar banca ---
  const atualizarBanca = useCallback(
    async (id: string, nome: string, saldoInicial: number): Promise<boolean> => {
      if (USE_MOCK || id.startsWith('banca-')) {
        const updated = bancas.map((b) =>
          b.id === id ? { ...b, nome, saldo_inicial: saldoInicial } : b
        );
        setBancas(updated);
        localStorage.setItem('betfala_bancas', JSON.stringify(updated));
        return true;
      }
      setLoading(true);
      setError(null);
      try {
        const { error: err } = await supabase!
          .from('bancas')
          .update({ nome, saldo_inicial: saldoInicial })
          .eq('id', id);
        if (err) throw err;
        setBancas((prev) =>
          prev.map((b) => (b.id === id ? { ...b, nome, saldo_inicial: saldoInicial } : b))
        );
        return true;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erro ao atualizar banca');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [supabase, bancas]
  );

  // --- Excluir banca ---
  const excluirBanca = useCallback(
    async (id: string): Promise<boolean> => {
      if (bancas.length <= 1) {
        setError('Não é possível excluir a única banca.');
        return false;
      }
      if (USE_MOCK || id.startsWith('banca-')) {
        const updated = bancas.filter((b) => b.id !== id);
        setBancas(updated);
        localStorage.setItem('betfala_bancas', JSON.stringify(updated));
        // Se a banca excluída era a ativa, seleciona a primeira restante
        if (activeBancaId === id) {
          const newActive = updated[0]?.id || '';
          setActiveBancaId(newActive);
          localStorage.setItem('betfala_active_banca_id', newActive);
        }
        return true;
      }
      setLoading(true);
      setError(null);
      try {
        const { error: err } = await supabase!
          .from('bancas')
          .delete()
          .eq('id', id);
        if (err) throw err;
        const updated = bancas.filter((b) => b.id !== id);
        setBancas(updated);
        if (activeBancaId === id) {
          setActiveBancaId(updated[0]?.id || '');
        }
        return true;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erro ao excluir banca');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [supabase, bancas, activeBancaId]
  );

  // --- Inserir aposta ---
  const inserirAposta = useCallback(
    async (nova: ApostaInsert): Promise<boolean> => {
      const targetBancaId = nova.banca_id || activeBancaId;

      if (USE_MOCK) {
        const mockAposta: Aposta = {
          id: `mock-${Date.now()}`,
          user_id: 'mock-user',
          data_criacao: new Date().toISOString(),
          status: 'Aberta',
          ...nova,
          banca_id: targetBancaId,
        };
        const updated = [mockAposta, ...apostas];
        setApostas(updated);
        localStorage.setItem('betfala_apostas', JSON.stringify(updated));
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
          .insert({ ...nova, user_id: user.id, status: 'Aberta', banca_id: targetBancaId })
          .select()
          .single();

        if (err) throw err;
        setApostas((prev) => [normalizeAposta(data as Aposta), ...prev]);
        return true;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erro ao inserir aposta');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [supabase, activeBancaId, apostas]
  );

  // --- Atualizar status ---
  const atualizarAposta = useCallback(
    async (update: ApostaUpdate): Promise<boolean> => {
      if (USE_MOCK) {
        const updated = apostas.map((a) =>
          a.id === update.id ? { ...a, ...update } : a
        );
        setApostas(updated);
        localStorage.setItem('betfala_apostas', JSON.stringify(updated));
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
    [supabase, apostas]
  );

  // --- Excluir aposta ---
  const excluirAposta = useCallback(
    async (id: string): Promise<boolean> => {
      if (USE_MOCK) {
        const updated = apostas.filter((a) => a.id !== id);
        setApostas(updated);
        localStorage.setItem('betfala_apostas', JSON.stringify(updated));
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
    [supabase, apostas]
  );

  // --- Mudar de banca ---
  const setActiveBanca = useCallback((id: string) => {
    setActiveBancaId(id);
    if (USE_MOCK) {
      localStorage.setItem('betfala_active_banca_id', id);
    }
  }, []);

  // --- Inserir Transação ---
  const inserirTransacao = useCallback(
    async (banca_id: string, tipo: TipoTransacao, valor: number): Promise<boolean> => {
      const nova = { banca_id, tipo, valor, data_criacao: new Date().toISOString() };

      if (USE_MOCK) {
        const transacaoCompleta: Transacao = {
          id: `transacao-${Date.now()}`,
          user_id: 'mock-user',
          ...nova,
        };
        const updated = [...transacoes, transacaoCompleta];
        setTransacoes(updated);
        localStorage.setItem('betfala_transacoes', JSON.stringify(updated));
        return true;
      }
      setLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase!.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error: err } = await supabase!
          .from('transacoes')
          .insert({ ...nova, user_id: user.id })
          .select()
          .single();

        if (err) throw err;
        setTransacoes((prev) => [...prev, normalizeTransacao(data as Transacao)]);
        return true;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erro ao inserir transação');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [supabase, transacoes]
  );

  return {
    apostas,
    bancas,
    activeBanca: bancas.find((b) => b.id === activeBancaId) || null,
    loading,
    error,
    fetchApostas,
    inserirAposta,
    atualizarAposta,
    excluirAposta,
    inserirBanca,
    atualizarBanca,
    excluirBanca,
    setActiveBanca,
    transacoes,
    inserirTransacao,
    isMockMode: USE_MOCK,
  };
}
