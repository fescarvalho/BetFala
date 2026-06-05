'use client';

import { Search, X } from 'lucide-react';
import { FiltrosState } from '@/types/aposta';

interface FiltersProps {
  filtros: FiltrosState;
  onChange: (filtros: FiltrosState) => void;
}

const PERIODOS: { value: FiltrosState['periodo']; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: '7dias', label: '7 dias' },
  { value: 'mes', label: 'Este mês' },
  { value: 'personalizado', label: 'Período' },
];

export default function Filters({ filtros, onChange }: FiltersProps) {
  const hasActiveFilters =
    filtros.busca.trim() !== '' ||
    filtros.periodo !== 'todos' ||
    Boolean(filtros.dataInicio) ||
    Boolean(filtros.dataFim);

  const clear = () => onChange({ busca: '', periodo: 'todos' });

  const setPeriodo = (periodo: FiltrosState['periodo']) => {
    onChange({
      ...filtros,
      periodo,
      dataInicio: periodo === 'personalizado' ? filtros.dataInicio : undefined,
      dataFim: periodo === 'personalizado' ? filtros.dataFim : undefined,
    });
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* ── Single row: search + period chips ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          overflowX: 'auto',
          /* hide scrollbar */
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="no-scrollbar"
      >
        {/* Search pill */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Search
            size={15}
            strokeWidth={1.8}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(148,163,184,0.55)',
              pointerEvents: 'none',
            }}
          />
          <input
            id="filtro-busca"
            type="text"
            placeholder="Buscar..."
            value={filtros.busca}
            onChange={(e) => onChange({ ...filtros, busca: e.target.value })}
            style={{
              height: '44px',
              width: filtros.busca ? '180px' : '130px',
              borderRadius: '22px',
              background: '#171717',
              border: 'none',
              outline: 'none',
              paddingLeft: '36px',
              paddingRight: filtros.busca ? '36px' : '16px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#FFFFFF',
              boxSizing: 'border-box',
              transition: 'width 0.2s ease',
            }}
            className="placeholder:text-[#94A3B8]/45"
          />
          {filtros.busca && (
            <button
              onClick={() => onChange({ ...filtros, busca: '' })}
              aria-label="Limpar busca"
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                height: '22px',
                width: '22px',
                display: 'grid',
                placeItems: 'center',
                borderRadius: '11px',
                color: '#94A3B8',
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <X size={11} />
            </button>
          )}
        </div>

        {/* Vertical divider */}
        <div
          style={{
            width: '1px',
            height: '22px',
            background: 'rgba(255,255,255,0.08)',
            flexShrink: 0,
          }}
        />

        {/* Period chips */}
        {PERIODOS.map((periodo) => {
          const isActive = filtros.periodo === periodo.value;
          return (
            <button
              key={periodo.value}
              onClick={() => setPeriodo(periodo.value)}
              style={{
                height: '44px',
                paddingLeft: '18px',
                paddingRight: '18px',
                borderRadius: '22px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                border: 'none',
                outline: 'none',
                background: isActive ? '#8B5CF6' : '#171717',
                color: isActive ? '#050816' : '#94A3B8',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {periodo.label}
            </button>
          );
        })}

        {/* Clear — só aparece se há filtro ativo */}
        {hasActiveFilters && (
          <button
            onClick={clear}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              height: '44px',
              paddingLeft: '12px',
              paddingRight: '12px',
              borderRadius: '22px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#94A3B8',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            <X size={12} />
            Limpar
          </button>
        )}
      </div>

      {/* ── Custom date range (só aparece se 'personalizado') ── */}
      {filtros.periodo === 'personalizado' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label
              htmlFor="filtro-data-inicio"
              style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#94A3B8', marginBottom: '8px' }}
            >
              Início
            </label>
            <input
              id="filtro-data-inicio"
              type="date"
              value={filtros.dataInicio || ''}
              onChange={(e) =>
                onChange({ ...filtros, periodo: 'personalizado', dataInicio: e.target.value || undefined })
              }
              style={{
                height: '46px',
                width: '100%',
                borderRadius: '16px',
                background: '#171717',
                border: 'none',
                outline: 'none',
                paddingLeft: '14px',
                paddingRight: '14px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#FFFFFF',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label
              htmlFor="filtro-data-fim"
              style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#94A3B8', marginBottom: '8px' }}
            >
              Fim
            </label>
            <input
              id="filtro-data-fim"
              type="date"
              value={filtros.dataFim || ''}
              onChange={(e) =>
                onChange({ ...filtros, periodo: 'personalizado', dataFim: e.target.value || undefined })
              }
              style={{
                height: '46px',
                width: '100%',
                borderRadius: '16px',
                background: '#171717',
                border: 'none',
                outline: 'none',
                paddingLeft: '14px',
                paddingRight: '14px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#FFFFFF',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

