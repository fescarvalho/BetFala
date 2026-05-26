'use client';

import { Bell, Menu, WalletCards } from 'lucide-react';
import { formatarMoeda } from '@/lib/calculations';

interface HeaderProps {
  onNovaAposta: () => void;
  onMenuToggle?: () => void;
  activeBancaNome?: string;
  activeBancaSaldo?: number;
}

export default function Header({
  onMenuToggle,
  activeBancaNome = 'Banca Principal',
  activeBancaSaldo = 0,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-[#3b4b3d]/30 bg-[#11131b]/95 px-5 backdrop-blur-xl md:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#60ff99]/20 bg-[#60ff99]/10 text-[#60ff99]">
          <WalletCards size={19} />
        </div>
        <div className="min-w-0">
          <p className="max-w-[138px] truncate text-[12px] font-semibold leading-none text-[#b9cbb9]">
            {activeBancaNome}
          </p>
          <p className="font-mono text-[14px] font-black leading-snug text-[#60ff99]">
            {formatarMoeda(activeBancaSaldo)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[#b9cbb9] transition hover:bg-[#33343e] active:scale-95"
          aria-label="Notificacoes"
        >
          <Bell size={18} />
        </button>
        <button
          onClick={onMenuToggle}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[#b9cbb9] transition hover:bg-[#33343e] active:scale-95"
          aria-label="Menu"
        >
          <Menu size={19} />
        </button>
      </div>
    </header>
  );
}
