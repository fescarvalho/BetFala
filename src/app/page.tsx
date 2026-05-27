'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ChevronRight,
  Mic,
  Plus,
  TrendingUp,
  WalletCards,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useApostas } from '@/hooks/useApostas';
import { Aposta, ApostaStatus, Banca, FiltrosState, Transacao, TipoTransacao } from '@/types/aposta';
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
import RelatoriosTab from '@/components/dashboard/RelatoriosTab';

function calcularSaldoBanca(banca: Banca | null, bancas: Banca[], apostas: Aposta[], transacoes: Transacao[] = []) {
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

  const bancaTransacoes = transacoes.filter((t) => t.banca_id === banca.id);
  const depositos = bancaTransacoes.filter(t => t.tipo === 'deposito').reduce((acc, t) => acc + t.valor, 0);
  const saques = bancaTransacoes.filter(t => t.tipo === 'saque').reduce((acc, t) => acc + t.valor, 0);

  return banca.saldo_inicial + depositos - saques + lucroGreens - prejuizoReds;
}

function DashboardPageContent() {
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
    transacoes,
    inserirTransacao,
    isMockMode,
  } = useApostas();

  const [showForm, setShowForm] = useState(false);
  const [showBancaManager, setShowBancaManager] = useState(false);
  const [quickTransactionType, setQuickTransactionType] = useState<TipoTransacao | null>(null);
  const [startVoiceImmediately, setStartVoiceImmediately] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosState>({ busca: '', periodo: 'todos' });

  // Fallback para build/SSR (evitar erro de useSearchParams fora de Suspense, porém Next 13+ lida ok,
  // mas como estamos num Client Component no root app dir, embrulhar o DashboardPage num Suspense depois seria o ideal.
  // Como é Client-side rendered safe, usaremos useSearchParams direto)
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'visao-geral';

  useEffect(() => { fetchApostas(); }, [fetchApostas]);

  const openTransaction = (tipo: TipoTransacao) => {
    if (!activeBanca) return;
    setQuickTransactionType(tipo);
    setShowBancaManager(true);
  };

  const closeManager = () => {
    setShowBancaManager(false);
    setTimeout(() => setQuickTransactionType(null), 300);
  };

  /* balance helper shared with BancaManagerSheet */
  const getBancaBalance = useMemo(() => (banca: Banca) => {
    return calcularSaldoBanca(banca, bancas, apostas, transacoes);
  }, [apostas, bancas, transacoes]);

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
    () => calcularSaldoBanca(activeBanca, bancas, apostas, transacoes),
    [activeBanca, bancas, apostas, transacoes]
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
  const evolucao = useMemo(() => {
    if (!activeBanca) return [];
    const bancaTransacoes = transacoes.filter((t) => t.banca_id === activeBanca.id);
    const depositos = bancaTransacoes.filter(t => t.tipo === 'deposito').reduce((acc, t) => acc + t.valor, 0);
    const saques = bancaTransacoes.filter(t => t.tipo === 'saque').reduce((acc, t) => acc + t.valor, 0);
    const baseline = activeBanca.saldo_inicial + depositos - saques;
    return calcularEvolucaoBanca(apostasDaBanca, baseline);
  }, [apostasDaBanca, activeBanca, transacoes]);

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

      <div style={{ minHeight: '100svh' }} className="w-full">

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
            paddingTop: '24px',
            paddingBottom: '140px',
          }}
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
                  gridTemplateColumns: '1fr auto',
                  gap: '10px',
                }}
              >
                <button
                  id="btn-nova-aposta"
                  onClick={openManualForm}
                  style={{
                    height: '52px',
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
                    width: '52px',
                    height: '52px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '16px',
                    background: 'rgba(0,255,136,0.08)',
                    color: '#00FF88',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'opacity 0.15s',
                  }}
                >
                  <Mic size={18} strokeWidth={1.8} />
                </button>
                
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => openTransaction('deposito')}
                    style={{
                      flex: 1,
                      height: '52px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      borderRadius: '16px',
                      background: 'rgba(0,255,136,0.15)',
                      color: '#00FF88',
                      fontSize: '14px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <ArrowUpRight size={18} strokeWidth={2} />
                    Depositar
                  </button>
                  <button
                    onClick={() => openTransaction('saque')}
                    style={{
                      flex: 1,
                      height: '52px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      borderRadius: '16px',
                      background: 'rgba(255,77,109,0.15)',
                      color: '#ff9aae',
                      fontSize: '14px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <ArrowDownRight size={18} strokeWidth={2} />
                    Sacar
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ══ DESKTOP PAGE HEADER ══ */}
          <section className="hidden md:flex items-end justify-between gap-6">
            <div className="flex items-center gap-5">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-[#94A3B8] transition hover:bg-white/[0.08] hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </button>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#00FF88]">BetFala</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Visão Geral</h1>
                <p className="mt-1 text-sm font-medium text-[#94A3B8]">
                  Acompanhe banca, desempenho e histórico.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => openTransaction('saque')}
                className="inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-semibold text-[#ff9aae] transition hover:opacity-80 flex-shrink-0"
                style={{ background: 'rgba(255,77,109,0.1)' }}
              >
                <ArrowDownRight size={16} strokeWidth={2} />
                Sacar
              </button>
              <button
                onClick={() => openTransaction('deposito')}
                className="inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-semibold text-[#00FF88] transition hover:opacity-80 flex-shrink-0"
                style={{ background: 'rgba(0,255,136,0.1)' }}
              >
                <ArrowUpRight size={16} strokeWidth={2} />
                Depositar
              </button>
              <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
              <button
                onClick={openVoiceForm}
                className="inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-semibold text-[#94A3B8] transition hover:text-white flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <Mic size={16} strokeWidth={1.8} />
                Voz
              </button>
              <button
                onClick={openManualForm}
                className="inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-bold text-[#050816] transition hover:opacity-90 flex-shrink-0"
                style={{ background: '#00FF88', boxShadow: '0 8px 24px rgba(0,255,136,0.2)' }}
              >
                <Plus size={17} strokeWidth={2.5} />
                Nova aposta
              </button>
            </div>
          </section>

          {/* ══ MULTI-BANK SELECTOR (only if > 1) ══ */}
          {bancas.length > 1 && (
            <section className="mb-6">
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  overflowX: 'auto',
                  paddingTop: '4px',
                  paddingBottom: '4px',
                  marginLeft: '-24px',
                  marginRight: '-24px',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                }}
              >
                {bancas.map((banca) => {
                  const isActive = activeBanca?.id === banca.id;
                  const saldo = calcularSaldoBanca(banca, bancas, apostas, transacoes);
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

          {currentTab === 'relatorios' ? (
            <RelatoriosTab
              activeBanca={activeBanca}
              apostas={apostas}
              transacoes={transacoes}
              bancas={bancas}
            />
          ) : (
            <>
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
            <div>
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
            </>
          )}

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
          onClose={closeManager}
          onAddTransaction={inserirTransacao}
          initialView={quickTransactionType ? 'transaction' : 'list'}
          initialTransactionType={quickTransactionType || 'deposito'}
          initialTargetBancaId={activeBanca?.id}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050816] w-full flex items-center justify-center text-[#00FF88]">Carregando...</div>}>
      <DashboardPageContent />
    </Suspense>
  );
}
