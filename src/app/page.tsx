'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronRight,
  Mic,
  Plus,
  TrendingUp,
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
import BancaManagerSheet from '@/components/forms/BancaManagerSheet';
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
    atualizarBanca,
    excluirBanca,
    setActiveBanca,
    isMockMode,
  } = useApostas();

  const [showForm, setShowForm] = useState(false);
  const [showBancaManager, setShowBancaManager] = useState(false);
  const [startVoiceImmediately, setStartVoiceImmediately] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosState>({ busca: '', periodo: 'todos' });

  useEffect(() => { fetchApostas(); }, [fetchApostas]);

  /* balance helper shared with BancaManagerSheet */
  const getBancaBalance = useMemo(() => (banca: Banca) => {
    const defaultBancaId = bancas[0]?.id;
    const bets = apostas.filter(
      (a) => a.banca_id === banca.id || (!a.banca_id && banca.id === defaultBancaId)
    );
    const greens = bets.filter((a) => a.status === 'Green').reduce((s, a) => s + a.stake * (a.odd - 1), 0);
    const reds = bets.filter((a) => a.status === 'Red').reduce((s, a) => s + a.stake, 0);
    return banca.saldo_inicial + greens - reds;
  }, [apostas, bancas]);

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
    let resultado = filtrarPorPeriodo(apostasDaBanca, filtros.periodo, filtros.dataInicio, filtros.dataFim);
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

  const handleStatusChange = async (id: string, status: ApostaStatus) =>
    await atualizarAposta({ id, status });

  const openManualForm = () => { setStartVoiceImmediately(false); setShowForm(true); };
  const openVoiceForm = () => { setStartVoiceImmediately(true); setShowForm(true); };

  return (
    <div style={{ minHeight: '100svh', width: '100%', background: '#050816', color: '#FFFFFF' }}>
      <Sidebar
        mobileOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isMockMode={isMockMode}
        onNovaAposta={openManualForm}
        bancas={bancas}
        activeBanca={activeBanca}
        onSelectBanca={setActiveBanca}
        onManageBancas={() => setShowBancaManager(true)}
        bets={apostas}
      />

      <div style={{ minHeight: '100svh' }} className="md:pl-[240px]">

        {/* ── Sticky Header (mobile) ── */}
        <Header
          onNovaAposta={openManualForm}
          onMenuToggle={() => setIsMobileMenuOpen(true)}
          activeBancaNome={activeBanca?.nome || 'Sem banca'}
          activeBancaSaldo={activeBancaBalance}
        />

        {/* ── Main content ── */}
        <main
          style={{
            maxWidth: '1152px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            paddingLeft: '24px',
            paddingRight: '24px',
            paddingTop: '20px',
            paddingBottom: '140px',
          }}
          className="md:!px-8 md:!pt-8 md:!pb-12 md:!gap-7"
        >

          {/* ══ HERO CARD (mobile) ══ */}
          <section className="md:hidden">
            <div
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '28px',
                padding: '28px 24px',
                background: 'linear-gradient(145deg, #0F172A 0%, #0c1328 100%)',
                boxShadow: '0 4px 32px rgba(0,0,0,0.25)',
              }}
            >
              {/* Glow */}
              <div
                style={{
                  position: 'absolute',
                  right: '-24px',
                  top: '-24px',
                  width: '160px',
                  height: '160px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(0,255,136,0.18) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

              {/* Banca badge — tap to manage */}
              <button
                onClick={() => setShowBancaManager(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '20px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    height: '30px',
                    width: '30px',
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: '10px',
                    background: 'rgba(0,255,136,0.1)',
                    color: '#00FF88',
                    flexShrink: 0,
                  }}
                >
                  <WalletCards size={14} strokeWidth={2} />
                </span>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#94A3B8',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '180px',
                  }}
                >
                  {activeBanca?.nome || 'Banca Principal'}
                </span>
                <ChevronRight size={14} strokeWidth={1.8} color="rgba(148,163,184,0.5)" />
              </button>

              {/* Balance */}
              <h1
                style={{
                  fontFamily: 'monospace',
                  fontSize: 'clamp(30px, 8vw, 38px)',
                  fontWeight: 700,
                  lineHeight: '1.1',
                  color: '#FFFFFF',
                  letterSpacing: '-0.5px',
                  wordBreak: 'break-all',
                }}
              >
                {formatarMoeda(activeBancaBalance)}
              </h1>

              {/* Weekly badge */}
              <p
                style={{
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#94A3B8',
                  lineHeight: '1',
                }}
              >
                <TrendingUp size={14} strokeWidth={2} color="#00FF88" />
                <span style={{ color: '#00FF88', fontWeight: 600 }}>+0%</span>
                essa semana
              </p>

              {/* Buttons */}
              <div
                style={{
                  marginTop: '28px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}
              >
                <button
                  id="btn-nova-aposta"
                  onClick={openManualForm}
                  style={{
                    height: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderRadius: '18px',
                    background: '#00FF88',
                    color: '#050816',
                    fontSize: '14px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    letterSpacing: '-0.1px',
                    transition: 'opacity 0.15s',
                  }}
                >
                  <Plus size={18} strokeWidth={2.5} />
                  Nova aposta
                </button>
                <button
                  id="btn-voz"
                  onClick={openVoiceForm}
                  style={{
                    height: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderRadius: '18px',
                    background: 'rgba(0,255,136,0.08)',
                    color: '#00FF88',
                    fontSize: '14px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'opacity 0.15s',
                  }}
                >
                  <Mic size={17} strokeWidth={1.8} />
                  Voz
                </button>
              </div>
            </div>
          </section>

          {/* ══ DESKTOP PAGE HEADER ══ */}
          <section className="hidden md:flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#00FF88]">BetFala</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Visão Geral</h1>
              <p className="mt-1 text-sm font-medium text-[#94A3B8]">
                Acompanhe banca, desempenho e histórico.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={openVoiceForm}
                className="inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-semibold text-[#94A3B8] transition hover:text-white"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <Mic size={16} strokeWidth={1.8} />
                Voz
              </button>
              <button
                onClick={openManualForm}
                className="inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-bold text-[#050816] transition hover:opacity-90"
                style={{ background: '#00FF88', boxShadow: '0 8px 24px rgba(0,255,136,0.2)' }}
              >
                <Plus size={17} strokeWidth={2.5} />
                Nova aposta
              </button>
            </div>
          </section>

          {/* ══ MULTI-BANK SELECTOR (mobile, only if > 1) ══ */}
          {bancas.length > 1 && (
            <section className="md:hidden">
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  overflowX: 'auto',
                  paddingBottom: '4px',
                  marginLeft: '-24px',
                  marginRight: '-24px',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                }}
              >
                {bancas.map((banca) => {
                  const isActive = activeBanca?.id === banca.id;
                  const saldo = calcularSaldoBanca(banca, bancas, apostas);
                  return (
                    <button
                      key={banca.id}
                      onClick={() => setActiveBanca(banca.id)}
                      style={{
                        minWidth: '160px',
                        flexShrink: 0,
                        borderRadius: '20px',
                        padding: '16px',
                        textAlign: 'left',
                        background: '#0F172A',
                        outline: isActive ? '1.5px solid rgba(0,255,136,0.28)' : 'none',
                        opacity: isActive ? 1 : 0.6,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <WalletCards size={13} color={isActive ? '#00FF88' : '#94A3B8'} strokeWidth={1.8} />
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#FFFFFF',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {banca.nome}
                        </span>
                      </div>
                      <p style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: 700, color: '#00FF88' }}>
                        {formatarMoeda(saldo)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ══ ALERTS ══ */}
          {isMockMode && (
            <div
              style={{
                display: 'flex',
                gap: '12px',
                borderRadius: '18px',
                padding: '16px 18px',
                background: 'rgba(255,209,102,0.07)',
                color: '#ffd166',
                fontSize: '12px',
                lineHeight: '1.6',
                alignItems: 'flex-start',
              }}
            >
              <AlertCircle size={15} strokeWidth={1.8} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>
                Modo demonstração ativo. Configure o Supabase em{' '}
                <code style={{ fontFamily: 'monospace', fontSize: '11px' }}>.env.local</code>{' '}
                e rode as migrations para carregar dados reais.
              </span>
            </div>
          )}

          {dbError && (
            <div
              style={{
                display: 'flex',
                gap: '12px',
                borderRadius: '18px',
                padding: '16px 18px',
                background: 'rgba(255,77,109,0.07)',
                color: '#ff9aae',
                fontSize: '12px',
                lineHeight: '1.6',
                alignItems: 'flex-start',
              }}
            >
              <AlertCircle size={15} strokeWidth={1.8} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>{dbError}</span>
            </div>
          )}

          {/* ══ KPI GRID ══ */}
          <section>
            <KpiCards kpis={kpis} />
          </section>

          {/* ══ CHART ══ */}
          <section
            id="graficos-section"
            className="grid gap-5 lg:grid-cols-[1fr_280px]"
          >
            <BancaLineChart dados={evolucao} onAddAposta={openManualForm} />
            <div className="hidden lg:block">
              <StatusPieChart kpis={kpis} />
            </div>
          </section>

          {/* ══ FILTERS + LIST ══ */}
          <section id="apostas-section" className="scroll-mt-24">
            {/* Section header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#94A3B8',
                    lineHeight: '1',
                    marginBottom: '6px',
                  }}
                >
                  Histórico
                </p>
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    lineHeight: '1',
                  }}
                >
                  Apostas recentes
                </h2>
              </div>
              {loading && (
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#94A3B8' }}>
                  Atualizando...
                </span>
              )}
            </div>

            <Filters filtros={filtros} onChange={setFiltros} />

            <div style={{ marginTop: '20px' }}>
              <ApostasTable
                apostas={apostasFiltradas}
                onStatusChange={handleStatusChange}
                onDelete={excluirAposta}
              />
            </div>
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

      {showBancaManager && (
        <BancaManagerSheet
          bancas={bancas}
          activeBancaId={activeBanca?.id}
          getBancaBalance={getBancaBalance}
          onSelectBanca={(id) => { setActiveBanca(id); }}
          onAddBanca={inserirBanca}
          onUpdateBanca={atualizarBanca}
          onDeleteBanca={excluirBanca}
          onClose={() => setShowBancaManager(false)}
        />
      )}
    </div>

  );
}
