'use client';

import { useState } from 'react';

interface BottomNavBarProps {
  onNovaAposta: () => void;
}

const NAV_ITEMS = [
  { id: 'inicio',     icon: 'dashboard',  label: 'Visão Geral', section: '' },
  { id: 'relatorios', icon: 'bar_chart',  label: 'Relatórios',  section: 'graficos-section' },
  { id: 'estrategias',icon: 'insights',   label: 'Estratégias', section: 'graficos-section' },
  { id: 'historico',  icon: 'history',    label: 'Histórico',   section: 'apostas-section' },
];

export default function BottomNavBar({ onNovaAposta }: BottomNavBarProps) {
  const [activeTab, setActiveTab] = useState('inicio');

  const handleNav = (id: string, section: string) => {
    setActiveTab(id);
    if (!section) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* ─── FAB (Mobile only) ─────────────────────────────────────── */}
      <button
        onClick={onNovaAposta}
        className="fixed right-6 bottom-[88px] w-14 h-14 bg-[#00ff88] text-[#003919] rounded-full flex items-center justify-center z-50 md:hidden active:scale-90 transition-transform duration-150 cursor-pointer fab-pulse"
        aria-label="Nova aposta"
        title="Nova aposta"
      >
        <span className="material-symbols-outlined text-[32px] font-bold select-none leading-none">add</span>
      </button>

      {/* ─── Bottom Navigation Bar (Mobile only) ───────────────────── */}
      <nav className="fixed bottom-0 left-0 w-full z-50 md:hidden flex justify-around items-center px-6 py-2 bg-[#0c0e16]/90 backdrop-blur-md border-t border-[#3b4b3d]/30 rounded-t-xl select-none">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id, item.section)}
              className={`flex flex-col items-center justify-center p-2 gap-0.5 transition-all duration-150 active:scale-90 cursor-pointer ${
                isActive ? 'text-[#60ff99]' : 'text-[#b9cbb9] hover:text-[#00e479]'
              }`}
            >
              <span
                className="material-symbols-outlined mb-0.5 text-[24px] select-none"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className="text-[12px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
