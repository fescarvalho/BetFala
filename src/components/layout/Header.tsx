'use client';

import { Bell, Menu } from 'lucide-react';

interface HeaderProps {
  onNovaAposta: () => void;
  onMenuToggle?: () => void;
}

export default function Header({ onNovaAposta, onMenuToggle }: HeaderProps) {
  return (
    <header className="h-[76px] flex items-center justify-between px-6 md:px-8 border-b border-[var(--border)] bg-[var(--bg-base)]/50 backdrop-blur-md sticky top-0 z-30">
      {/* Esquerda: Espaço reservado ou título adaptável se necessário */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.03)] transition-colors"
          >
            <Menu size={20} />
          </button>
        )}
      </div>

      {/* Direita: Notificações + Avatar */}
      <div className="flex items-center gap-4">
        {/* Notificações Bell Icon */}
        <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 rounded-xl hover:bg-[rgba(255,255,255,0.03)] transition-all relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--green-neon)] shadow-[0_0_8px_var(--green-neon)]" />
        </button>

        {/* Linha Divisora Vertical */}
        <div className="w-[1px] h-5 bg-[var(--border)]" />

        {/* Avatar com Borda Neon sutil */}
        <div className="relative group cursor-pointer">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--green-neon)] to-[var(--blue-accent)] rounded-full opacity-35 group-hover:opacity-75 blur-xs transition-opacity duration-300" />
          <div className="relative w-9 h-9 rounded-full bg-[var(--bg-surface)] border border-[rgba(255,255,255,0.1)] overflow-hidden">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
              alt="User Avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
