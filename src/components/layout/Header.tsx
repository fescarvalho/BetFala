'use client';

import { formatarMoeda } from '@/lib/calculations';
import { KpiData } from '@/types/aposta';

interface HeaderProps {
  onNovaAposta: () => void;
  onMenuToggle?: () => void;
  activeBancaNome?: string;
  activeBancaSaldo?: number;
}

export default function Header({ onNovaAposta, onMenuToggle, activeBancaNome = 'Banca Principal', activeBancaSaldo = 0 }: HeaderProps) {
  return (
    <>
      {/* ─── Mobile TopAppBar (md:hidden) ─────────────────────────── */}
      <header className="fixed top-0 left-0 w-full z-50 flex md:hidden justify-between items-center px-6 h-16 bg-[#11131b]/70 backdrop-blur-xl border-b border-[#3b4b3d]/30">

        {/* Left: Avatar + Bank Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-[#60ff99]/30 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="User avatar"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCW1jBpOYZM1VUKfqJRbdfvHrDG2YcSVw3jV08qI_yxxmMJXthJsvjT9D49HrhVqw2xHZMlzb8JvLfeOt8EB1cVBrSytmo-I3Yl8hynmjCjmDRRhhGdbnQn8D0X2sAKEeaQRaGo7SFeGO19OPLyACBig2dJ8y4RQiTcYsJ4L1PxPcq-LFNFmqQ_T9wGK-ar5lZM-rXf-z8WIFMk0ORdxhJnrocoypIRTiMkgnaZl4aAdih3QJIMjVplR3eWq4ZLwfalL10j_DaKsWMd"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-[#b9cbb9] leading-none truncate max-w-[120px]">{activeBancaNome}</p>
            <p className="text-[14px] font-bold text-[#60ff99] leading-snug font-mono">
              {formatarMoeda(activeBancaSaldo)}
            </p>
          </div>
        </div>

        {/* Right: Notification + Menu */}
        <div className="flex items-center gap-1">
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#33343e] transition-colors active:scale-95 duration-100 cursor-pointer"
            aria-label="Notificações"
          >
            <span className="material-symbols-outlined text-[#b9cbb9] text-[22px] select-none">notifications</span>
          </button>
          <button
            onClick={onMenuToggle}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#33343e] transition-colors active:scale-95 duration-100 cursor-pointer"
            aria-label="Menu"
          >
            <span className="material-symbols-outlined text-[#b9cbb9] text-[22px] select-none">menu</span>
          </button>
        </div>
      </header>
    </>
  );
}
