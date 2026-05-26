'use client';

import { Activity, Percent, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { KpiData } from '@/types/aposta';
import { formatarMoeda } from '@/lib/calculations';

interface KpiCardsProps {
  kpis: KpiData;
}

export default function KpiCards({ kpis }: KpiCardsProps) {
  const lucroPositivo = kpis.lucroTotal >= 0;
  const roiPositivo = kpis.roi >= 0;
  const winRate = Math.max(0, Math.min(100, Math.round(kpis.taxaAcerto)));
  const ProfitIcon = lucroPositivo ? TrendingUp : TrendingDown;

  const cards = [
    {
      id: 'kpi-lucro',
      label: 'Lucro',
      value: `${lucroPositivo ? '+' : ''}${formatarMoeda(kpis.lucroTotal)}`,
      hint: `ROI ${kpis.roi >= 0 ? '+' : ''}${kpis.roi.toFixed(1)}%`,
      icon: ProfitIcon,
      valueClass: lucroPositivo ? 'text-[#60ff99]' : 'text-[#ff9aae]',
      iconClass: lucroPositivo ? 'text-[#60ff99] bg-[#60ff99]/10' : 'text-[#ff9aae] bg-[#ff4d6d]/10',
    },
    {
      id: 'kpi-taxa',
      label: 'Acerto',
      value: `${winRate}%`,
      hint: `${kpis.greens} green / ${kpis.reds} red`,
      icon: Target,
      valueClass: 'text-white',
      iconClass: 'text-[#adc6ff] bg-[#adc6ff]/10',
      progress: winRate,
    },
    {
      id: 'kpi-roi',
      label: 'ROI',
      value: `${roiPositivo ? '+' : ''}${kpis.roi.toFixed(1)}%`,
      hint: roiPositivo ? 'Acima da meta' : 'Abaixo da meta',
      icon: Percent,
      valueClass: roiPositivo ? 'text-[#adc6ff]' : 'text-[#ff9aae]',
      iconClass: 'text-[#adc6ff] bg-[#adc6ff]/10',
    },
    {
      id: 'kpi-apostas',
      label: 'Apostas',
      value: String(kpis.totalApostas),
      hint: `${kpis.abertas} em aberto`,
      icon: Activity,
      valueClass: 'text-white',
      iconClass: 'text-[#ffd166] bg-[#ffd166]/10',
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-3.5 min-[390px]:grid-cols-2 md:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            id={card.id}
            className="flex min-w-0 flex-col items-center justify-center overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#111722] px-4 py-5 text-center shadow-[0_16px_42px_rgba(0,0,0,0.22)] md:rounded-2xl md:px-5"
          >
            <div className="flex w-full items-center justify-center gap-2">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${card.iconClass}`}>
                <Icon size={16} strokeWidth={2.4} />
              </span>
              <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8a94a6]">
                {card.label}
              </span>
            </div>

            <div className="mt-4 flex w-full min-w-0 flex-col items-center">
              <p className={`max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[clamp(1.05rem,5vw,1.35rem)] font-black leading-tight tracking-normal md:text-[24px] ${card.valueClass}`}>
                {card.value}
              </p>
              <p className="mt-2 max-w-full text-[11px] font-semibold leading-snug text-[#8793a8]">
                {card.hint}
              </p>
            </div>

            {'progress' in card && (
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className="h-full rounded-full bg-[#00ff88] transition-all duration-700"
                  style={{ width: `${card.progress}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
