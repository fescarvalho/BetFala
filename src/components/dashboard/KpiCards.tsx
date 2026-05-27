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
      sub: `ROI ${kpis.roi >= 0 ? '+' : ''}${kpis.roi.toFixed(1)}%`,
      icon: ProfitIcon,
      valueColor: lucroPositivo ? '#00FF88' : '#ff9aae',
      iconColor: lucroPositivo ? '#00FF88' : '#ff9aae',
      iconBg: lucroPositivo ? 'rgba(0,255,136,0.12)' : 'rgba(255,77,109,0.12)',
    },
    {
      id: 'kpi-taxa',
      label: 'Acerto',
      value: `${winRate}%`,
      sub: `${kpis.greens}G / ${kpis.reds}R`,
      icon: Target,
      valueColor: '#FFFFFF',
      iconColor: '#adc6ff',
      iconBg: 'rgba(173,198,255,0.12)',
      progress: winRate,
    },
    {
      id: 'kpi-roi',
      label: 'ROI',
      value: `${roiPositivo ? '+' : ''}${kpis.roi.toFixed(1)}%`,
      sub: roiPositivo ? 'Acima da meta' : 'Abaixo da meta',
      icon: Percent,
      valueColor: roiPositivo ? '#adc6ff' : '#ff9aae',
      iconColor: '#adc6ff',
      iconBg: 'rgba(173,198,255,0.12)',
    },
    {
      id: 'kpi-apostas',
      label: 'Apostas',
      value: String(kpis.totalApostas),
      sub: `${kpis.abertas} em aberto`,
      icon: Activity,
      valueColor: '#FFFFFF',
      iconColor: '#ffd166',
      iconBg: 'rgba(255,209,102,0.12)',
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            id={card.id}
            className="flex flex-col"
            style={{
              background: '#0F172A',
              borderRadius: '24px',
              padding: '22px 20px',
              minHeight: '140px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
            }}
          >
            {/* Icon */}
            <span
              className="grid place-items-center"
              style={{
                height: '36px',
                width: '36px',
                borderRadius: '12px',
                background: card.iconBg,
                color: card.iconColor,
                marginBottom: '14px',
                flexShrink: 0,
              }}
            >
              <Icon size={17} strokeWidth={2} />
            </span>

            {/* Label */}
            <p
              className="font-medium"
              style={{
                fontSize: '12px',
                color: '#94A3B8',
                lineHeight: '1',
                marginBottom: '8px',
                letterSpacing: '0.01em',
              }}
            >
              {card.label}
            </p>

            {/* Value */}
            <p
              className="font-mono font-bold"
              style={{
                fontSize: 'clamp(16px, 4.5vw, 26px)',
                color: card.valueColor,
                lineHeight: '1.15',
                marginBottom: '6px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {card.value}
            </p>

            {/* Sub */}
            <p
              className="font-medium"
              style={{
                fontSize: '11px',
                color: '#94A3B8',
                lineHeight: '1.4',
                marginTop: 'auto',
              }}
            >
              {card.sub}
            </p>

            {/* Progress bar */}
            {'progress' in card && (
              <div
                className="overflow-hidden rounded-full"
                style={{
                  marginTop: '12px',
                  height: '3px',
                  background: 'rgba(255,255,255,0.07)',
                }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${card.progress}%`, background: '#00FF88' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
