'use client';

import { useState, useMemo, useEffect } from 'react';
import { useApostas } from '@/hooks/useApostas';
import { ApostaStatus, FiltrosState } from '@/types/aposta';
import {
  calcularKpis,
  calcularEvolucaoBanca,
  filtrarPorPeriodo,
  formatarMoeda,
} from '@/lib/calculations';
import { getSportIcon, formatarDataCard } from '@/components/dashboard/ApostasTable';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import KpiCards from '@/components/dashboard/KpiCards';
import BancaLineChart from '@/components/dashboard/BancaLineChart';
import StatusPieChart from '@/components/dashboard/StatusPieChart';
import Filters from '@/components/dashboard/Filters';
import ApostasTable from '@/components/dashboard/ApostasTable';
import NovaApostaForm from '@/components/forms/NovaApostaForm';
import BottomNavBar from '@/components/layout/BottomNavBar';
import { Plus } from 'lucide-react';

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

  // Filter bets that belong to the active bankroll.
  // Bets with NO banca_id are assigned to the first bankroll for backward compatibility!
  const apostasDaBanca = useMemo(() => {
    if (!activeBanca) return [];
    const defaultBancaId = bancas[0]?.id;
    return apostas.filter(
      (a) => a.banca_id === activeBanca.id || (!a.banca_id && activeBanca.id === defaultBancaId)
    );
  }, [apostas, activeBanca, bancas]);

  // Calculate the active bankroll's dynamic balance
  const activeBancaBalance = useMemo(() => {
    if (!activeBanca) return 0;
    const defaultBancaId = bancas[0]?.id;
    const bancaBets = apostas.filter(
      (b) => b.banca_id === activeBanca.id || (!b.banca_id && activeBanca.id === defaultBancaId)
    );
    const greens = bancaBets.filter((a) => a.status === 'Green');
    const reds = bancaBets.filter((a) => a.status === 'Red');
    const lucroGreens = greens.reduce((acc, a) => acc + a.stake * (a.odd - 1), 0);
    const prejuizoReds = reds.reduce((acc, a) => acc + a.stake, 0);
    const profitLoss = lucroGreens - prejuizoReds;

    return activeBanca.saldo_inicial + profitLoss;
  }, [activeBanca, apostas, bancas]);

  // Aplica filtros de período
  const apostasFiltradas = useMemo(() => {
    let resultado = filtrarPorPeriodo(
      apostasDaBanca,
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
  }, [apostasDaBanca, filtros]);

  // KPIs e gráfico apenas das apostas filtradas
  const kpis = useMemo(() => calcularKpis(apostasFiltradas), [apostasFiltradas]);
  const evolucao = useMemo(
    () => calcularEvolucaoBanca(apostasFiltradas, activeBanca?.saldo_inicial || 0),
    [apostasFiltradas, activeBanca]
  );

  const handleStatusChange = async (id: string, status: ApostaStatus) => {
    return await atualizarAposta({ id, status });
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F17]">
      {/* ─── DESKTOP VIEW (hidden md:flex) ─────────────────────────── */}
      <div className="hidden md:flex min-h-screen bg-[#0b0d15] w-full">
        {/* Sidebar - Passando modo dinâmico (controlado responsivamente por classes internas) */}
        <Sidebar 
          mobileOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
          isMockMode={isMockMode} 
          onNovaAposta={() => {
            setStartVoiceImmediately(false);
            setShowForm(true);
          }}
          bancas={bancas}
          activeBanca={activeBanca}
          onSelectBanca={setActiveBanca}
          onAddBanca={inserirBanca}
          bets={apostas}
        />

        {/* Conteúdo principal */}
        <div className="flex-1 flex flex-col md:ml-[240px] w-full min-w-0">
          <Header 
            onNovaAposta={() => {
              setStartVoiceImmediately(false);
              setShowForm(true);
            }} 
            onMenuToggle={() => setIsMobileMenuOpen(true)}
            activeBancaNome={activeBanca?.nome}
            activeBancaSaldo={activeBancaBalance}
          />

          <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-6 md:px-8 md:py-8 flex flex-col gap-6 pt-[80px] md:pt-8 pb-32">
            {/* Header Interno do Dashboard */}
            <div className="mb-2 mt-2 hidden md:block">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                Visão Geral
              </h1>
              <p className="text-xs md:text-sm text-[#8A94A6] mt-1.5 font-medium">
                Acompanhe o desempenho consolidado da sua banca de apostas
              </p>
            </div>

            {/* Welcome / Title Section — Mobile */}
            <section className="md:hidden pt-1">
              <h1 className="text-[26px] font-bold text-[#60ff99] leading-tight tracking-tight">Visão Geral</h1>
              <p className="text-[11px] font-semibold text-[#6b7a8d] uppercase tracking-[0.12em] mt-1">Performance Semanal</p>
            </section>

            {/* Banner modo mock */}
            {isMockMode && (
              <div className="bg-[rgba(255,209,102,0.03)] border border-[rgba(255,209,102,0.15)] rounded-2xl p-4 flex items-center gap-3 text-xs text-[#FFD166]">
                <span>⚠️</span>
                <span className="leading-relaxed">
                  Você está visualizando a dashboard em <strong>modo de demonstração</strong> com dados fictícios. Configure a variável <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-[10px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no seu arquivo <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-[10px]">.env.local</code> para carregar dados reais.
                </span>
              </div>
            )}

            {/* KPIs */}
            <section className="w-full">
              <KpiCards kpis={kpis} />
            </section>

            {/* Gráficos */}
            <section id="graficos-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
              <div className="lg:col-span-2">
                <BancaLineChart dados={evolucao} />
              </div>
              <div className="hidden md:block lg:col-span-1">
                <StatusPieChart kpis={kpis} />
              </div>
            </section>

            {/* Filtros — visível em mobile e desktop */}
            <section className="w-full">
              <Filters filtros={filtros} onChange={setFiltros} />
            </section>

            {/* Histórico de Apostas */}
            <section id="apostas-section" className="w-full">
              <ApostasTable
                apostas={apostasFiltradas}
                onStatusChange={handleStatusChange}
                onDelete={excluirAposta}
              />
            </section>
          </main>

          {/* Footer - desktop only to avoid overlap on mobile */}
          <footer id="footer-section" className="hidden md:flex px-8 py-4 border-t border-[rgba(255,255,255,0.06)] items-center justify-between mt-auto bg-[#050816]/30">
            <span className="text-xs text-[#525C6C] font-semibold tracking-wider uppercase">
              ProBank © {new Date().getFullYear()} — Gestão de Banca de Apostas
            </span>
            <span className="text-xs text-[#525C6C] font-semibold tracking-wider uppercase">
              {apostas.length} {apostas.length === 1 ? 'aposta registrada' : 'apostas registradas'}
            </span>
          </footer>
        </div>

        {/* Desktop-only Quick Actions (FAB stacked vertically matching Image 2) */}
        <div className="hidden md:flex flex-col gap-3 fixed bottom-6 right-6 z-40">
          {/* Inserção por Voz */}
          <button
            onClick={() => {
              setStartVoiceImmediately(true);
              setShowForm(true);
            }}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-[#161926] border border-white/5 text-[#00FF99] hover:bg-[#1b1e2c] shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-all cursor-pointer group"
            title="Inserir por comando de voz"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#00FF99]">
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
            className="w-12 h-12 flex items-center justify-center rounded-full bg-[#00FF99] hover:bg-[#00CC7A] text-[#050816] shadow-[0_4px_12px_rgba(0,255,153,0.3)] transition-all cursor-pointer font-bold text-xl"
            title="Nova aposta manual"
          >
            <Plus size={22} strokeWidth={3} />
          </button>
        </div>

        {/* Mobile Bottom Navigation Bar & Mobile FAB */}
        <BottomNavBar
          onNovaAposta={() => {
            setStartVoiceImmediately(false);
            setShowForm(true);
          }}
        />
      </div>

      {/* ─── MOBILE PREMIUM EMPTY DASHBOARD (block md:hidden) ──────── */}
      <div className="block md:hidden min-h-screen bg-[#0B0F17] relative overflow-hidden font-sans px-5 py-6 pb-28 text-white select-none z-10">
        {/* Glow ambient effects */}
        <div className="absolute inset-0 tech-grid pointer-events-none opacity-40 z-0" />
        <div className="absolute top-[-5%] left-[-10%] w-[80%] h-[300px] bg-[#00FF99]/8 rounded-full blur-[110px] pointer-events-none z-0" />
        <div className="absolute bottom-[15%] right-[-10%] w-[80%] h-[350px] bg-[#00FF99]/5 rounded-full blur-[130px] pointer-events-none z-0" />

        {/* Content Container to keep z-index above absolute glows */}
        <div className="relative z-10 flex flex-col gap-5">
          {/* Header Card */}
          <header className="w-full bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[22px] p-4 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-[#60ff99]/30 shrink-0">
                <img
                  alt="User avatar"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCW1jBpOYZM1VUKfqJRbdfvHrDG2YcSVw3jV08qI_yxxmMJXthJsvjT9D49HrhVqw2xHZMlzb8JvLfeOt8EB1cVBrSytmo-I3Yl8hynmjCjmDRRhhGdbnQn8D0X2sAKEeaQRaGo7SFeGO19OPLyACBig2dJ8y4RQiTcYsJ4L1PxPcq-LFNFmqQ_T9wGK-ar5lZM-rXf-z8WIFMk0ORdxhJnrocoypIRTiMkgnaZl4aAdih3QJIMjVplR3eWq4ZLwfalL10j_DaKsWMd"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-semibold text-[#b9cbb9] leading-none truncate max-w-[120px]">
                  {activeBanca ? activeBanca.nome : 'Sem Banca'}
                </span>
                <span className="text-[15px] font-bold text-[#60ff99] leading-snug font-mono mt-0.5">
                  {formatarMoeda(activeBancaBalance)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/5 flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
                <span className="material-symbols-outlined text-[#b9cbb9] text-[18px] select-none">notifications</span>
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/5 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[#b9cbb9] text-[18px] select-none">menu</span>
              </button>
            </div>
          </header>

          {/* Metrics Area Grid */}
          <div className="grid grid-cols-3 gap-3.5 mt-1">
            {/* Card 1: Lucro Total */}
            <div className="col-span-1 bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[20px] p-3 flex flex-col justify-between h-[108px] shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#b9cbb9] uppercase tracking-wider">Lucro</span>
                <span className={`material-symbols-outlined text-[14px] select-none ${kpis.lucroTotal >= 0 ? 'text-[#00FF99]' : 'text-[#FF4D6D]'}`}>
                  {kpis.lucroTotal >= 0 ? 'trending_up' : 'trending_down'}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className={`text-[13px] font-extrabold font-mono truncate block ${kpis.lucroTotal >= 0 ? 'text-[#00FF99]' : 'text-[#FF4D6D]'}`}>
                  {kpis.lucroTotal >= 0 ? '+' : ''}{formatarMoeda(kpis.lucroTotal)}
                </span>
                <span className="text-[9px] text-[#6b7a8d] font-bold">
                  ROI {kpis.lucroTotal >= 0 ? '+' : ''}{kpis.roi.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Card 2: Central Tall Card (Taxa de Acerto radial progress) */}
            <div className="col-span-1 row-span-2 bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[24px] p-3.5 flex flex-col justify-between h-[230px] shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#b9cbb9] uppercase tracking-wider">Acerto</span>
                <span className="material-symbols-outlined text-[14px] select-none text-[#b9cbb9]">track_changes</span>
              </div>
              
              {/* Radial Chart */}
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center my-auto">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/5"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#00FF99] filter drop-shadow-[0_0_4px_rgba(0,255,153,0.6)]"
                    strokeWidth="3.5"
                    strokeDasharray={`${Math.round(kpis.taxaAcerto)}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-[12px] font-black text-white font-mono">
                  {Math.round(kpis.taxaAcerto)}%
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden mt-2">
                <div 
                  className="h-full bg-gradient-to-r from-[#00FF99] to-[#00CC7A] rounded-full filter drop-shadow-[0_0_4px_rgba(0,255,153,0.3)] transition-all duration-500" 
                  style={{ width: `${Math.max(0, Math.min(100, kpis.taxaAcerto))}%` }}
                />
              </div>
            </div>

            {/* Card 3: ROI */}
            <div className="col-span-1 bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[20px] p-3 flex flex-col justify-between h-[108px] shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#b9cbb9] uppercase tracking-wider">ROI</span>
                <span className="material-symbols-outlined text-[14px] select-none text-[#adc6ff]">percent</span>
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[13px] font-extrabold text-[#adc6ff] font-mono truncate block">
                  {kpis.roi >= 0 ? '+' : ''}{kpis.roi.toFixed(1)}%
                </span>
                <span className="text-[9px] text-[#6b7a8d] font-bold">
                  {kpis.roi >= 0 ? 'Acima da meta' : 'Abaixo da meta'}
                </span>
              </div>
            </div>

            {/* Card 4: Investimento (Volume) */}
            <div className="col-span-1 bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[20px] p-3 flex flex-col justify-between h-[108px] shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-[#b9cbb9] uppercase tracking-wider">Volume</span>
                <span className="material-symbols-outlined text-[14px] select-none text-white/40">payments</span>
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[12px] font-extrabold text-white font-mono truncate block">
                  {formatarMoeda(kpis.totalInvestido)}
                </span>
                <span className="text-[9px] text-[#6b7a8d] font-bold">
                  Investido
                </span>
              </div>
            </div>

            {/* Card 5: Apostas */}
            <div className="col-span-1 bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[20px] p-3 flex flex-col justify-between h-[108px] shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#b9cbb9] uppercase tracking-wider">Apostas</span>
                <span className="material-symbols-outlined text-[14px] select-none text-white/40">tag</span>
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[13px] font-extrabold text-white font-mono block">
                  {kpis.totalApostas}
                </span>
                <span className="text-[9px] text-[#6b7a8d] font-bold truncate">
                  Ativas: {kpis.abertas}
                </span>
              </div>
            </div>
          </div>

          {/* Main Chart Section Card */}
          <div className="w-full bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[26px] p-5 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] font-bold text-[#b9cbb9] uppercase tracking-wider">Evolução da Banca</span>
                <span className="text-[9px] text-[#6b7a8d] font-semibold">Histórico de rendimento</span>
              </div>
              
              {/* Functional Period buttons */}
              <div className="flex gap-1 bg-white/[0.04] p-0.5 rounded-lg border border-white/5">
                <button
                  onClick={() => setFiltros(prev => ({ ...prev, periodo: '7dias' }))}
                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold cursor-pointer transition-all ${
                    filtros.periodo === '7dias' ? 'bg-[#00FF99] text-[#050816]' : 'text-white/60 hover:text-white'
                  }`}
                >
                  7D
                </button>
                <button
                  onClick={() => setFiltros(prev => ({ ...prev, periodo: 'mes' }))}
                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold cursor-pointer transition-all ${
                    filtros.periodo === 'mes' ? 'bg-[#00FF99] text-[#050816]' : 'text-white/60 hover:text-white'
                  }`}
                >
                  30D
                </button>
                <button
                  onClick={() => setFiltros(prev => ({ ...prev, periodo: 'todos' }))}
                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold cursor-pointer transition-all ${
                    filtros.periodo === 'todos' ? 'bg-[#00FF99] text-[#050816]' : 'text-white/60 hover:text-white'
                  }`}
                >
                  TUDO
                </button>
              </div>
            </div>

            {/* Gráfico line chart */}
            <div className="relative h-44 w-full flex flex-col justify-end">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 z-0">
                <div className="border-b border-dashed border-white/10 w-full h-0" />
                <div className="border-b border-dashed border-white/10 w-full h-0" />
                <div className="border-b border-dashed border-white/10 w-full h-0" />
                <div className="border-b border-dashed border-white/10 w-full h-0" />
                <div className="border-b border-dashed border-white/10 w-full h-0" />
              </div>
              
              {/* Draw path dynamically */}
              {(() => {
                const points = evolucao.map(d => d.banca);
                const minVal = points.length > 0 ? Math.min(...points) : 0;
                const maxVal = points.length > 0 ? Math.max(...points) : 100;
                const range = maxVal - minVal || 1;

                const svgPoints = evolucao.map((d, index) => {
                  const x = evolucao.length > 1 ? (index / (evolucao.length - 1)) * 300 : 150;
                  const y = 80 - ((d.banca - minVal) / range) * 65; // Y between 15 and 80
                  return { x, y };
                });

                let dPath = "";
                let dArea = "";
                if (svgPoints.length > 0) {
                  dPath = `M ${svgPoints[0].x},${svgPoints[0].y}`;
                  svgPoints.slice(1).forEach((pt) => {
                    dPath += ` L ${pt.x},${pt.y}`;
                  });
                  dArea = `${dPath} L ${svgPoints[svgPoints.length - 1].x},100 L ${svgPoints[0].x},100 Z`;
                } else {
                  dPath = "M 0,50 L 300,50";
                  dArea = "M 0,50 L 300,50 L 300,100 L 0,100 Z";
                }

                return (
                  <>
                    <svg className="w-full h-[85%] z-10" viewBox="0 0 300 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGradientMobileReal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00FF99" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#00FF99" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Area path for shading */}
                      <path d={dArea} fill="url(#chartGradientMobileReal)" />
                      
                      {/* Line path */}
                      <path
                        d={dPath}
                        fill="none"
                        stroke="#00FF99"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        className="filter drop-shadow-[0_2px_8px_rgba(0,255,153,0.6)]"
                      />
                      
                      {/* Smooth dots on line nodes */}
                      {svgPoints.map((pt, i) => (
                        <circle 
                          key={i} 
                          cx={pt.x} 
                          cy={pt.y} 
                          r="3" 
                          fill="#ffffff" 
                          stroke="#00FF99" 
                          strokeWidth="1.5" 
                          className="filter drop-shadow-[0_0_4px_rgba(0,255,153,0.8)]" 
                        />
                      ))}
                    </svg>

                    {/* Dates/Labels */}
                    <div className="flex justify-between text-[9px] text-[#6b7a8d] font-bold mt-2 px-1 z-10">
                      <span>{evolucao.length > 0 ? evolucao[0].data : ''}</span>
                      <span>{evolucao.length > 2 ? evolucao[Math.floor(evolucao.length / 2)].data : ''}</span>
                      <span>{evolucao.length > 1 ? evolucao[evolucao.length - 1].data : ''}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Lower History Card Section */}
          <div className="w-full bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[26px] p-5 shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <span className="text-[12px] font-bold text-[#b9cbb9] uppercase tracking-wider">Histórico Recente</span>
            </div>

            {/* Search and Period Indicator */}
            <div className="flex gap-2.5 mb-5">
              <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl h-10 flex items-center px-3 gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/20">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar aposta..."
                  value={filtros.busca}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                  className="bg-transparent text-xs w-full text-white placeholder-white/20 outline-none h-full"
                />
              </div>
              
              <div className="w-24 h-10 bg-white/[0.04] border border-white/5 rounded-xl flex items-center justify-center gap-1.5 px-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/30">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                <span className="text-[10px] text-[#b9cbb9] font-bold uppercase truncate max-w-[55px]">
                  {filtros.periodo === 'todos' ? 'Tudo' : filtros.periodo === '7dias' ? '7 Dias' : '30 Dias'}
                </span>
              </div>
            </div>

            {/* Real Bets List */}
            {apostasFiltradas.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#525C6C] font-semibold uppercase tracking-widest border border-dashed border-white/5 rounded-[18px] bg-white/[0.01]">
                Nenhuma aposta registrada
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {apostasFiltradas.slice(0, 8).map((aposta) => {
                  const isWin = aposta.status === 'Green';
                  const isLoss = aposta.status === 'Red';
                  const isVoid = aposta.status === 'Void';
                  
                  let statusLabel = "PENDENTE";
                  let statusColor = "bg-white/5 text-white/40 border-white/5";
                  if (isWin) {
                    statusLabel = "GANHOU";
                    statusColor = "bg-[#00FF99]/10 text-[#00FF99] border-[#00FF99]/20";
                  } else if (isLoss) {
                    statusLabel = "PERDEU";
                    statusColor = "bg-[#FF4D6D]/10 text-[#FF4D6D] border-[#FF4D6D]/20";
                  } else if (isVoid) {
                    statusLabel = "ANULADO";
                    statusColor = "bg-white/10 text-white/50 border-white/10";
                  }
                  
                  return (
                    <div 
                      key={aposta.id}
                      className="flex items-center justify-between p-3.5 bg-white/[0.01] border border-white/[0.03] rounded-[18px] hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[#b9cbb9] text-[16px]">
                            {getSportIcon(aposta.times_apostados, aposta.detalhe_aposta)}
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="text-[13px] font-bold text-white truncate max-w-[130px]">
                            {aposta.times_apostados}
                          </div>
                          <div className="text-[9px] text-[#6b7a8d] font-bold mt-0.5 truncate">
                            {formatarDataCard(aposta.data_criacao)} • {aposta.detalhe_aposta}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2.5 shrink-0 ml-2">
                        <div className={`px-1.5 py-0.5 text-[8px] font-black rounded-md border ${statusColor}`}>
                          {statusLabel}
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[12px] font-bold text-white font-mono">
                            {formatarMoeda(aposta.stake)}
                          </span>
                          <span className="text-[9px] text-[#6b7a8d] font-bold mt-0.5">
                            Odd {aposta.odd.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pulsing Floating Action Button (FAB) opens Add Bet Form */}
        <button 
          onClick={() => {
            setStartVoiceImmediately(false);
            setShowForm(true);
          }}
          className="fixed right-6 bottom-6 w-14 h-14 bg-[#00FF99] text-[#050816] rounded-full flex items-center justify-center z-50 shadow-[0_0_20px_rgba(0,255,153,0.4)] active:scale-95 transition-transform duration-150 cursor-pointer fab-pulse"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Modal Nova Aposta (Accessible across both desktop and modal actions if triggered) */}
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
