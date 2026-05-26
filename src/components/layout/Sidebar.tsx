'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  History,
  Settings,
  Zap,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/?tab=graficos', label: 'Gráficos', icon: TrendingUp },
  { href: '/?tab=historico', label: 'Histórico', icon: History },
  { href: '/?tab=config', label: 'Configurações', icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  isMockMode?: boolean;
}

export default function Sidebar({ mobileOpen, onClose, isMockMode = true }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/75 z-40 md:hidden backdrop-blur-md transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-[240px] bg-[var(--bg-surface)] border-r border-[var(--border)] flex flex-col transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[var(--green-neon)] to-[var(--blue-accent)] rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(0,255,153,0.15)]">
              <Zap size={18} color="#050816" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-[1.1rem] font-black tracking-tight leading-none gradient-text">
                BetFala
              </div>
              <div className="text-[0.68rem] text-[var(--text-secondary)] font-medium mt-1">
                Gestão de Banca
              </div>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 py-6 px-4 flex flex-col gap-1">
          <div className="text-[0.62rem] font-bold tracking-widest text-[var(--text-muted)] px-3 mb-2 uppercase">
            Menu Principal
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === '/' && pathname === '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group border ${
                  isActive
                    ? 'bg-[rgba(0,255,153,0.04)] text-[var(--green-neon)] border-[rgba(0,255,153,0.12)] font-semibold shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-transparent hover:bg-[rgba(255,255,255,0.02)]'
                }`}
                onClick={onClose}
              >
                <Icon size={16} className={isActive ? 'text-[var(--green-neon)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer da sidebar com estado dinâmico */}
        <div className="p-4 border-t border-[var(--border)] mt-auto bg-[var(--bg-base)]/30">
          {isMockMode ? (
            <div className="bg-[rgba(255,209,102,0.03)] border border-[rgba(255,209,102,0.12)] rounded-xl p-3">
              <div className="text-[0.6rem] text-[var(--text-muted)] mb-1 uppercase tracking-wider font-semibold">Conexão</div>
              <div className="text-xs font-semibold text-[var(--gold)] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] animate-pulse" />
                Modo de Demonstração
              </div>
              <div className="text-[0.65rem] text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                Usando dados de exemplo. Configure o banco no seu <code className="bg-[rgba(255,255,255,0.06)] px-1 rounded">.env.local</code>.
              </div>
            </div>
          ) : (
            <div className="bg-[rgba(0,255,153,0.03)] border border-[rgba(0,255,153,0.12)] rounded-xl p-3">
              <div className="text-[0.6rem] text-[var(--text-muted)] mb-1 uppercase tracking-wider font-semibold">Conexão</div>
              <div className="text-xs font-semibold text-[var(--green-neon)] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--green-neon)] shadow-[0_0_8px_var(--green-neon)] animate-pulse" />
                Supabase Conectado
              </div>
              <div className="text-[0.65rem] text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                Sincronizando em tempo real com seu banco de dados.
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}