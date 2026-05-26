'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Mic,
  Plus,
  WalletCards,
} from 'lucide-react';
import { useApostas } from '@/hooks/useApostas';
import { Aposta, ApostaStatus, Banca, FiltrosState } from '@/types/aposta';
import {
  calcularEvolucaoBanca,
  calcularKpis,
  filtrarPorPeriodo,
  formatarMoeda,
} from '@/lib/calculations';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import KpiCards from '@/components/dashboard/KpiCards';
import BancaLineChart from '@/components/dashboard/BancaLineChart';
import StatusPieChart from '@/components/dashboard/StatusPieChart';
import Filters from '@/components/dashboard/Filters';
import ApostasTable from '@/components/dashboard/ApostasTable';
import NovaApostaForm from '@/components/forms/NovaApostaForm';
import BottomNavBar from '@/components/layout/BottomNavBar';

function calcularSaldoBanca(banca: Banca | null, bancas: Banca[], apostas: Aposta[]) {
  if (!banca) return 0;
  const defaultBancaId = bancas[0]?.id;
  const bancaBets = apostas.filter(
    (aposta) => aposta.banca_id === banca.id || (!aposta.banca_id && banca.id === defaultBancaId)
  );

  const lucroGreens = bancaBets
    .filter((aposta) => aposta.status === 'Green')
    .reduce((acc, aposta) => acc + aposta.stake * (aposta.odd - 1), 0);
  const prejuizoReds = bancaBets
    .filter((aposta) => aposta.status === 'Red')
    .reduce((acc, aposta) => acc + aposta.stake, 0);

  return banca.saldo_inicial + lucroGreens - prejuizoReds;
}

