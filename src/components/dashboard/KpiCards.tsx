'use client';

import { KpiData } from '@/types/aposta';
import { formatarMoeda, formatarPorcentagem } from '@/lib/calculations';

interface KpiCardsProps {
  kpis: KpiData;
}

export default function KpiCards({ kpis }: KpiCardsProps) {
  const lucroPositivo = kpis.lucroTotal >= 0;
  const roiPositivo = kpis.roi >= 0;
  const winRate = Math.max(0, Math.min(100, Math.round(kpis.taxaAcerto)));

  return (
    <section className="grid grid-cols-2 gap-3.5 md:gap-4">

      {/* ── Lucro Total ── */}
      <div id="kpi-lucro" className="glass-card p-5 md:p-6 rounded-xl flex flex-col gap-1 active:scale-[0.98] transition-transform">
        <span className="text-[12px] font-medium text-[#b9cbb9]">Lucro Total</span>
        <span
          className="text-[24px] font-bold leading-tight font-mono"
          style={{ color: lucroPositivo ? '#60ff99' : '#ffb4ab' }}
        >
          {lucroPositivo ? '+' : ''}{formatarMoeda(kpis.lucroTotal)}
        </span>
        <div className="flex items-center gap-1 text-[10px]" style={{ color: '#00e479' }}>
          <span className="material-symbols-outlined text-[12px] select-none leading-none">
            {lucroPositivo ? 'trending_up' : 'trending_down'}
          </span>
          <span>ROI {lucroPositivo ? '+' : ''}{kpis.roi.toFixed(1)}%</span>
        </div>
      </div>

      {/* ── Taxa de Acerto ── */}
      <div id="kpi-taxa" className="glass-card p-5 md:p-6 rounded-xl flex flex-col gap-1 active:scale-[0.98] transition-transform">
        <span className="text-[12px] font-medium text-[#b9cbb9]">Taxa de Acerto</span>
        <span className="text-[24px] font-bold leading-tight text-white">
          {winRate}%
        </span>
        <div className="w-full bg-[#33343e] h-1 rounded-full mt-2">
          <div
            className="bg-[#00ff88] h-full rounded-full transition-all duration-700"
            style={{ width: `${winRate}%` }}
          />
        </div>
      </div>

      {/* ── ROI ── */}
      <div id="kpi-roi" className="glass-card p-5 md:p-6 rounded-xl flex flex-col gap-1 active:scale-[0.98] transition-transform">
        <span className="text-[12px] font-medium text-[#b9cbb9]">ROI</span>
        <span
          className="text-[24px] font-bold leading-tight"
          style={{ color: roiPositivo ? '#adc6ff' : '#ffb4ab' }}
        >
          {roiPositivo ? '+' : ''}{kpis.roi.toFixed(1)}%
        </span>
        <div className="flex items-center gap-1 text-[10px] text-[#adc6ff]">
          <span className="material-symbols-outlined text-[12px] select-none leading-none">target</span>
          <span>{roiPositivo ? 'Acima da meta' : 'Abaixo da meta'}</span>
        </div>
      </div>

      {/* ── Apostas ── */}
      <div id="kpi-apostas" className="glass-card p-5 md:p-6 rounded-xl flex flex-col gap-1 active:scale-[0.98] transition-transform">
        <span className="text-[12px] font-medium text-[#b9cbb9]">Apostas</span>
        <span className="text-[24px] font-bold leading-tight text-white">
          {kpis.totalApostas}
        </span>
        <span className="text-[10px] text-[#b9cbb9]">
          Ativas: {kpis.abertas}
        </span>
      </div>

    </section>
  );
}
