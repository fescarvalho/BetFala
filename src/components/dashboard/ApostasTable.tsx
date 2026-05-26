'use client';

import { useState } from 'react';
import {
  CircleDot,
  Dumbbell,
  Loader2,
  Trophy,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Aposta, ApostaStatus } from '@/types/aposta';
import { formatarMoeda } from '@/lib/calculations';

interface ApostasTableProps {
  apostas: Aposta[];
  onStatusChange: (id: string, status: ApostaStatus) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

const STATUS_OPTIONS: { value: ApostaStatus; label: string }[] = [
  { value: 'Aberta', label: 'PENDENTE' },
  { value: 'Green', label: 'GANHOU' },
  { value: 'Red', label: 'PERDEU' },
  { value: 'Void', label: 'ANULADO' },
];

const PAGE_SIZE = 10;

export function getSportIcon(times: string, detalhe: string): string {
  const t = `${times} ${detalhe}`.toLowerCase();
  if (t.includes('basquete') || t.includes('nba') || t.includes('lakers') || t.includes('warriors')) {
    return 'basket';
  }
  if (t.includes('tenis') || t.includes('tennis') || t.includes('djokovic') || t.includes('alcaraz')) {
    return 'tennis';
  }
  return 'ball';
}

export function formatarDataCard(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return `${timeStr} Hoje`;
  if (diffDays === 1) return `${timeStr} Ontem`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatarDataDesktop(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]}, ${date.getFullYear()}`;
}

function getSportLabel(times: string, detalhe: string) {
  const t = `${times} ${detalhe}`.toLowerCase();
  if (t.includes('nba') || t.includes('lakers') || t.includes('warriors')) return 'NBA';
  if (t.includes('tenis') || t.includes('tennis') || t.includes('djokovic')) return 'Tenis';
  if (t.includes('basquete') || t.includes('basketball')) return 'Basquete';
  if (t.includes('ufc') || t.includes('mma')) return 'MMA';
  return 'Futebol';
}

function getStatusMeta(status: ApostaStatus) {
  if (status === 'Green') {
    return { label: 'Ganhou', className: 'border-[#00ff88]/20 bg-[#00ff88]/10 text-[#60ff99]' };
  }
  if (status === 'Red') {
    return { label: 'Perdeu', className: 'border-[#ff4d6d]/20 bg-[#ff4d6d]/10 text-[#ff9aae]' };
  }
  if (status === 'Void') {
    return { label: 'Anulado', className: 'border-[#ffd166]/20 bg-[#ffd166]/10 text-[#ffd166]' };
  }
  return { label: 'Pendente', className: 'border-[#adc6ff]/20 bg-[#adc6ff]/10 text-[#adc6ff]' };
}

function getBadgeClasses(status: ApostaStatus) {
  if (status === 'Green') return 'bg-[#003919] text-[#60ff99] border-[#005228]';
  if (status === 'Red') return 'bg-[#67001b] text-[#ffb2b7] border-[#92002a]';
  if (status === 'Void') return 'bg-[#33343e] text-[#ffd166] border-[#282a32]';
  return 'bg-[#33343e] text-[#e2e1ee] border-[#282a32]';
}

function formatarEvento(evento: string) {
  return evento
    .replace(/\s*x\s*/i, ' x ')
    .replace(/\s*vs\.?\s*/i, ' vs ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export default function ApostasTable({ apostas, onStatusChange, onDelete }: ApostasTableProps) {
  const [page, setPage] = useState(1);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(apostas.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = apostas.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleStatus = async (id: string, status: ApostaStatus) => {
    setLoadingId(id);
    await onStatusChange(id, status);
    setLoadingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
      return;
    }
    setLoadingId(id);
    await onDelete(id);
    setLoadingId(null);
    setConfirmDelete(null);
  };

  return (
    <>
      <div className="block md:hidden">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#60ff99]">
              Historico
            </p>
            <h2 className="mt-1 text-lg font-black text-white">Apostas recentes</h2>
          </div>
          <span className="text-xs font-semibold text-[#8a94a6]">{apostas.length} itens</span>
        </div>

        <div className="flex flex-col gap-3.5">
          {paginated.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-white/[0.08] bg-[#111722] px-5 py-10 text-center">
              <p className="text-sm font-bold text-white">Nenhuma aposta encontrada</p>
              <p className="mt-1 text-xs text-[#8a94a6]">Toque no botao + para registrar a primeira.</p>
            </div>
          ) : (
            paginated.map((aposta) => {
              const status = getStatusMeta(aposta.status);
              const isExpanded = expandedId === aposta.id;
              const SportIcon = getSportIcon(aposta.times_apostados, aposta.detalhe_aposta) === 'basket'
                ? CircleDot
                : getSportIcon(aposta.times_apostados, aposta.detalhe_aposta) === 'tennis'
                  ? Trophy
                  : Dumbbell;

              return (
                <article
                  key={aposta.id}
                  className="overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#111722] shadow-[0_12px_34px_rgba(0,0,0,0.2)]"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : aposta.id)}
                    className="flex w-full flex-col gap-3 p-4 text-left active:scale-[0.99]"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-white/[0.05] text-[#b9cbb9]">
                          <SportIcon size={17} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[#8a94a6]">
                            {formatarDataCard(aposta.data_criacao)}
                          </span>
                          <span className="mt-0.5 inline-flex rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-bold text-[#b9cbb9]">
                            {getSportLabel(aposta.times_apostados, aposta.detalhe_aposta)}
                          </span>
                        </span>
                      </span>
                    </span>

                    <span className="block min-w-0">
                      <span className="block text-center text-[17px] font-black leading-snug text-white">
                        {formatarEvento(aposta.times_apostados)}
                      </span>
                      <span className="mt-1 block text-center text-[12px] font-semibold leading-snug text-[#8a94a6]">
                        {aposta.detalhe_aposta}
                      </span>
                    </span>

                    <span className={`mx-auto inline-flex min-w-[112px] items-center justify-center rounded-full border px-4 py-1.5 text-center text-[12px] font-black uppercase tracking-[0.08em] ${status.className}`}>
                      {status.label}
                    </span>

                    <span className="grid w-full grid-cols-2 gap-2">
                      <span className="rounded-2xl bg-black/15 px-3 py-2 text-center">
                        <span className="block text-[10px] font-black uppercase tracking-[0.08em] text-[#8a94a6]">
                          Stake
                        </span>
                        <span className="mt-0.5 block font-mono text-sm font-black text-white">
                          {formatarMoeda(aposta.stake)}
                        </span>
                      </span>
                      <span className="rounded-2xl bg-black/15 px-3 py-2 text-center">
                        <span className="block text-[10px] font-black uppercase tracking-[0.08em] text-[#8a94a6]">
                          Odd
                        </span>
                        <span className="mt-0.5 block font-mono text-sm font-black text-[#60ff99]">
                          {aposta.odd.toFixed(2)}
                        </span>
                      </span>
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] bg-black/10 p-3.5">
                      <select
                        value={aposta.status}
                        onChange={(e) => handleStatus(aposta.id, e.target.value as ApostaStatus)}
                        disabled={loadingId === aposta.id}
                        className="h-10 flex-1 rounded-xl border border-white/[0.08] bg-[#171d2b] px-3 text-xs font-bold text-white outline-none"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-[#111722] text-white">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDelete(aposta.id)}
                        disabled={loadingId === aposta.id}
                        className="flex h-10 items-center gap-1.5 rounded-xl border border-[#ff4d6d]/20 bg-[#ff4d6d]/10 px-3 text-xs font-bold text-[#ff9aae]"
                      >
                        {loadingId === aposta.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        {confirmDelete === aposta.id ? 'Confirmar' : 'Excluir'}
                      </button>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold text-[#8a94a6]">
              Pag. {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-[#111722] text-white disabled:opacity-30"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-[#111722] text-white disabled:opacity-30"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="hidden md:block bg-[#11131b] border border-[rgba(255,255,255,0.06)] rounded-[20px] shadow-2xl relative overflow-hidden py-6">
        <div className="flex items-center justify-between px-6 md:px-8 mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#00FF99]">
            HISTORICO DE APOSTAS
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-semibold font-mono text-[#8A94A6]">
              Pag. {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                className="border border-[rgba(255,255,255,0.06)] text-[#8A94A6] hover:text-white rounded-lg transition-all inline-flex items-center justify-center p-2 disabled:opacity-30"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                className="border border-[rgba(255,255,255,0.06)] text-[#8A94A6] hover:text-white rounded-lg transition-all inline-flex items-center justify-center p-2 disabled:opacity-30"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-t border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.005)]">
                {['DATA', 'EVENTO', 'INVESTIMENTO', 'RESULTADO'].map((h) => (
                  <th key={h} className="px-6 md:px-8 py-3.5 text-left text-[10px] font-bold text-[#8A94A6] uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-sm text-[#525C6C] font-medium">
                    Nenhuma aposta encontrada.
                  </td>
                </tr>
              ) : (
                paginated.map((aposta, idx) => {
                  const isLoading = loadingId === aposta.id;

                  return (
                    <tr
                      key={aposta.id}
                      className={`border-b border-[rgba(255,255,255,0.06)] transition-all hover:bg-[rgba(255,255,255,0.02)] group ${
                        isLoading ? 'opacity-40' : 'opacity-100'
                      } ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[rgba(255,255,255,0.003)]'}`}
                    >
                      <td className="px-6 md:px-8 py-4 whitespace-nowrap">
                        <span className="text-xs font-semibold text-[#8A94A6]">
                          {formatarDataDesktop(aposta.data_criacao)}
                        </span>
                      </td>
                      <td className="px-6 md:px-8 py-4">
                        <div className="text-xs font-bold text-white leading-tight">{aposta.times_apostados}</div>
                        <div className="text-[10px] text-[#8A94A6] mt-0.5 font-medium leading-none">{aposta.detalhe_aposta}</div>
                      </td>
                      <td className="px-6 md:px-8 py-4 whitespace-nowrap">
                        <span className="text-xs font-semibold text-white">{formatarMoeda(aposta.stake)}</span>
                      </td>
                      <td className="px-6 md:px-8 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <select
                            value={aposta.status}
                            onChange={(e) => handleStatus(aposta.id, e.target.value as ApostaStatus)}
                            disabled={isLoading}
                            className={`appearance-none border px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider text-center cursor-pointer outline-none uppercase ${getBadgeClasses(aposta.status)}`}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value} className="bg-[#11131b] text-white">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <button
                            className="bg-transparent hover:bg-white/5 text-[#FF4D6D] hover:text-[#ff8595] transition-all inline-flex items-center justify-center p-2 rounded-lg ml-3 opacity-0 group-hover:opacity-100"
                            onClick={() => handleDelete(aposta.id)}
                            disabled={isLoading}
                            title={confirmDelete === aposta.id ? 'Clique de novo para confirmar' : 'Excluir aposta'}
                          >
                            {isLoading ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : confirmDelete === aposta.id ? (
                              <span className="font-bold text-[9px] uppercase tracking-wider">Confirmar</span>
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
