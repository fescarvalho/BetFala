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
  X,
  Loader2
} from 'lucide-react';
import { Banca, Aposta } from '@/types/aposta';
import { formatarMoeda } from '@/lib/calculations';

const navItems = [
  { href: '/', label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/?tab=relatorios', label: 'Relatórios', icon: BarChart2 },
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
    const lucroGreens = greens.reduce((acc, a) => acc + a.stake * (a.odd - 1), 0);
    const prejuizoReds = reds.reduce((acc, a) => acc + a.stake, 0);
    const profitLoss = lucroGreens - prejuizoReds;

    return banca.saldo_inicial + profitLoss;
  };

  return (
    <>
      {/* Overlay Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/75 z-[55] md:hidden backdrop-blur-md transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-[60] w-[260px] bg-[#050816] border-r border-white/[0.03] flex flex-col transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo "PROBANK" */}
        <div className="px-6 py-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00FF88] to-[#00A855] flex items-center justify-center shadow-[0_0_20px_rgba(0,255,136,0.2)]">
            <TrendingUp size={18} color="#050816" strokeWidth={3} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white select-none">
            Pro<span className="text-[#00FF88]">Bank</span>
          </span>
          {isMockMode && (
            <span className="ml-auto rounded-full bg-[#ffd166]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ffd166]">
              Demo
            </span>
          )}
        </div>

        {/* Connection/Banca Switcher Selector */}
        <div className="px-5 mb-6 relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.05] rounded-2xl p-3.5 text-left transition-all active:scale-[0.98] cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[rgba(0,255,136,0.08)] text-[#00FF88] flex items-center justify-center shrink-0">
                <Landmark size={18} strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider leading-none mb-1 truncate">
                  Banca Ativa
                </div>
                <div className="text-[14px] font-bold text-white truncate">
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
            <div className="absolute left-5 right-5 top-full mt-2 bg-[#0F172A] border border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in flex flex-col max-h-[260px]">
              <div className="overflow-y-auto p-2 flex-1 flex flex-col gap-1">
                {bancas.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-[#94A3B8] text-center">Nenhuma banca cadastrada</div>
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
                        className={`w-full px-3 py-3 rounded-xl flex flex-col text-left transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[rgba(0,255,136,0.08)]'
                            : 'hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className={`font-semibold text-[13px] truncate w-full ${isActive ? 'text-[#00FF88]' : 'text-white'}`}>
                          {b.nome}
                        </div>
                        <div className={`font-mono text-[11px] font-semibold mt-0.5 ${isActive ? 'text-[#00CC70]' : 'text-[#94A3B8]'}`}>
                          {formatarMoeda(getBancaBalance(b))}
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
                className="w-full py-3.5 bg-white/[0.02] hover:bg-white/[0.05] text-[#94A3B8] hover:text-white text-[12px] font-bold border-t border-white/[0.06] flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
              >
                <Settings size={14} strokeWidth={2} />
                Gerenciar Bancas
              </button>
            </div>
          )}
        </div>

        {/* Navegação Menu Principal */}
        <nav className="flex-1 px-4 flex flex-col gap-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === '/' && pathname === '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[14px] font-medium transition-all duration-200 group cursor-pointer ${
                  isActive
                    ? 'bg-[rgba(0,255,136,0.08)] text-[#00FF88]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
                }`}
                onClick={onClose}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-[#00FF88]' : 'text-[#64748B] group-hover:text-white transition-colors'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions & Utilities at the Bottom */}
        <div className="p-5 flex flex-col gap-4">
          {/* Button: + Nova Aposta */}
          {onNovaAposta && (
            <button
              onClick={onNovaAposta}
              className="w-full h-12 bg-[#00FF88] hover:bg-[#00E57A] text-[#050816] font-bold text-[14px] rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_8px_24px_rgba(0,255,136,0.2)] hover:shadow-[0_8px_28px_rgba(0,255,136,0.3)] hover:scale-[1.02] active:scale-[0.98] duration-200"
            >
              <Plus size={18} strokeWidth={3} />
              Nova Aposta
            </button>
          )}

          {/* Ajuda & Sair links */}
          <div className="flex flex-col gap-0.5 mt-2">
            <button
              onClick={() => router.push('/ajuda')}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-medium text-[#64748B] hover:text-white transition-all cursor-pointer hover:bg-white/[0.04] text-left w-full"
            >
              <HelpCircle size={16} />
              Ajuda
            </button>
            <button
              onClick={() => router.push('/auth')}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-medium text-[#64748B] hover:text-[#FF4D6D] transition-all cursor-pointer hover:bg-[rgba(255,77,109,0.05)] text-left w-full"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
