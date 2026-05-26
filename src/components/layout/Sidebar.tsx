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
  onAddBanca: (nome: string, saldoInicial: number) => Promise<boolean>;
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
  onAddBanca,
  bets,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Switcher UI state
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add banca form state
  const [newBancaNome, setNewBancaNome] = useState('');
  const [newBancaSaldo, setNewBancaSaldo] = useState('');
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAddBancaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!newBancaNome.trim()) {
      setModalError('Insira o nome da banca');
      return;
    }
    const saldo = parseFloat(newBancaSaldo || '0');
    if (isNaN(saldo) || saldo < 0) {
      setModalError('Saldo inicial inválido');
      return;
    }
    setIsSubmitting(true);
    const ok = await onAddBanca(newBancaNome.trim(), saldo);
    setIsSubmitting(false);
    if (ok) {
      setNewBancaNome('');
      setNewBancaSaldo('');
      setShowAddModal(false);
    } else {
      setModalError('Erro ao criar banca');
    }
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
        className={`fixed top-0 left-0 bottom-0 z-[60] w-[240px] bg-[#11131b] border-r border-[rgba(255,255,255,0.06)] flex flex-col transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo "PROBANK" */}
        <div className="p-6 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-3">
            <span className="text-[1.4rem] font-black tracking-wider text-[#00FF99] uppercase select-none">
              PROBANK
            </span>
            {isMockMode && (
              <span className="rounded-full border border-[#ffd166]/20 bg-[#ffd166]/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#ffd166]">
                Demo
              </span>
            )}
          </div>
        </div>

        {/* Connection/Banca Switcher Selector */}
        <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)] bg-[#0c0e16]/40 relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full flex items-center justify-between bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.04)] rounded-xl p-3 text-left transition-all active:scale-[0.99] cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[rgba(0,255,153,0.05)] border border-[rgba(0,255,153,0.12)] flex items-center justify-center shrink-0">
                <Landmark size={15} className="text-[#00FF99]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-white uppercase tracking-wider leading-none truncate max-w-[130px]">
                  {activeBanca ? activeBanca.nome : 'Sem Banca'}
                </div>
                <div className="text-[10px] text-[#00FF99] font-mono font-semibold mt-1 truncate">
                  {activeBanca ? formatarMoeda(getBancaBalance(activeBanca)) : 'R$ 0,00'}
                </div>
              </div>
            </div>
            {/* Custom SVG Down Arrow */}
            <svg
              className="text-[#8A94A6] group-hover:text-white transition-transform duration-200 shrink-0"
              style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0)' }}
              width="14"
              height="14"
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
            <div className="absolute left-4 right-4 top-full mt-1.5 bg-[#181b27] border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in flex flex-col max-h-[220px]">
              <div className="overflow-y-auto py-1 flex-1">
                {bancas.length === 0 ? (
                  <div className="px-4 py-3 text-[10px] text-[#8A94A6] text-center">Nenhuma banca cadastrada</div>
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
                        className={`w-full px-4 py-2.5 flex items-center justify-between text-left text-xs transition-colors cursor-pointer border-b border-white/[0.03] ${
                          isActive
                            ? 'bg-[rgba(0,255,153,0.04)] text-[#00FF99]'
                            : 'text-[#8A94A6] hover:text-white hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="font-semibold truncate max-w-[110px]">{b.nome}</div>
                        <div className="font-mono text-[10px] font-semibold shrink-0">
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
                  setShowAddModal(true);
                }}
                className="w-full py-2.5 bg-white/[0.03] hover:bg-white/[0.06] text-white text-[11px] font-bold border-t border-white/[0.06] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus size={12} strokeWidth={3} className="text-[#00FF99]" />
                Nova Banca
              </button>
            </div>
          )}
        </div>

        {/* Navegação Menu Principal */}
        <nav className="flex-1 py-4 px-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === '/' && pathname === '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group border cursor-pointer ${
                  isActive
                    ? 'bg-[rgba(0,255,153,0.06)] text-[#00FF99] border-[rgba(0,255,153,0.15)] font-semibold shadow-xs border-l-4 border-l-[#00FF99]'
                    : 'text-[#8A94A6] hover:text-white border-transparent hover:bg-[rgba(255,255,255,0.02)]'
                }`}
                onClick={onClose}
              >
                <Icon size={16} className={isActive ? 'text-[#00FF99]' : 'text-[#8A94A6] group-hover:text-white'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions & Utilities at the Bottom */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.06)] flex flex-col gap-2 bg-[#0c0e16]/20">
          {/* Button: + Nova Aposta */}
          {onNovaAposta && (
            <button
              onClick={onNovaAposta}
              className="w-full py-3 bg-[#00FF99] hover:bg-[#00CC7A] text-[#050816] font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,255,153,0.15)] hover:scale-[1.02] active:scale-[0.98] duration-200"
            >
              <Plus size={16} strokeWidth={3} />
              Nova Aposta
            </button>
          )}

          {/* Ajuda & Sair links */}
          <div className="flex flex-col gap-1 mt-2">
            <button
              onClick={() => router.push('/ajuda')}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-[#8A94A6] hover:text-white transition-all cursor-pointer hover:bg-[rgba(255,255,255,0.02)] text-left w-full"
            >
              <HelpCircle size={14} />
              Ajuda
            </button>
            <button
              onClick={() => router.push('/auth')}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-[#8A94A6] hover:text-white transition-all cursor-pointer hover:bg-[rgba(255,255,255,0.02)] text-left w-full"
            >
              <LogOut size={14} />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Modal Criar Nova Banca */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative z-10 w-full max-w-[340px] rounded-2xl overflow-hidden shadow-2xl bg-[#181b27] border border-white/[0.08]">
            {/* Header */}
            <div className="bg-[#12141f] px-5 py-4 flex items-center justify-between border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[rgba(0,255,153,0.1)] border border-[#00ff88]/20 flex items-center justify-center shrink-0">
                  <Landmark size={14} className="text-[#00ff88]" />
                </div>
                <h3 className="text-[14px] font-bold text-white leading-tight">Nova Banca</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center cursor-pointer text-[#b9cbb9] hover:text-white transition-colors"
              >
                <X size={12} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleAddBancaSubmit} className="p-5 flex flex-col gap-4">
              {/* Nome */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#6b7a8d] mb-1.5">
                  Nome da Banca
                </label>
                <input
                  type="text"
                  placeholder="Ex: Banca Principal, Betano"
                  value={newBancaNome}
                  onChange={(e) => setNewBancaNome(e.target.value)}
                  className="w-full bg-[#12141f] border border-white/[0.07] focus:border-[#00ff88]/50 rounded-xl px-3.5 py-2.5 text-[13px] text-[#e2e1ee] placeholder-[#3d4458] outline-none transition-colors"
                />
              </div>

              {/* Saldo Inicial */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#6b7a8d] mb-1.5">
                  Saldo Inicial (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 1000.00"
                  value={newBancaSaldo}
                  onChange={(e) => setNewBancaSaldo(e.target.value)}
                  className="w-full bg-[#12141f] border border-white/[0.07] focus:border-[#00ff88]/50 rounded-xl px-3.5 py-2.5 text-[13px] text-[#e2e1ee] placeholder-[#3d4458] outline-none transition-colors"
                />
              </div>

              {modalError && <div className="text-[10px] text-[#ff4d6d] font-semibold">{modalError}</div>}

              {/* Botões */}
              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#1e2235] border border-white/[0.07] text-[#e2e1ee] text-[12px] font-semibold hover:bg-[#252a40] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1.5 py-2.5 rounded-xl bg-[#00ff88] hover:bg-[#00e57a] text-[#003919] text-[12px] font-bold flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(0,255,136,0.2)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : 'Criar Banca'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
