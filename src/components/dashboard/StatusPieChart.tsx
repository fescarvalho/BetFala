'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { KpiData } from '@/types/aposta';

interface StatusPieChartProps {
  kpis: KpiData;
}

const COLORS = {
  Green: '#00FF99',
  Red: '#FF4D6D',
  Aberta: '#4CC9F0',
  Void: '#FFD166',
};

// Tooltip customizado premium
function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}) {
  if (active && payload && payload.length) {
    const { name, value, payload: p } = payload[0];
    return (
      <div className="bg-[rgba(8,12,24,0.95)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold mb-0.5">{name}</p>
        <p className="text-[0.9rem] font-bold font-mono" style={{ color: p.color }}>
          {value} {value === 1 ? 'aposta' : 'apostas'}
        </p>
      </div>
    );
  }
  return null;
}

export default function StatusPieChart({ kpis }: StatusPieChartProps) {
  const data = [
    { name: 'Green', value: kpis.greens, color: COLORS.Green },
    { name: 'Red', value: kpis.reds, color: COLORS.Red },
    { name: 'Aberta', value: kpis.abertas, color: COLORS.Aberta },
    { name: 'Void', value: kpis.voids, color: COLORS.Void },
  ].filter((d) => d.value > 0);

  const total = kpis.totalApostas;
  const totalResolvidas = kpis.greens + kpis.reds;
  const winRate = totalResolvidas > 0 ? Math.round((kpis.greens / totalResolvidas) * 100) : 0;

  return (
    <div className="bg-[#11131b] border border-white/[0.06] rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-[#00FF99]/20 p-4 md:p-6 flex flex-col">
      {/* Header do card */}
      <div className="mb-3 md:mb-6">
        <h3 className="text-[11px] md:text-sm font-bold uppercase tracking-wider text-white">
          Distribuição de Status
        </h3>
        <p className="hidden md:block text-xs text-[#8A94A6] mt-1">
          Proporção e taxa de assertividade
        </p>
      </div>

      {total > 0 ? (
        <div className="flex-1 flex flex-col justify-center gap-6">
          {/* Container do Donut + Central Text */}
          <div className="relative w-full h-[180px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={82}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="transparent"
                      className="transition-opacity duration-300 hover:opacity-90 outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Texto centralizado com Win Rate */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
              <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">
                Win Rate
              </span>
              <span className="text-2xl font-black text-[var(--green-neon)] font-mono mt-0.5">
                {winRate}%
              </span>
            </div>
          </div>

          {/* Legenda Customizada Premium */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-2">
            {[
              { label: 'Green', count: kpis.greens, color: COLORS.Green },
              { label: 'Red', count: kpis.reds, color: COLORS.Red },
              { label: 'Aberta', count: kpis.abertas, color: COLORS.Aberta },
              { label: 'Void', count: kpis.voids, color: COLORS.Void },
            ].map((item) => {
              const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
              return (
                <div key={item.label} className="flex items-center justify-between border-b border-[var(--border)] pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-medium text-[var(--text-secondary)]">{item.label}</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-[var(--text-primary)]">
                    {item.count} <span className="text-[10px] text-[var(--text-muted)] font-normal">({percentage}%)</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] text-sm">
          <span className="text-3xl mb-2 opacity-30">🎯</span>
          Nenhuma aposta para mostrar distribuição.
        </div>
      )}
    </div>
  );
}
