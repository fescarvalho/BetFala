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
  const [startVoiceImmediately, setStartVoiceImmediately] = useState(false);
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
      {/* Sidebar - Passando modo dinâmico */}
      <Sidebar 
        mobileOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        isMockMode={isMockMode} 
      />

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col md:ml-[240px] w-full max-w-[100vw]">
        <Header 
          onNovaAposta={() => {
            setStartVoiceImmediately(false);
            setShowForm(true);
          }} 
          onMenuToggle={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 p-6 md:p-8 pb-32">
          {/* Header Interno do Dashboard */}
          <div className="mb-8 mt-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Visão Geral
            </h1>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-1.5 font-medium">
              Acompanhe o desempenho consolidado da sua banca de apostas
            </p>
          </div>

          {/* Banner modo mock */}
          {isMockMode && (
            <div className="bg-[rgba(255,209,102,0.03)] border border-[rgba(255,209,102,0.15)] rounded-2xl p-4 mb-6 flex items-center gap-3 text-xs text-[var(--gold)]">
              <span>⚠️</span>
              <span className="leading-relaxed">
                Você está visualizando a dashboard em <strong>modo de demonstração</strong> com dados fictícios. Configure a variável <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-[10px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no seu arquivo <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-[10px]">.env.local</code> para carregar dados reais.
              </span>
            </div>
          )}

          {/* KPIs */}
          <section className="mb-8">
            <KpiCards kpis={kpis} />
          </section>

          {/* Gráficos */}
          <section className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 mb-8">
            <BancaLineChart dados={evolucao} />
            <StatusPieChart kpis={kpis} />
          </section>

          {/* Filtros */}
          <section className="mb-5">
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
        <footer className="px-6 md:px-8 py-4 border-t border-[var(--border)] flex items-center justify-between mt-auto bg-[var(--bg-base)]/30">
          <span className="text-[10px] md:text-xs text-[var(--text-muted)] font-semibold tracking-wider uppercase">
            BetFala © {new Date().getFullYear()} — Gestão de Banca de Apostas
          </span>
          <span className="text-[10px] md:text-xs text-[var(--text-muted)] font-semibold tracking-wider uppercase">
            {apostas.length} {apostas.length === 1 ? 'aposta registrada' : 'apostas registradas'}
          </span>
        </footer>
      </div>

      {/* Painel Flutuante de Ações Rápidas (FAB) */}
      <div className="fixed bottom-6 right-6 md:right-8 z-40 flex items-center gap-2.5 p-1.5 rounded-2xl bg-[rgba(14,22,40,0.85)] border border-[rgba(255,255,255,0.08)] shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-md">
        {/* Inserção por Voz */}
        <button
          onClick={() => {
            setStartVoiceImmediately(true);
            setShowForm(true);
          }}
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--green-neon)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(0,255,153,0.18)] transition-all cursor-pointer group"
          title="Inserir por comando de voz"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-105 transition-transform">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" x2="12" y1="19" y2="22"/>
          </svg>
        </button>

        {/* Adicionar Manual */}
        <button
          onClick={() => {
            setStartVoiceImmediately(false);
            setShowForm(true);
          }}
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-[var(--green-neon)] to-[var(--green-dim)] text-[#050816] hover:shadow-[0_0_20px_rgba(0,255,153,0.35)] hover:scale-105 duration-200 transition-all cursor-pointer"
          title="Nova aposta manual"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" x2="12" y1="5" y2="19"/>
            <line x1="5" x2="19" y1="12" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Modal Nova Aposta */}
      {showForm && (
        <NovaApostaForm
          onSave={inserirAposta}
          onClose={() => setShowForm(false)}
          autoStartVoice={startVoiceImmediately}
        />
      )}
    </div>
  );
}
