'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatarMoeda } from '@/lib/calculations';

interface BancaLineChartProps {
  dados: { data: string; banca: number; label: string }[];
}

// Tooltip personalizado
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const isPositive = value >= 0;
    return (
      <div
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${isPositive ? 'rgba(0,255,135,0.3)' : 'rgba(255,77,109,0.3)'}`,
          borderRadius: 10,
          padding: '10px 14px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
          {label}
        </p>
        <p
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: isPositive ? 'var(--green-neon)' : 'var(--red-neon)',
          }}
        >
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
  const isPositive = (dados[dados.length - 1]?.banca ?? 0) >= 0;

  return (
    <div className="glass-card" style={{ padding: '20px 22px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            📈 Evolução da Banca
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Lucro/prejuízo acumulado ao longo do tempo
          </p>
        </div>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: isPositive ? 'var(--green-neon)' : 'var(--red-neon)',
            background: isPositive ? 'rgba(0,255,135,0.08)' : 'rgba(255,77,109,0.08)',
            border: `1px solid ${isPositive ? 'rgba(0,255,135,0.2)' : 'rgba(255,77,109,0.2)'}`,
            padding: '4px 10px',
            borderRadius: 999,
          }}
        >
          {formatarMoeda(dados[dados.length - 1]?.banca ?? 0)}
        </div>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={dados} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#00FF87" />
                <stop offset="100%" stopColor="#4CC9F0" />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="data"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `R$${v}`}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[Math.min(minBanca * 1.1, -50), Math.max(maxBanca * 1.1, 50)]}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="banca"
              stroke="url(#lineGradient)"
              strokeWidth={2.5}
              dot={{
                fill: '#00FF87',
                strokeWidth: 0,
                r: 4,
              }}
              activeDot={{
                r: 6,
                fill: '#00FF87',
                stroke: 'rgba(0,255,135,0.3)',
                strokeWidth: 4,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div
          style={{
            height: 220,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
          }}
        >
          Nenhuma aposta resolvida ainda.
        </div>
      )}
    </div>
  );
}
