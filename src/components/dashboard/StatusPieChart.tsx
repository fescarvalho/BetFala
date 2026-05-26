'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { KpiData } from '@/types/aposta';

interface StatusPieChartProps {
  kpis: KpiData;
}

const COLORS = {
  Green: '#00FF87',
  Red: '#FF4D6D',
  Aberta: '#4CC9F0',
  Void: '#FFD166',
};

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}) {
  if (active && payload && payload.length) {
    const { name, value, payload: p } = payload[0];
    return (
      <div
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${p.color}40`,
          borderRadius: 10,
          padding: '8px 14px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{name}</p>
        <p style={{ fontSize: '1rem', fontWeight: 700, color: p.color }}>
          {value} apostas
        </p>
      </div>
    );
  }
  return null;
}

function CustomLegend({ payload }: {
  payload?: Array<{ value: string; color: string }>;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '0 16px',
      }}
    >
      {payload?.map((entry) => (
        <div
          key={entry.value}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.8rem',
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: entry.color,
              flexShrink: 0,
            }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function StatusPieChart({ kpis }: StatusPieChartProps) {
  const data = [
    { name: 'Green', value: kpis.greens, color: COLORS.Green },
    { name: 'Red', value: kpis.reds, color: COLORS.Red },
    { name: 'Aberta', value: kpis.abertas, color: COLORS.Aberta },
    { name: 'Void', value: kpis.voids, color: COLORS.Void },
  ].filter((d) => d.value > 0);

  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="glass-card" style={{ padding: '20px 22px' }}>
      <div style={{ marginBottom: 20 }}>
        <h3
          style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          🎯 Distribuição por Status
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
          {total} apostas no total
        </p>
      </div>

      {total > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="transparent"
                  style={{ filter: `drop-shadow(0 0 6px ${entry.color}60)` }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              content={<CustomLegend />}
              layout="vertical"
              align="right"
              verticalAlign="middle"
            />
          </PieChart>
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
          Nenhuma aposta registrada.
        </div>
      )}
    </div>
  );
}
