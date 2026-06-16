'use client';

import { useEffect, useMemo, useState } from 'react';
import { useApostas } from '@/hooks/useApostas';
import { FiltrosState } from '@/types/aposta';
import {
  calcularEvolucaoBanca,
  calcularKpis,
  filtrarPorPeriodo,
  formatarMoeda,
} from '@/lib/calculations';
import KpiCards from '@/components/dashboard/KpiCards';
import BancaLineChart from '@/components/dashboard/BancaLineChart';
import StatusPieChart from '@/components/dashboard/StatusPieChart';
import Filters from '@/components/dashboard/Filters';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { WalletCards, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import BottomNavBar from '@/components/layout/BottomNavBar';

// Combined Extrato Item
type ExtratoItem = {
  id: string;
  data: string;
  tipo: 'deposito' | 'saque' | 'aposta';
  descricao: string;
  valor: number;
  saldoApos: number;
  bancaNome: string;
  isGreen?: boolean;
};

export default function RelatorioGeralPage() {
  const {
    apostas,
    bancas,
    activeBanca,
    fetchApostas,
    setActiveBanca,
    transacoes,
    isMockMode,
    isDataLoaded,
  } = useApostas();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosState>({ busca: '', periodo: 'todos' });
  const [filtroExtrato, setFiltroExtrato] = useState<'todos' | 'green' | 'red' | 'deposito' | 'saque'>('todos');

  useEffect(() => { fetchApostas(); }, [fetchApostas]);

  // Total Initial Balance
  const totalSaldoInicial = useMemo(() => {
    return bancas.reduce((acc, b) => acc + b.saldo_inicial, 0);
  }, [bancas]);

  // Aggregate apostas using filters
  const apostasFiltradas = useMemo(() => {
    let resultado = filtrarPorPeriodo(apostas, filtros.periodo, filtros.dataInicio, filtros.dataFim);
    if (filtros.busca.trim()) {
      const q = filtros.busca.toLowerCase();
      resultado = resultado.filter(
        (aposta) =>
          aposta.times_apostados.toLowerCase().includes(q) ||
          aposta.detalhe_aposta?.toLowerCase().includes(q)
      );
    }
    return resultado;
  }, [apostas, filtros]);

  const kpis = useMemo(() => calcularKpis(apostasFiltradas), [apostasFiltradas]);

  const evolucaoTotal = useMemo(() => {
    return calcularEvolucaoBanca(apostas, transacoes, totalSaldoInicial);
  }, [apostas, transacoes, totalSaldoInicial]);

  const evolucao = useMemo(() => {
    if (filtros.periodo === 'todos') return evolucaoTotal;

    let startTimestamp = 0;
    const agora = new Date();

    if (filtros.periodo === '7dias') {
      startTimestamp = agora.getTime() - 7 * 86400000;
    } else if (filtros.periodo === 'mes') {
      startTimestamp = new Date(agora.getFullYear(), agora.getMonth(), 1).getTime();
    } else if (filtros.periodo === 'personalizado' && filtros.dataInicio) {
      startTimestamp = new Date(filtros.dataInicio).getTime();
    }

    if (startTimestamp === 0) return evolucaoTotal;

    const filteredPoints = evolucaoTotal.filter(p => p.timestamp && p.timestamp >= startTimestamp);

    if (filteredPoints.length > 0) {
      const firstFilteredIndex = evolucaoTotal.findIndex(p => p === filteredPoints[0]);
      if (firstFilteredIndex > 0) {
        const pointBefore = evolucaoTotal[firstFilteredIndex - 1];
        return [{ ...pointBefore, data: 'Início', label: pointBefore.label }, ...filteredPoints];
      }
    } else if (evolucaoTotal.length > 0) {
      const lastPoint = evolucaoTotal[evolucaoTotal.length - 1];
      return [{ ...lastPoint, data: 'Atual' }];
    }

    return filteredPoints;
  }, [evolucaoTotal, filtros]);

  const saldoAtualCalculado = evolucaoTotal.length > 0 ? evolucaoTotal[evolucaoTotal.length - 1].banca : totalSaldoInicial;

  // Extrato Consolidado
  const extratoConsolidado = useMemo(() => {
    const combined: Omit<ExtratoItem, 'saldoApos'>[] = [];

    // Map bancas for easy name lookup
    const bancaMap = new Map<string, string>();
    const defaultBanca = bancas[0];
    bancas.forEach(b => bancaMap.set(b.id, b.nome));

    const getBancaNome = (banca_id?: string) => {
      if (banca_id && bancaMap.has(banca_id)) return bancaMap.get(banca_id)!;
      return defaultBanca ? defaultBanca.nome : 'Desconhecida';
    };

    transacoes.forEach(t => {
      combined.push({
        id: t.id,
        data: t.data_criacao,
        tipo: t.tipo,
        descricao: t.tipo === 'deposito' ? 'Depósito' : 'Saque',
        valor: t.tipo === 'deposito' ? t.valor : -t.valor,
        bancaNome: getBancaNome(t.banca_id)
      });
    });

    apostas.forEach(a => {
      const bNome = getBancaNome(a.banca_id);
      if (a.status === 'Green') {
        let lucro = a.stake * (a.odd - 1);
        if (a.bonus_percent) {
          lucro += lucro * (a.bonus_percent / 100);
        }
        combined.push({
          id: a.id,
          data: a.data_criacao || new Date().toISOString(),
          tipo: 'aposta',
          descricao: `Aposta: ${a.times_apostados}`,
          valor: lucro,
          isGreen: true,
          bancaNome: bNome
        });
      } else if (a.status === 'Cashout') {
        const lucro = (a.valor_cashout || 0) - a.stake;
        combined.push({
          id: a.id,
          data: a.data_criacao || new Date().toISOString(),
          tipo: 'aposta',
          descricao: `Cashout: ${a.times_apostados}`,
          valor: lucro,
          isGreen: lucro > 0,
          bancaNome: bNome
        });
      } else if (a.status === 'Red') {
        combined.push({
          id: a.id,
          data: a.data_criacao || new Date().toISOString(),
          tipo: 'aposta',
          descricao: `Aposta: ${a.times_apostados}`,
          valor: a.is_freebet ? 0 : -a.stake,
          isGreen: false,
          bancaNome: bNome
        });
      } else if (a.status === 'Aberta') {
        combined.push({
          id: a.id,
          data: a.data_criacao || new Date().toISOString(),
          tipo: 'aposta',
          descricao: `Aposta (Aberta): ${a.times_apostados}`,
          valor: a.is_freebet ? 0 : -a.stake,
          bancaNome: bNome
        });
      }
    });

    combined.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    let runningBalance = totalSaldoInicial;
    const result: ExtratoItem[] = [];

    // Add initial balance
    result.push({
      id: 'initial_total',
      data: new Date(bancas.length > 0 ? Math.min(...bancas.map(b => new Date(b.data_criacao).getTime())) : 0).toISOString(),
      tipo: 'deposito',
      descricao: 'Saldo Inicial (Todas as Bancas)',
      valor: totalSaldoInicial,
      saldoApos: totalSaldoInicial,
      bancaNome: 'Global'
    });

    for (const item of combined) {
      runningBalance += item.valor;
      result.push({
        ...item,
        saldoApos: runningBalance,
      });
    }

    return result.reverse();
  }, [apostas, transacoes, bancas, totalSaldoInicial]);

  return (
    <div style={{ minHeight: '100svh', width: '100%', background: '#050816', color: '#FFFFFF' }}>
      <Sidebar
        mobileOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isMockMode={isMockMode}
        bancas={bancas}
        activeBanca={activeBanca}
        onSelectBanca={setActiveBanca}
        bets={apostas}
        transacoes={transacoes}
        isDataLoaded={isDataLoaded}
      />

      <div style={{ minHeight: '100svh' }} className="w-full">
        <Header
          onMenuToggle={() => setIsMobileMenuOpen(true)}
          activeBancaNome="Relatório Geral"
          activeBancaSaldo={saldoAtualCalculado}
          isDataLoaded={isDataLoaded}
        />

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
                <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Relatório Geral</h1>
                <p className="mt-1 text-sm font-medium text-[#94A3B8]">
                  Análise consolidada de todas as suas bancas.
                </p>
              </div>
            </div>
          </section>

          {/* ══ HERO CARD (mobile) ══ */}
          <section className="md:hidden">
            <div
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '28px',
                padding: '28px 24px',
                background: 'linear-gradient(145deg, #1e1b4b 0%, #171717 100%)',
                boxShadow: '0 4px 32px rgba(0,0,0,0.25)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  right: '-24px',
                  top: '-24px',
                  width: '160px',
                  height: '160px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <span
                  style={{
                    height: '30px',
                    width: '30px',
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: '10px',
                    background: 'rgba(139,92,246,0.1)',
                    color: '#8b5cf6',
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
                  }}
                >
                  Banca Consolidada Global
                </span>
              </div>
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
                {isDataLoaded ? formatarMoeda(saldoAtualCalculado) : '...'}
              </h1>
            </div>
          </section>

          {/* ══ KPI GRID ══ */}
          <section>
            <KpiCards kpis={kpis} />
          </section>

          {/* ══ CHART ══ */}
          <section className="grid gap-5 lg:grid-cols-[1fr_280px]">
            <BancaLineChart dados={evolucao} />
            <div>
              <StatusPieChart kpis={kpis} />
            </div>
          </section>

          {/* ══ FILTERS & EXTRATO CONSOLIDADO ══ */}
          <section className="mt-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-white leading-tight">Extrato Consolidado</h2>
                <p className="text-sm font-medium text-[#94A3B8] mt-1" style={{ marginBottom: '10px' }}>
                  Movimentações de todas as bancas.
                </p>
              </div>
            </div>

            <Filters filtros={filtros} onChange={setFiltros} />

            {/* Extrato Filter Toggle */}
            <div className="flex gap-2 overflow-x-auto pb-2 mt-4" style={{ scrollbarWidth: 'none', marginTop: '10px', justifyContent: 'center' }}>
              {(['todos', 'green', 'red', 'deposito', 'saque'] as const).map(tipo => (
                <button
                  key={tipo}
                  onClick={() => setFiltroExtrato(tipo)}
                  className={`px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${filtroExtrato === tipo
                    ? 'bg-violet-600 tet-white'
                    : 'bg-white/[0.04] text-[#94A3B8] hover:bg-white/[0.08] hover:text-white'
                    }`}
                  style={{ padding: '10px' }}
                >
                  {tipo === 'todos' ? 'Todos' : tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6" style={{ marginTop: '20px' }}>
              {extratoConsolidado
                .filter(item => {
                  if (filtroExtrato === 'todos') return true;
                  if (filtroExtrato === 'green') return item.isGreen === true;
                  if (filtroExtrato === 'red') return item.tipo === 'aposta' && item.isGreen === false;
                  if (filtroExtrato === 'deposito') return item.tipo === 'deposito' && item.id !== 'initial_total';
                  if (filtroExtrato === 'saque') return item.tipo === 'saque';
                  return true;
                })
                .map((item) => {
                  const isPositive = item.valor >= 0;
                  let icon;
                  if (item.tipo === 'deposito' || item.id === 'initial_total') {
                    icon = <ArrowUpRight size={18} strokeWidth={2.5} />;
                  } else if (item.tipo === 'saque') {
                    icon = <ArrowDownRight size={18} strokeWidth={2.5} />;
                  } else {
                    icon = <Activity size={18} strokeWidth={2.5} />;
                  }

                  return (
                    <article
                      key={item.id}
                      style={{
                        background: '#171717',
                        borderRadius: '24px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '18px 20px',
                        transition: 'background 0.3s ease',
                      }}
                    >
                      <div
                        style={{
                          height: '40px',
                          width: '40px',
                          flexShrink: 0,
                          display: 'grid',
                          placeItems: 'center',
                          borderRadius: '14px',
                          background: item.tipo === 'deposito' || item.id === 'initial_total' || isPositive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                          color: item.tipo === 'deposito' || item.id === 'initial_total' || isPositive ? '#22c55e' : '#ef4444',
                        }}
                      >
                        {icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#FFFFFF',
                            lineHeight: '1.3',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginBottom: '4px',
                          }}
                        >
                          {item.descricao}
                        </span>
                        <div className="flex gap-2 items-center">
                          <span style={{ fontSize: '11px', color: 'rgba(148,163,184,0.55)' }}>
                            {new Date(item.data).toLocaleDateString('pt-BR', {
                              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                          <span style={{
                            fontSize: '10px',
                            background: 'rgba(139,92,246,0.15)',
                            color: '#c4b5fd',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            fontWeight: 600
                          }}>
                            {item.bancaNome}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: '5px',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: isPositive ? '#22c55e' : '#ef4444',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isPositive ? '+' : ''}{formatarMoeda(item.valor)}
                        </span>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#94A3B8',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Saldo: {formatarMoeda(item.saldoApos)}
                        </span>
                      </div>
                    </article>
                  );
                })}
              {extratoConsolidado.length === 0 && (
                <div
                  className="col-span-1 lg:col-span-2 rounded-[24px] px-6 py-12 text-center"
                  style={{ background: '#171717' }}
                >
                  <p className="text-[15px] font-semibold text-white">Nenhuma movimentação encontrada</p>
                  <p className="mt-2 text-[13px] text-[#94A3B8]">As transações aparecerão aqui.</p>
                </div>
              )}
            </div>
          </section>

        </main>
      </div>

      <BottomNavBar />
    </div>
  );
}
