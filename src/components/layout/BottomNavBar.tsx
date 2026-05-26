'use client';

import { useState } from 'react';
import { BarChart2, History, Home, Lightbulb } from 'lucide-react';

interface BottomNavBarProps {
  onNovaAposta: () => void;
}

const NAV_ITEMS = [
  { id: 'inicio', icon: Home, label: 'Inicio', section: '' },
  { id: 'relatorios', icon: BarChart2, label: 'Graficos', section: 'graficos-section' },
  { id: 'estrategias', icon: Lightbulb, label: 'Insights', section: 'graficos-section' },
  { id: 'historico', icon: History, label: 'Historico', section: 'apostas-section' },
];

export default function BottomNavBar({ onNovaAposta }: BottomNavBarProps) {
  const [activeTab, setActiveTab] = useState('inicio');
  void onNovaAposta;

  const handleNav = (id: string, section: string) => {
    setActiveTab(id);
    if (!section) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 z-50 flex w-full select-none items-center justify-around rounded-t-2xl border-t border-[#3b4b3d]/30 bg-[#0c0e16]/95 px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-md md:hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id, item.section)}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl p-2 transition active:scale-95 ${
                isActive ? 'text-[#60ff99]' : 'text-[#b9cbb9] hover:text-[#00e479]'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.8 : 2.2} />
              <span className="text-[11px] font-semibold leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
