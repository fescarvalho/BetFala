'use client';

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

// Tooltip com estilo de aplicativo de trading
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const isPositive = value >= 0;
    return (
      <div className="bg-[rgba(8,12,24,0.95)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold mb-1">
          {label}
        </p>
        <p className={`text-[0.95rem] font-bold font-mono ${isPositive ? 'text-[var(--green-neon)]' : 'text-[var(--red-neon)]'}`}>
          {formatarMoeda(value)}
        </p>
      </div>
    );
  }
  return null;
}

export default function BancaLineChart({ dados }: BancaLineChartProps) {
  const hasData = dados.length > 1;
  const maxBanca = Math.max(...dados.map((d) => d.banca));
  const minBanca = Math.min(...dados.map((d) => d.banca));
  const latestValue = dados[dados.length - 1]?.banca ?? 0;
  const isPositive = latestValue >= 0;

  return (
    <div className="glass-card p-6 md:p-8 flex flex-col justify-between h-[420px]">
      {/* Header do Gráfico */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Evolução da Banca
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Histórico acumulado de retorno sobre investimentos
          </p>
        </div>
        {/* Badge do Saldo Final */}
        <div
          className={`text-xs md:text-sm font-bold font-mono px-3.5 py-1.5 rounded-xl border transition-all ${
            isPositive
              ? 'bg-[rgba(0,255,153,0.04)] text-[var(--green-neon)] border-[rgba(0,255,153,0.15)] shadow-[0_0_12px_rgba(0,255,153,0.08)]'
              : 'bg-[rgba(255,77,109,0.04)] text-[var(--red-neon)] border-[rgba(255,77,109,0.15)] shadow-[0_0_12px_rgba(255,77,109,0.08)]'
          }`}
        >
          Saldo: {formatarMoeda(latestValue)}
        </div>
      </div>

      {/* Gráfico */}
      <div className="flex-1 w-full min-h-0 relative">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dados} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--green-neon)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--green-neon)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.03)"
                vertical={false}
              />
              <XAxis
                dataKey="data"
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                tickFormatter={(v) => `R$${v}`}
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                dx={-10}
                domain={[Math.min(minBanca * 1.15, -40), Math.max(maxBanca * 1.15, 40)]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" strokeWidth={1} strokeDasharray="5 5" />
              <Area
                type="monotone"
                dataKey="banca"
                stroke="var(--green-neon)"
                strokeWidth={2}
                fill="url(#areaGradient)"
                dot={{
                  fill: '#050816',
                  stroke: 'var(--green-neon)',
                  strokeWidth: 2,
                  r: 3,
                }}
                activeDot={{
                  r: 5,
                  fill: 'var(--green-neon)',
                  stroke: '#050816',
                  strokeWidth: 2,
                }}
                animationDuration={600}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] text-sm">
            <TrendingUp size={36} className="mb-2 opacity-30" />
            Nenhuma aposta resolvida para gerar o gráfico.
          </div>
        )}
      </div>
    </div>
  );
}
