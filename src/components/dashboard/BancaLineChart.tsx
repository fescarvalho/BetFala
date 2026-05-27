'use client';

import { useState, useMemo } from 'react';
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
import { PlusCircle, TrendingUp } from 'lucide-react';

interface BancaLineChartProps {
  dados: { data: string; banca: number; label: string }[];
  onAddAposta?: () => void;
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
      <div
        style={{
          background: 'rgba(15,23,42,0.97)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px',
          padding: '10px 14px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}
      >
        <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500, marginBottom: '4px' }}>{label}</p>
        <p style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'monospace', color: isPositive ? '#00FF88' : '#ffb4ab' }}>
          {formatarMoeda(value)}
        </p>
      </div>
    );
  }
  return null;
}

const PERIOD_OPTIONS = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
];

export default function BancaLineChart({ dados, onAddAposta }: BancaLineChartProps) {
  const [activePeriod, setActivePeriod] = useState('7D');

  const dadosFiltrados = useMemo(() => {
    if (dados.length <= 1) return dados;
    const limit = activePeriod === '7D' ? 7 : 30;
    if (dados.length <= limit + 1) return dados;
    
    const sliced = dados.slice(-limit);
    const beforeSliced = dados[dados.length - limit - 1];
    
    return [
      { ...beforeSliced, data: 'Ant.' },
      ...sliced
    ];
  }, [dados, activePeriod]);

  const hasData = dadosFiltrados.length > 1;
  const maxBanca = hasData ? Math.max(...dadosFiltrados.map((d) => d.banca)) : 100;
  const minBanca = hasData ? Math.min(...dadosFiltrados.map((d) => d.banca)) : -100;

  return (
    <div
      style={{
        background: '#0F172A',
        borderRadius: '28px',
        padding: '26px 24px',
        minHeight: '260px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexShrink: 0,
        }}
      >
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF', lineHeight: '1' }}>
          Evolução da banca
        </h2>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {PERIOD_OPTIONS.map((opt) => {
            const isActive = activePeriod === opt.label;
            return (
              <button
                key={opt.label}
                onClick={() => setActivePeriod(opt.label)}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '6px 14px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: isActive ? 'rgba(0,255,136,0.12)' : 'transparent',
                  color: isActive ? '#00FF88' : '#94A3B8',
                  border: 'none',
                  outline: 'none',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart area */}
      <div style={{ flex: 1, minHeight: '180px', position: 'relative' }}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dadosFiltrados} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="rgba(0,255,136,0.3)" stopOpacity={1} />
                  <stop offset="100%" stopColor="rgba(0,255,136,0)"   stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis
                dataKey="data"
                tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />
              <YAxis
                tickFormatter={(v) => `R$${v}`}
                tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                domain={[Math.min(minBanca * 1.15, -40), Math.max(maxBanca * 1.15, 40)]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.07)', strokeWidth: 1 }} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.05)" strokeWidth={1} strokeDasharray="4 4" />
              <Area
                type="monotone"
                dataKey="banca"
                stroke="#00FF88"
                strokeWidth={2.5}
                fill="url(#chartGradient)"
                dot={{ fill: '#00FF88', stroke: '#0F172A', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, fill: '#00FF88', stroke: '#0F172A', strokeWidth: 2 }}
                animationDuration={600}
                style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,136,0.45))' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              padding: '24px',
            }}
          >
            <TrendingUp size={40} color="rgba(148,163,184,0.2)" strokeWidth={1.5} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#94A3B8', lineHeight: '1.5', marginBottom: '6px' }}>
                Nenhuma aposta finalizada
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.55)', lineHeight: '1.5' }}>
                Registre apostas para ver a evolução aqui
              </p>
            </div>
            {onAddAposta && (
              <button
                onClick={onAddAposta}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '20px',
                  background: 'rgba(0,255,136,0.1)',
                  color: '#00FF88',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '10px 20px',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '4px',
                  transition: 'all 0.15s',
                }}
              >
                <PlusCircle size={15} />
                Adicionar primeira aposta
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