export default function DashboardPage() {
  const {
    apostas,
    bancas,
    activeBanca,
    loading,
    error: dbError,
    fetchApostas,
    inserirAposta,
    atualizarAposta,
    excluirAposta,
    inserirBanca,
    setActiveBanca,
    isMockMode,
  } = useApostas();

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

  const apostasDaBanca = useMemo(() => {
    if (!activeBanca) return [];
    const defaultBancaId = bancas[0]?.id;
    return apostas.filter(
      (aposta) =>
        aposta.banca_id === activeBanca.id ||
        (!aposta.banca_id && activeBanca.id === defaultBancaId)
    );
  }, [apostas, activeBanca, bancas]);

  const activeBancaBalance = useMemo(
    () => calcularSaldoBanca(activeBanca, bancas, apostas),
    [activeBanca, bancas, apostas]
  );

  const apostasFiltradas = useMemo(() => {
    let resultado = filtrarPorPeriodo(
      apostasDaBanca,
      filtros.periodo,
      filtros.dataInicio,
      filtros.dataFim
    );

    if (filtros.busca.trim()) {
      const q = filtros.busca.toLowerCase();
      resultado = resultado.filter(
        (aposta) =>
          aposta.times_apostados.toLowerCase().includes(q) ||
          aposta.detalhe_aposta?.toLowerCase().includes(q)
      );
    }

    return resultado;
  }, [apostasDaBanca, filtros]);

  const kpis = useMemo(() => calcularKpis(apostasFiltradas), [apostasFiltradas]);
  const evolucao = useMemo(
    () => calcularEvolucaoBanca(apostasFiltradas, activeBanca?.saldo_inicial || 0),
    [apostasFiltradas, activeBanca]
  );

  const handleStatusChange = async (id: string, status: ApostaStatus) => {
    return await atualizarAposta({ id, status });
  };

  const openManualForm = () => {
    setStartVoiceImmediately(false);
    setShowForm(true);
  };

  const openVoiceForm = () => {
    setStartVoiceImmediately(true);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen w-full bg-[#080b12] text-white">
      <Sidebar
        mobileOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isMockMode={isMockMode}
        onNovaAposta={openManualForm}
        bancas={bancas}
        activeBanca={activeBanca}
        onSelectBanca={setActiveBanca}
        onAddBanca={inserirBanca}
        bets={apostas}
      />

      <div className="min-h-screen md:pl-[240px]">
        <Header
          onNovaAposta={openManualForm}
          onMenuToggle={() => setIsMobileMenuOpen(true)}
          activeBancaNome={activeBanca?.nome || 'Sem banca'}
          activeBancaSaldo={activeBancaBalance}
        />

        <main className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-7 pb-[420px] pt-6 min-[390px]:px-8 md:gap-6 md:px-8 md:pb-10 md:pt-8">
          <section className="md:hidden">
            <div className="rounded-[24px] border border-white/[0.08] bg-[#111722] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.28)]">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8290a5]">
                  Saldo atual
                </p>
                <h1 className="mt-2 truncate text-[20px] font-extrabold leading-tight text-white">
                  {activeBanca?.nome || 'Sua banca'}
                </h1>
                <p className="mt-3 font-mono text-[30px] font-black leading-none text-[#60ff99]">
                  {formatarMoeda(activeBancaBalance)}
                </p>
                <p className="mt-2 text-xs font-medium text-[#8a94a6]">
                  {apostasDaBanca.length} apostas nesta banca
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <button
                  onClick={openManualForm}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#00ff88] text-sm font-black text-[#04110c] active:scale-[0.98]"
                >
                  <Plus size={17} strokeWidth={3} />
                  Nova aposta
                </button>
                <button
                  onClick={openVoiceForm}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#00ff88]/20 bg-[#00ff88]/10 text-sm font-bold text-[#60ff99] active:scale-[0.98]"
                >
                  <Mic size={17} />
                  Voz
                </button>
              </div>
            </div>
          </section>

          <section className="hidden items-end justify-between gap-6 md:flex">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#00ff88]">
                BetFala
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
                Visao Geral
              </h1>
              <p className="mt-1 text-sm font-medium text-[#8a94a6]">
                Acompanhe banca, desempenho e historico com dados do banco.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={openVoiceForm}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm font-bold text-[#b9cbb9] transition hover:border-[#00ff88]/30 hover:text-white"
              >
                <Mic size={16} />
                Entrada por voz
              </button>
              <button
                onClick={openManualForm}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#00ff88] px-4 text-sm font-black text-[#04110c] shadow-[0_12px_30px_rgba(0,255,136,0.18)] transition hover:bg-[#00e479]"
              >
                <Plus size={17} strokeWidth={3} />
                Nova aposta
              </button>
            </div>
          </section>

          <section className="md:hidden">
            <div className="-mx-7 flex gap-2 overflow-x-auto px-7 pb-1 min-[390px]:-mx-8 min-[390px]:px-8">
              {bancas.map((banca) => {
                const isActive = activeBanca?.id === banca.id;
                const saldo = calcularSaldoBanca(banca, bancas, apostas);
                return (
                  <button
                    key={banca.id}
                    onClick={() => setActiveBanca(banca.id)}
                    className={`min-w-[176px] rounded-2xl border p-3.5 text-left transition ${
                      isActive
                        ? 'border-[#00ff88]/30 bg-[#00ff88]/10'
                        : 'border-white/[0.06] bg-white/[0.025]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <WalletCards size={15} className={isActive ? 'text-[#60ff99]' : 'text-[#7f8ca3]'} />
                      <span className="truncate text-xs font-bold text-white">{banca.nome}</span>
                    </div>
                    <p className="mt-2 font-mono text-sm font-black text-[#60ff99]">
                      {formatarMoeda(saldo)}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {isMockMode && (
            <div className="flex gap-3 rounded-2xl border border-[#ffd166]/20 bg-[#ffd166]/[0.06] p-4 text-xs leading-relaxed text-[#ffd166]">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>
                Modo demonstracao ativo. Configure o Supabase em <code>.env.local</code> e rode as migrations para carregar dados reais.
              </span>
            </div>
          )}

          {dbError && (
            <div className="flex gap-3 rounded-2xl border border-[#ff4d6d]/20 bg-[#ff4d6d]/[0.07] p-4 text-xs leading-relaxed text-[#ff9aae]">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{dbError}</span>
            </div>
          )}

          <section className="grid gap-5 lg:grid-cols-[1fr_280px]">
            <div className="flex flex-col gap-5">
              <KpiCards kpis={kpis} />
              <div id="graficos-section">
                <BancaLineChart dados={evolucao} />
              </div>
            </div>
            <div className="hidden lg:block">
              <StatusPieChart kpis={kpis} />
            </div>
          </section>

          <section className="rounded-[22px] border border-white/[0.06] bg-[#111722]/80 p-4.5 md:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity size={16} className="text-[#60ff99]" />
              <h2 className="text-sm font-black uppercase tracking-[0.12em] text-white">
                Apostas
              </h2>
              {loading && <span className="ml-auto text-xs font-semibold text-[#8a94a6]">Atualizando...</span>}
            </div>
            <Filters filtros={filtros} onChange={setFiltros} />
          </section>

          <section id="apostas-section" className="scroll-mt-24 pb-8">
            <ApostasTable
              apostas={apostasFiltradas}
              onStatusChange={handleStatusChange}
              onDelete={excluirAposta}
            />
          </section>
        </main>
      </div>

      <BottomNavBar onNovaAposta={openManualForm} />

      {showForm && (
        <NovaApostaForm
          onSave={inserirAposta}
          onClose={() => setShowForm(false)}
          autoStartVoice={startVoiceImmediately}
          error={dbError}
          bancas={bancas}
          defaultBancaId={activeBanca?.id}
        />
      )}
    </div>
  );
}
