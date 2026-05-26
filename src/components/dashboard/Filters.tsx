'use client';

import { CalendarDays, Search, SlidersHorizontal, X } from 'lucide-react';
import { FiltrosState } from '@/types/aposta';

interface FiltersProps {
  filtros: FiltrosState;
  onChange: (filtros: FiltrosState) => void;
}

const PERIODOS: { value: FiltrosState['periodo']; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: '7dias', label: '7 dias' },
  { value: 'mes', label: 'Este mes' },
  { value: 'personalizado', label: 'Personalizado' },
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
    <div className="w-full space-y-4">
      <div className="relative">
        <Search
          size={17}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7f8ca3]"
        />
        <input
          id="filtro-busca"
          type="text"
          placeholder="Buscar partida, time ou mercado..."
          value={filtros.busca}
          onChange={(e) => onChange({ ...filtros, busca: e.target.value })}
          className="h-12 w-full rounded-2xl border border-white/[0.08] bg-[#0f1420] pl-11 pr-11 text-[14px] font-semibold text-white outline-none transition placeholder:text-[#596274] focus:border-[#00ff88]/50"
        />
        {filtros.busca && (
          <button
            onClick={() => onChange({ ...filtros, busca: '' })}
            className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-xl text-[#8a94a6] transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Limpar busca"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="rounded-[20px] border border-white/[0.07] bg-[#0f1420] p-3.5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#8a94a6]">
            <SlidersHorizontal size={14} className="text-[#60ff99]" />
            Periodo
          </div>

          {hasActiveFilters && (
            <button
              onClick={clear}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#ff4d6d]/10 px-3 py-1.5 text-[11px] font-bold text-[#ff9aae]"
            >
              <X size={12} />
              Limpar
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-4">
          {PERIODOS.map((periodo) => {
            const isActive = filtros.periodo === periodo.value;
            return (
              <button
                key={periodo.value}
                onClick={() => setPeriodo(periodo.value)}
                className={`h-10 rounded-2xl text-[12px] font-black transition active:scale-[0.98] ${
                  isActive
                    ? 'bg-[#00ff88] text-[#04110c]'
                    : 'border border-white/[0.07] bg-white/[0.035] text-[#b9cbb9]'
                }`}
              >
                {periodo.label}
              </button>
            );
          })}
        </div>

        {filtros.periodo === 'personalizado' && (
          <div className="mt-3 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
            <div>
              <label htmlFor="filtro-data-inicio" className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-[#8a94a6]">
                <CalendarDays size={13} />
                Inicio
              </label>
              <input
                id="filtro-data-inicio"
                type="date"
                value={filtros.dataInicio || ''}
                onChange={(e) =>
                  onChange({ ...filtros, periodo: 'personalizado', dataInicio: e.target.value || undefined })
                }
                className="h-11 w-full rounded-2xl border border-white/[0.08] bg-[#171d2b] px-3 text-sm font-bold text-white outline-none focus:border-[#00ff88]/50"
              />
            </div>

            <div>
              <label htmlFor="filtro-data-fim" className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-[#8a94a6]">
                <CalendarDays size={13} />
                Fim
              </label>
              <input
                id="filtro-data-fim"
                type="date"
                value={filtros.dataFim || ''}
                onChange={(e) =>
                  onChange({ ...filtros, periodo: 'personalizado', dataFim: e.target.value || undefined })
                }
                className="h-11 w-full rounded-2xl border border-white/[0.08] bg-[#171d2b] px-3 text-sm font-bold text-white outline-none focus:border-[#00ff88]/50"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
