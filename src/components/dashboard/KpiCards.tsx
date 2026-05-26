'use client';

import { KpiData } from '@/types/aposta';
import { formatarMoeda, formatarPorcentagem } from '@/lib/calculations';
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart2,
  DollarSign,
} from 'lucide-react';

interface KpiCardsProps {
  kpis: KpiData;
}

interface KpiCardItem {
  id: string;
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  bgGlow: string;
  trend?: 'up' | 'down' | 'neutral';
}

export default function KpiCards({ kpis }: KpiCardsProps) {
  const cards: KpiCardItem[] = [
    {
      id: 'kpi-lucro',
      label: 'Lucro Total',
      value: formatarMoeda(kpis.lucroTotal),
      sub: `${kpis.greens}G · ${kpis.reds}R · ${kpis.voids}V`,
      icon: <DollarSign size={20} />,
      color: kpis.lucroTotal >= 0 ? 'var(--green-neon)' : 'var(--red-neon)',
      bgGlow:
        kpis.lucroTotal >= 0
          ? 'rgba(0,255,135,0.08)'
          : 'rgba(255,77,109,0.08)',
      trend: kpis.lucroTotal >= 0 ? 'up' : 'down',
    },
    {
      id: 'kpi-taxa',
      label: 'Taxa de Acerto',
      value: formatarPorcentagem(kpis.taxaAcerto),
      sub: `${kpis.greens} de ${kpis.greens + kpis.reds} resolvidas`,
      icon: <Target size={20} />,
      color:
        kpis.taxaAcerto >= 55
          ? 'var(--green-neon)'
          : kpis.taxaAcerto >= 40
          ? 'var(--gold)'
          : 'var(--red-neon)',
      bgGlow:
        kpis.taxaAcerto >= 55
          ? 'rgba(0,255,135,0.08)'
          : 'rgba(255,209,102,0.08)',
      trend: kpis.taxaAcerto >= 50 ? 'up' : 'down',
    },
    {
      id: 'kpi-roi',
      label: 'ROI',
      value: formatarPorcentagem(kpis.roi),
      sub: `Investido: ${formatarMoeda(kpis.totalInvestido)}`,
      icon: <BarChart2 size={20} />,
      color:
        kpis.roi >= 0 ? 'var(--green-neon)' : 'var(--red-neon)',
      bgGlow:
        kpis.roi >= 0 ? 'rgba(0,255,135,0.08)' : 'rgba(255,77,109,0.08)',
      trend: kpis.roi >= 0 ? 'up' : 'down',
    },
    {
      id: 'kpi-apostas',
      label: 'Total de Apostas',
      value: String(kpis.totalApostas),
      sub: `${kpis.abertas} abertas · ${kpis.voids} void`,
      icon: <BarChart2 size={20} />,
      color: 'var(--blue-accent)',
      bgGlow: 'rgba(76,201,240,0.08)',
      trend: 'neutral',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {cards.map((card) => (
        <div
          key={card.id}
          id={card.id}
          className="bg-[#0A1C17] border border-[rgba(0,255,135,0.05)] rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden"
        >
          {/* Faint background watermark icon (Simulated by large opacity-5 icon) */}
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] transform scale-[3] pointer-events-none" style={{ color: card.color }}>
            {card.icon}
          </div>

          {/* Header do card: Icon + Label */}
          <div className="flex items-center gap-1.5 mb-2 relative z-10">
            <div style={{ color: card.color }} className="opacity-80">
              {card.trend === 'up' && <TrendingUp size={14} />}
              {card.trend === 'down' && <TrendingDown size={14} />}
              {card.trend === 'neutral' && <BarChart2 size={14} />}
            </div>
            <span className="text-[0.65rem] sm:text-[0.7rem] text-[var(--text-secondary)] font-medium uppercase tracking-wider truncate">
              {card.label}
            </span>
          </div>

          {/* Valor */}
          <div
            className="text-[1.35rem] sm:text-[1.8rem] font-bold tracking-tight mb-2 relative z-10 truncate"
            style={{ color: card.color }}
          >
            {card.value}
          </div>

          {/* Subtítulo */}
          <div className="flex items-center gap-1.5 opacity-60 relative z-10">
            <span className="text-[0.6rem] sm:text-[0.7rem] text-white truncate">
              {card.sub}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
