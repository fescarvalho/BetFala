'use client';

import { useState } from 'react';
import { BarChart2, History, Home, Lightbulb } from 'lucide-react';

interface BottomNavBarProps {
  onNovaAposta: () => void;
}

const NAV_ITEMS = [
  { id: 'inicio', icon: Home, label: 'Início', section: '' },
  { id: 'relatorios', icon: BarChart2, label: 'Gráficos', section: 'graficos-section' },
  { id: 'estrategias', icon: Lightbulb, label: 'Insights', section: 'graficos-section' },
  { id: 'historico', icon: History, label: 'Histórico', section: 'apostas-section' },
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
    <nav
      className="fixed bottom-0 left-0 z-50 w-full md:hidden"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingTop: '12px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        paddingLeft: '24px',
        paddingRight: '24px',
        background: 'rgba(5,8,22,0.82)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        userSelect: 'none',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => handleNav(item.id, item.section)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <div
              style={{
                height: '34px',
                width: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
                background: isActive ? 'rgba(0,255,136,0.13)' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              <Icon
                size={19}
                strokeWidth={isActive ? 2.4 : 1.7}
                color={isActive ? '#00FF88' : '#94A3B8'}
              />
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                lineHeight: '1',
                color: isActive ? '#00FF88' : '#94A3B8',
                transition: 'color 0.15s',
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
