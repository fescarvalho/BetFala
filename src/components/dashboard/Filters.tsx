'use client';

import { FiltrosState } from '@/types/aposta';
import { Search, Calendar, X, Filter, Trash2, ChevronDown } from 'lucide-react';

interface FiltersProps {
  filtros: FiltrosState;
  onChange: (filtros: FiltrosState) => void;
}

export default function Filters({ filtros, onChange }: FiltersProps) {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 w-full">
      {/* Barra de Busca - Expandida no desktop */}
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none"
        />
        <input
          id="filtro-busca"
          type="text"
          placeholder="Buscar por partida ou aposta..."
          value={filtros.busca}
          onChange={(e) => onChange({ ...filtros, busca: e.target.value })}
          className="w-full bg-[rgba(255,255,255,0.02)] border border-[var(--border)] rounded-xl text-sm py-2.5 pl-11 pr-10 outline-none focus:border-[var(--green-neon)] focus:bg-[rgba(255,255,255,0.04)] transition-all placeholder-[var(--text-muted)]"
        />
        {filtros.busca && (
          <button
            onClick={() => onChange({ ...filtros, busca: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-md transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Controles de Período e Ações - Alinhados em linha no desktop */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Seletor de Período */}
        <div className="relative min-w-[160px]">
          <Calendar 
            size={14} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" 
          />
          <select
            value={filtros.periodo}
            onChange={(e) => onChange({ ...filtros, periodo: e.target.value as any })}
            className="w-full bg-[rgba(255,255,255,0.02)] border border-[var(--border)] rounded-xl text-xs py-3 pl-10 pr-9 outline-none appearance-none cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-white/10 transition-all font-semibold uppercase tracking-wider"
          >
            <option value="todos" className="bg-[var(--bg-base)] text-white">Todos Períodos</option>
            <option value="7dias" className="bg-[var(--bg-base)] text-white">Últimos 7 dias</option>
            <option value="mes" className="bg-[var(--bg-base)] text-white">Este mês</option>
          </select>
          <ChevronDown 
            size={14} 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" 
          />
        </div>

        {/* Botão de Filtros Avançados */}
        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition-all cursor-pointer">
          <Filter size={14} />
          Filtros
        </button>

        {/* Botão de Limpeza/Lixeira */}
        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition-all cursor-pointer" title="Lixeira">
          <Trash2 size={14} />
          Lixeira
        </button>
      </div>
    </div>
  );
}
