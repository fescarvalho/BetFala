'use client';

import { FiltrosState } from '@/types/aposta';
import { Search, Calendar, X } from 'lucide-react';

interface FiltersProps {
  filtros: FiltrosState;
  onChange: (filtros: FiltrosState) => void;
}

const PERIODOS = [
  { value: 'todos', label: 'Todos' },
  { value: '7dias', label: 'Últimos 7 dias' },
  { value: 'mes', label: 'Este mês' },
  { value: 'personalizado', label: 'Personalizado' },
] as const;

import { Filter, Trash2, ChevronDown } from 'lucide-react';

interface FiltersProps {
  filtros: FiltrosState;
  onChange: (filtros: FiltrosState) => void;
}

export default function Filters({ filtros, onChange }: FiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Busca */}
      <div className="relative w-full">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        />
        <input
          id="filtro-busca"
          type="text"
          placeholder="Buscar por partida ou aposta..."
          value={filtros.busca}
          onChange={(e) => onChange({ ...filtros, busca: e.target.value })}
          className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl text-sm py-3 pl-10 pr-10 outline-none focus:border-[var(--green-neon)] transition-all"
        />
        {filtros.busca && (
          <button
            onClick={() => onChange({ ...filtros, busca: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] p-1"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Date Select (Simulado como na imagem) */}
      <div className="relative w-full">
        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <select
          value={filtros.periodo}
          onChange={(e) => onChange({ ...filtros, periodo: e.target.value as any })}
          className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl text-sm py-3 pl-10 pr-10 outline-none appearance-none cursor-pointer text-center text-[var(--text-primary)] font-medium"
        >
          <option value="todos">Hoje</option>
          <option value="7dias">Últimos 7 dias</option>
          <option value="mes">Este mês</option>
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
      </div>

      {/* Filtros e Lixeira */}
      <button className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)] transition-all">
        <Filter size={16} />
        Filtros
      </button>

      <button className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)] transition-all">
        <Trash2 size={16} />
        Lixeira
      </button>
    </div>
  );
}
