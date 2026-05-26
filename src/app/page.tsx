'use client';

import { useState, useMemo, useEffect } from 'react';
import { useApostas } from '@/hooks/useApostas';
import { ApostaStatus, FiltrosState } from '@/types/aposta';
import {
  calcularKpis,
  calcularEvolucaoBanca,
  filtrarPorPeriodo,
} from '@/lib/calculations';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import KpiCards from '@/components/dashboard/KpiCards';
import BancaLineChart from '@/components/dashboard/BancaLineChart';
import StatusPieChart from '@/components/dashboard/StatusPieChart';
import Filters from '@/components/dashboard/Filters';
import ApostasTable from '@/components/dashboard/ApostasTable';
import NovaApostaForm from '@/components/forms/NovaApostaForm';

export default function DashboardPage() {
  const { apostas, inserirAposta, atualizarAposta, excluirAposta, isMockMode, fetchApostas } =
    useApostas();
  const [showForm, setShowForm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosState>({
    busca: '',
    periodo: 'todos',
  });

  useEffect(() => {
    fetchApostas();
  }, [fetchApostas]);

  // Aplica filtros de período
  const apostasFiltradas = useMemo(() => {
    let resultado = filtrarPorPeriodo(
      apostas,
      filtros.periodo,
      filtros.dataInicio,
      filtros.dataFim
    );

    // Filtro de busca full-text
    if (filtros.busca.trim()) {
      const q = filtros.busca.toLowerCase();
      resultado = resultado.filter(
        (a) =>
          a.times_apostados.toLowerCase().includes(q) ||
          a.detalhe_aposta?.toLowerCase().includes(q)
      );
    }

    return resultado;
  }, [apostas, filtros]);

  // KPIs e gráfico apenas das apostas filtradas
  const kpis = useMemo(() => calcularKpis(apostasFiltradas), [apostasFiltradas]);
  const evolucao = useMemo(
    () => calcularEvolucaoBanca(apostasFiltradas, 0),
    [apostasFiltradas]
  );

  const handleStatusChange = async (id: string, status: ApostaStatus) => {
    return await atualizarAposta({ id, status });
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)]">
      {/* Sidebar */}
      <Sidebar mobileOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col md:ml-[240px] w-full max-w-[100vw]">
        <Header 
          onNovaAposta={() => setShowForm(true)} 
          onMenuToggle={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 md:p-7 pb-24">
          <div className="mb-6 mt-2">
            <h1 className="text-3xl font-black italic tracking-tight uppercase mb-1">Dashboard</h1>
            <p className="text-[var(--text-secondary)] text-sm">Visão geral do seu desempenho nas apostas</p>
          </div>

          {/* Banner modo mock */}
          {isMockMode && (
            <div
              style={{
                background: 'rgba(255,209,102,0.06)',
                border: '1px solid rgba(255,209,102,0.2)',
                borderRadius: 10,
                padding: '10px 16px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '0.8rem',
                color: 'var(--gold)',
              }}
            >
              <span>⚠️</span>
              <span>
                Modo demonstração ativo — dados de exemplo. Configure{' '}
                <code
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    padding: '1px 6px',
                    borderRadius: 4,
                    fontFamily: 'monospace',
                  }}
                >
                  NEXT_PUBLIC_SUPABASE_ANON_KEY
                </code>{' '}
                no <code
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    padding: '1px 6px',
                    borderRadius: 4,
                    fontFamily: 'monospace',
                  }}
                >.env.local</code>{' '}
                para conectar ao Supabase real.
              </span>
            </div>
          )}

          {/* KPIs */}
          <section className="mb-6">
            <KpiCards kpis={kpis} />
          </section>

          {/* Gráficos */}
          <section className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4 mb-6">
            <BancaLineChart dados={evolucao} />
            <StatusPieChart kpis={kpis} />
          </section>

          {/* Filtros */}
          <section className="mb-6">
            <Filters filtros={filtros} onChange={setFiltros} />
          </section>

          {/* Tabela */}
          <section>
            <ApostasTable
              apostas={apostasFiltradas}
              onStatusChange={handleStatusChange}
              onDelete={excluirAposta}
            />
          </section>
        </main>

        {/* Footer */}
        <footer className="px-4 md:px-7 py-4 border-t border-[var(--border)] flex items-center justify-between mt-auto">
          <span className="text-[0.65rem] md:text-[0.72rem] text-[var(--text-muted)]">
            BetFala © {new Date().getFullYear()} — Gestão de Banca de Apostas
          </span>
          <span className="text-[0.65rem] md:text-[0.72rem] text-[var(--text-muted)]">
            {apostas.length} apostas registradas
          </span>
        </footer>
      </div>

      {/* FAB - Floating Action Button (Mobile) */}
      <div className="fixed bottom-6 right-6 flex items-center gap-2 z-50 md:hidden bg-[#0A1C17] p-2 rounded-2xl border border-[rgba(0,255,135,0.1)] shadow-2xl">
        <button 
          onClick={() => setShowForm(true)}
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-[rgba(255,255,255,0.05)] text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
        </button>
        <button 
          onClick={() => setShowForm(true)}
          className="w-14 h-14 flex items-center justify-center rounded-xl bg-[var(--green-neon)] text-[#0A1C17] hover:brightness-110 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
        </button>
      </div>

      {/* Modal nova aposta */}
      {showForm && (
        <NovaApostaForm
          onSave={inserirAposta}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
