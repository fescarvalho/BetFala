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
  glowColor: string;
  trend?: 'up' | 'down' | 'neutral';
}

export default function KpiCards({ kpis }: KpiCardsProps) {
  const cards: KpiCardItem[] = [
    {
      id: 'kpi-lucro',
      label: 'Lucro Total',
      value: formatarMoeda(kpis.lucroTotal),
      sub: `${kpis.greens} Greens · ${kpis.reds} Reds · ${kpis.voids} Voids`,
      icon: <DollarSign size={20} />,
      color: kpis.lucroTotal >= 0 ? 'var(--green-neon)' : 'var(--red-neon)',
      glowColor: kpis.lucroTotal >= 0 ? 'rgba(0, 255, 153, 0.15)' : 'rgba(255, 77, 109, 0.15)',
      trend: kpis.lucroTotal >= 0 ? 'up' : 'down',
    },
    {
      id: 'kpi-taxa',
      label: 'Taxa de Acerto',
      value: formatarPorcentagem(kpis.taxaAcerto),
      sub: `${kpis.greens} de ${kpis.greens + kpis.reds} resolvidas`,
      icon: <Target size={20} />,
      color: 'var(--text-primary)',
      glowColor: 'rgba(255, 255, 255, 0.08)',
      trend: kpis.taxaAcerto >= 50 ? 'up' : 'down',
    },
    {
      id: 'kpi-roi',
      label: 'ROI',
      value: formatarPorcentagem(kpis.roi),
      sub: `Total investido: ${formatarMoeda(kpis.totalInvestido)}`,
      icon: <TrendingUp size={20} />,
      color: kpis.roi >= 0 ? 'var(--green-neon)' : 'var(--red-neon)',
      glowColor: kpis.roi >= 0 ? 'rgba(0, 255, 153, 0.15)' : 'rgba(255, 77, 109, 0.15)',
      trend: kpis.roi >= 0 ? 'up' : 'down',
    },
    {
      id: 'kpi-apostas',
      label: 'Total de Apostas',
      value: String(kpis.totalApostas),
      sub: `${kpis.abertas} em andamento · ${kpis.voids} anuladas`,
      icon: <BarChart2 size={20} />,
      color: 'var(--blue-accent)',
      glowColor: 'rgba(76, 201, 240, 0.15)',
      trend: 'neutral',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:gap-6">
      {cards.map((card) => (
        <div
          key={card.id}
          id={card.id}
          className="glass-card p-6 md:p-8 flex flex-col justify-between min-h-[140px] md:min-h-[180px]"
          style={{
            background: 'linear-gradient(135deg, rgba(14, 22, 40, 0.5) 0%, rgba(10, 15, 30, 0.8) 100%)',
          }}
        >
          {/* Faint background watermark icon inside card */}
          <div 
            className="absolute -right-4 -bottom-4 opacity-[0.02] transform scale-[4] pointer-events-none transition-transform duration-500 group-hover:scale-[4.5]" 
            style={{ color: card.color }}
          >
            {card.icon}
          </div>

          {/* Top of Card: Label and Small Trend Icon */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-[0.68rem] md:text-[0.75rem] text-[var(--text-secondary)] font-semibold uppercase tracking-wider">
              {card.label}
            </span>
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]"
              style={{ color: card.color }}
            >
              {card.trend === 'up' && <TrendingUp size={14} />}
              {card.trend === 'down' && <TrendingDown size={14} />}
              {card.trend === 'neutral' && <BarChart2 size={14} />}
            </div>
          </div>

          {/* Primary Big Value */}
          <div className="relative z-10">
            <div
              className="text-2xl md:text-4xl font-extrabold tracking-tight mb-2 font-mono"
              style={{ 
                color: card.color,
                textShadow: card.glowColor !== 'rgba(255,255,255,0.08)' ? `0 0 15px ${card.glowColor}` : 'none'
              }}
            >
              {card.value}
            </div>

            {/* Subtext info */}
            <div className="text-[0.72rem] md:text-[0.78rem] text-[var(--text-secondary)] font-medium mt-1">
              {card.sub}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
