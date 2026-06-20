'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart2,
  TrendingUp,
  History,
  Settings,
  HelpCircle,
  LogOut,
  Landmark,
  Plus,
  PieChart
} from 'lucide-react';
import { Banca, Aposta, Transacao } from '@/types/aposta';
import { formatarMoeda } from '@/lib/calculations';

const navItems = [
  { href: '/', label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/?tab=relatorios', label: 'Relatórios', icon: BarChart2 },
  { href: '/relatorio-geral', label: 'Relatório Geral', icon: PieChart },
  { href: '/?tab=estrategias', label: 'Estratégias', icon: TrendingUp },
  { href: '/?tab=historico', label: 'Histórico', icon: History },
  { href: '/?tab=configuracoes', label: 'Configurações', icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  isMockMode?: boolean;
  onNovaAposta?: () => void;
  bancas: Banca[];
  activeBanca: Banca | null;
  onSelectBanca: (id: string) => void;
  onManageBancas?: () => void;
  bets: Aposta[];
  transacoes?: Transacao[];
  isDataLoaded?: boolean;
  onOpenInsights?: () => void;
}

export default function Sidebar({
  mobileOpen,
  onClose,
  isMockMode = true,
  onNovaAposta,
  bancas,
  activeBanca,
  onSelectBanca,
  onManageBancas,
  bets,
  transacoes = [],
  isDataLoaded = true,
  onOpenInsights,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Switcher UI state
  const [showDropdown, setShowDropdown] = useState(false);

  // Helper to compute the dynamic balance of each bankroll
  const getBancaBalance = (banca: Banca) => {
    const defaultBancaId = bancas[0]?.id;
    // Map bets without a banca_id to the first bankroll
    const bancaBets = bets.filter(
      (b) => b.banca_id === banca.id || (!b.banca_id && banca.id === defaultBancaId)
    );

    const greens = bancaBets.filter((a) => a.status === 'Green');
    const reds = bancaBets.filter((a) => a.status === 'Red');
    const abertas = bancaBets.filter((a) => a.status === 'Aberta');
    const lucroGreens = greens.reduce((acc, a) => acc + a.stake * (a.odd - 1), 0);
    const prejuizoReds = reds.reduce((acc, a) => acc + a.stake, 0);
    const stakeAbertas = abertas.reduce((acc, a) => acc + a.stake, 0);

    const bancaTransacoes = transacoes.filter((t) => t.banca_id === banca.id);
    const depositos = bancaTransacoes.filter(t => t.tipo === 'deposito').reduce((acc, t) => acc + t.valor, 0);
    const saques = bancaTransacoes.filter(t => t.tipo === 'saque').reduce((acc, t) => acc + t.valor, 0);

    const profitLoss = lucroGreens - prejuizoReds - stakeAbertas;

    return banca.saldo_inicial + depositos - saques + profitLoss;
  };

  return (
    <>
      {/* Overlay Mobile */}
      {mobileOpen && (
        <div
          className=" fixed inset-0 bg-black/75 z-[55] backdrop-blur-md transition-opacity "
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-[60] w-[260px] bg-neutral-950 border-r border-white/[0.03] flex flex-col transition-transform duration-300 ${mobileOpen ? '!translate-x-0' : '!-translate-x-full'
          }`}
      >
        {/* Logo "PROBANK" */}
        <div className="px-8 pt-8 pb-4 flex items-center gap-4" style={{ padding: "20px" }}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.2)] shrink-0">
            <TrendingUp size={18} color="#050816" strokeWidth={3} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white select-none">
            Pro<span className="text-violet-500">Bank</span>
          </span>
          {isMockMode && (
            <span className="ml-auto rounded-full bg-[#ffd166]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ffd166] shrink-0">
              Demo
            </span>
          )}
        </div>

        {/* Connection/Banca Switcher Selector */}
        <div className="px-6 w-full" style={{ padding: "10px", position: "relative", zIndex: 100 }}>
          <div className="relative z-[100] w-full">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-[24px] p-5 text-left transition-all active:scale-[0.98] cursor-pointer group shadow-[0_4px_20px_rgba(0,0,0,0.18)]"
            >
              <div className="flex items-center gap-3.5 min-w-0 w-full">
                <div className="w-10 h-10 rounded-[14px] bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                  <Landmark size={18} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.08em] leading-none mb-1.5 break-words whitespace-normal">
                    Banca Ativa
                  </div>
                  <div className="text-[14px] font-bold text-white break-words whitespace-normal leading-tight pr-2">
                    {activeBanca ? activeBanca.nome : 'Sem Banca'}
                  </div>
                </div>
              </div>
              {/* Custom SVG Down Arrow */}
              <svg
                className="text-[#94A3B8] group-hover:text-white transition-transform duration-200 shrink-0"
                style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0)' }}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {/* Switcher Dropdown */}
            {showDropdown && (
              <div className="absolute left-0 right-0 top-full mt-3 bg-neutral-900 border border-neutral-800 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[999] overflow-hidden animate-fade-in flex flex-col max-h-[320px]" >
                <div className="overflow-y-auto flex-1 flex flex-col gap-2" style={{ padding: '8px' }}>
                  {bancas.length === 0 ? (
                    <div className="py-4 text-xs text-[#94A3B8] text-center" style={{ paddingLeft: '16px', paddingRight: '16px' }}>Nenhuma banca cadastrada</div>
                  ) : (
                    bancas.map((b) => {
                      const isActive = activeBanca?.id === b.id;
                      return (
                        <button
                          key={b.id}
                          onClick={() => {
                            onSelectBanca(b.id);
                            setShowDropdown(false);
                          }}
                          className={`w-full flex flex-col text-left transition-all cursor-pointer ${isActive
                            ? 'bg-violet-500/10 border border-violet-500/20'
                            : 'hover:bg-white/[0.04] border border-transparent'
                            }`}
                          style={{ padding: '16px 20px', borderRadius: '16px' }}
                        >
                          <div className={`font-semibold text-[16px] break-words whitespace-normal leading-tight ${isActive ? 'text-violet-500' : 'text-white'}`}>
                            {b.nome}
                          </div>
                          <div className={`font-mono text-[14px] font-semibold mt-1.5 ${isActive ? 'text-violet-500' : 'text-[#94A3B8]'}`}>
                            {isDataLoaded ? formatarMoeda(getBancaBalance(b)) : '...'}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onManageBancas?.();
                  }}
                  className="w-full py-4 bg-white/[0.02] hover:bg-white/[0.06] text-[#94A3B8] hover:text-white text-[13px] font-bold border-t border-white/[0.08] flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
                >
                  <Settings size={15} strokeWidth={2} />
                  Gerenciar Bancas
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Separator Line */}
        <div className="mx-8 mb-6 h-px bg-white/[0.04] shrink-0" />

        {/* Navegação Menu Principal */}
        <nav className="flex-1 px-8 flex flex-col gap-3.5 overflow-y-auto" style={{ padding: "10px" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === '/' && pathname === '/');

            if (item.label === 'Estratégias') {
              return (
                <button
                  key={item.label}
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenInsights?.();
                    if (mobileOpen && onClose) onClose();
                  }}
                  style={{ padding: '10px' }}
                  className={`flex items-center w-full gap-4 px-4 py-3.5 rounded-[18px] text-[14px] font-semibold transition-all duration-200 group cursor-pointer text-[#94A3B8] hover:text-white hover:bg-neutral-900 border border-transparent hover:border-white/[0.02]`}
                >
                  <Icon size={18} strokeWidth={2} className="text-[#64748B] group-hover:text-white transition-colors" />
                  {item.label}
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{ padding: '10px' }}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-[18px] text-[14px] font-semibold transition-all duration-200 group cursor-pointer ${isActive
                  ? 'bg-neutral-900 border border-neutral-800 text-violet-500 shadow-[0_4px_20px_rgba(0,0,0,0.18)]'
                  : 'text-[#94A3B8] hover:text-white hover:bg-neutral-900 border border-transparent hover:border-white/[0.02]'
                  }`}
                onClick={onClose}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-violet-500' : 'text-[#64748B] group-hover:text-white transition-colors'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions & Utilities at the Bottom */}
        <div className="px-8 pt-5 pb-10 flex flex-col gap-5" style={{ padding: "20px" }}>
          {/* Button: + Nova Aposta */}
          {onNovaAposta && (
            <button
              onClick={onNovaAposta}
              className="w-full h-[52px] bg-violet-600 hover:bg-violet-700 text-white font-bold text-[14px] rounded-[20px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_8px_24px_rgba(124,58,237,0.2)] hover:shadow-[0_8px_28px_rgba(124,58,237,0.3)] hover:scale-[1.02] active:scale-[0.98] duration-200"
            >
              <Plus size={18} strokeWidth={3} />
              Nova Aposta
            </button>
          )}

          {/* Ajuda & Sair links */}
          <div className="flex flex-col gap-1 mt-2">
            <button
              onClick={() => router.push('/ajuda')}
              className="flex items-center gap-3 px-4 py-3.5 rounded-[16px] text-[13px] font-semibold text-[#94A3B8] hover:text-white transition-all cursor-pointer hover:bg-neutral-900 text-left w-full border border-transparent hover:border-white/[0.02]"
            >
              <HelpCircle size={16} strokeWidth={2} />
              Ajuda
            </button>
            <button
              onClick={async () => {
                const { logoutAction } = await import('@/app/auth/actions');
                await logoutAction();
                router.push('/auth');
              }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-[16px] text-[13px] font-semibold text-[#94A3B8] hover:text-[#ff9aae] transition-all cursor-pointer hover:bg-[rgba(255,77,109,0.05)] text-left w-full border border-transparent hover:border-[rgba(255,77,109,0.1)]"
            >
              <LogOut size={16} strokeWidth={2} />
              Sair
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

