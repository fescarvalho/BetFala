'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatarMoeda } from '@/lib/calculations';
import { TrendingUp } from 'lucide-react';

interface BancaLineChartProps {
  dados: { data: string; banca: number; label: string }[];
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const isPositive = value >= 0;
    return (
      <div className="bg-[rgba(8,12,24,0.95)] border border-white/[0.08] rounded-xl px-3 py-2 shadow-lg backdrop-blur-md">
        <p className="text-[10px] text-[#b9cbb9] uppercase tracking-wider font-semibold mb-0.5">{label}</p>
        <p className={`text-sm font-bold font-mono ${isPositive ? 'text-[#00ff88]' : 'text-[#ffb4ab]'}`}>
          {formatarMoeda(value)}
        </p>
      </div>
    );
  }
  return null;
}

const PERIOD_OPTIONS = [
  { label: '7D',  days: 7 },
  { label: '30D', days: 30 },
];

export default function BancaLineChart({ dados }: BancaLineChartProps) {
  const [activePeriod, setActivePeriod] = useState('7D');

  const hasData = dados.length > 1;
  const maxBanca = hasData ? Math.max(...dados.map((d) => d.banca)) : 100;
  const minBanca = hasData ? Math.min(...dados.map((d) => d.banca)) : -100;

  return (
    <div className="glass-card rounded-xl p-5 md:p-6 flex flex-col">

      {/* Header row — "Evolução da Banca" + 7D/30D tabs */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-[14px] font-semibold text-[#e2e1ee]">Evolução da Banca</h2>
        <div className="flex gap-1 items-center">
          {PERIOD_OPTIONS.map((opt) => {
            const isActive = activePeriod === opt.label;
            return (
              <button
                key={opt.label}
                onClick={() => setActivePeriod(opt.label)}
                className={`text-[10px] px-2 py-0.5 rounded cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[rgba(0,255,136,0.2)] text-[#60ff99] border border-[#00ff88]/30'
                    : 'text-[#b9cbb9]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart area — h-48 matches mockup */}
      <div className="relative h-48 w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dados} margin={{ top: 8, right: 0, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="rgba(0,255,136,0.4)" stopOpacity={1} />
                  <stop offset="100%" stopColor="rgba(0,255,136,0)"   stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="data"
                tick={{ fill: '#b9cbb9', fontSize: 10, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />
              <YAxis
                tickFormatter={(v) => `R$${v}`}
                tick={{ fill: '#b9cbb9', fontSize: 10, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                domain={[Math.min(minBanca * 1.15, -40), Math.max(maxBanca * 1.15, 40)]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="4 4" />
              <Area
                type="monotone"
                dataKey="banca"
                stroke="#00ff88"
                strokeWidth={2}
                fill="url(#chartGradient)"
                dot={{ fill: '#00ff88', stroke: '#11131b', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, fill: '#00ff88', stroke: '#11131b', strokeWidth: 2 }}
                animationDuration={600}
                style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,136,0.6))' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#b9cbb9] text-sm gap-2">
            <TrendingUp size={32} className="opacity-30" />
            <span className="text-xs">Nenhuma aposta resolvida ainda.</span>
          </div>
        )}
      </div>

      {/* X-axis day labels are handled by Recharts XAxis above */}
    </div>
  );
}
