'use client';

import { FiltrosState } from '@/types/aposta';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface FiltersProps {
  filtros: FiltrosState;
  onChange: (filtros: FiltrosState) => void;
}

const PERIODOS: { value: FiltrosState['periodo']; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: '7dias', label: '7 dias' },
  { value: 'mes',   label: 'Este mês' },
];

export default function Filters({ filtros, onChange }: FiltersProps) {
  const hasActiveFilters = filtros.busca.trim() !== '' || filtros.periodo !== 'todos';

  const clear = () => onChange({ busca: '', periodo: 'todos' });

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">

      {/* ── Barra de busca ───────────────────────────────── */}
      <div className="relative flex-1 w-full md:max-w-xs lg:max-w-sm">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7a8d] pointer-events-none"
        />
        <input
          id="filtro-busca"
          type="text"
          placeholder="Buscar partida ou aposta..."
          value={filtros.busca}
          onChange={(e) => onChange({ ...filtros, busca: e.target.value })}
          className="w-full bg-[#1a1d2b] rounded-xl text-[14px] text-[#e2e1ee] py-3.5 pl-11 pr-10 outline-none focus:ring-1 focus:ring-[#00ff88]/40 transition-all placeholder-[#3d4458]"
        />
        {filtros.busca && (
          <button
            onClick={() => onChange({ ...filtros, busca: '' })}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6b7a8d] hover:text-white transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* ── Chips de período + Limpar ─────────────────────── */}
      <div className="flex items-center gap-2.5 shrink-0">
        <SlidersHorizontal size={13} className="text-[#6b7a8d] shrink-0" />

        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          {PERIODOS.map((p) => {
            const isActive = filtros.periodo === p.value;
            return (
              <button
                key={p.value}
                onClick={() => onChange({ ...filtros, periodo: p.value })}
                className={`shrink-0 px-4.5 py-2 rounded-full text-[12px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#00ff88]/15 text-[#60ff99]'
                    : 'bg-[#1a1d2b] text-[#b9cbb9] hover:text-white hover:bg-[#252a3a]'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clear}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold text-[#ff8595] bg-[rgba(255,77,109,0.08)] hover:bg-[rgba(255,77,109,0.15)] transition-all cursor-pointer whitespace-nowrap"
          >
            <X size={11} />
            Limpar
          </button>
        )}
      </div>

    </div>
  );
}
