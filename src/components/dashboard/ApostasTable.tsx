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
  ChevronDown,
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
  if (diffDays === 0) return `Hoje · ${timeStr}`;
  if (diffDays === 1) return `Ontem · ${timeStr}`;
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
  if (t.includes('tenis') || t.includes('tennis') || t.includes('djokovic')) return 'Tênis';
  if (t.includes('basquete') || t.includes('basketball')) return 'Basquete';
  if (t.includes('ufc') || t.includes('mma')) return 'MMA';
  return 'Futebol';
}

function getStatusChip(status: ApostaStatus) {
  if (status === 'Green') return { label: 'Ganhou', color: '#00FF88', bg: 'rgba(0,255,136,0.1)' };
  if (status === 'Red') return { label: 'Perdeu', color: '#ff9aae', bg: 'rgba(255,77,109,0.1)' };
  if (status === 'Void') return { label: 'Anulado', color: '#ffd166', bg: 'rgba(255,209,102,0.1)' };
  return { label: 'Pendente', color: '#adc6ff', bg: 'rgba(173,198,255,0.1)' };
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
      {/* ─── Mobile ─── */}
      <div className="block md:hidden">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {paginated.length === 0 ? (
            <div
              className="rounded-[24px] px-6 py-12 text-center"
              style={{ background: '#0F172A' }}
            >
              <p className="text-[15px] font-semibold text-white">Nenhuma aposta encontrada</p>
              <p className="mt-2 text-[13px] text-[#94A3B8]">Toque no botão + para registrar a primeira.</p>
            </div>
          ) : (
            paginated.map((aposta) => {
              const chip = getStatusChip(aposta.status);
              const isExpanded = expandedId === aposta.id;
              const SportIcon =
                getSportIcon(aposta.times_apostados, aposta.detalhe_aposta) === 'basket'
                  ? CircleDot
                  : getSportIcon(aposta.times_apostados, aposta.detalhe_aposta) === 'tennis'
                  ? Trophy
                  : Dumbbell;

              return (
                <article
                  key={aposta.id}
                  style={{
                    background: '#0F172A',
                    borderRadius: '24px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Main row — tap to expand */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : aposta.id)}
                    style={{
                      display: 'flex',
                      width: '100%',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '18px 20px',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'opacity 0.1s',
                    }}
                  >
                    {/* Sport icon */}
                    <span
                      style={{
                        height: '40px',
                        width: '40px',
                        flexShrink: 0,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: '14px',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#94A3B8',
                      }}
                    >
                      <SportIcon size={17} strokeWidth={1.8} />
                    </span>

                    {/* Event info */}
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#FFFFFF',
                          lineHeight: '1.3',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginBottom: '4px',
                        }}
                      >
                        {formatarEvento(aposta.times_apostados)}
                      </span>
                      <span
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          color: '#94A3B8',
                          lineHeight: '1.4',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginBottom: '4px',
                        }}
                      >
                        {aposta.detalhe_aposta || getSportLabel(aposta.times_apostados, aposta.detalhe_aposta || '')}
                      </span>
                      <span
                        style={{
                          display: 'block',
                          fontSize: '11px',
                          color: 'rgba(148,163,184,0.55)',
                          lineHeight: '1',
                        }}
                      >
                        {formatarDataCard(aposta.data_criacao)}
                      </span>
                    </span>

                    {/* Right side */}
                    <span
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '5px',
                        flexShrink: 0,
                        minWidth: '72px',
                      }}
                    >
                      <span
                        style={{
                          borderRadius: '20px',
                          padding: '4px 10px',
                          fontSize: '10px',
                          fontWeight: 600,
                          color: chip.color,
                          background: chip.bg,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {chip.label}
                      </span>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatarMoeda(aposta.stake)}
                      </span>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#00FF88',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        @{aposta.odd.toFixed(2)}
                      </span>
                    </span>

                    {/* Expand chevron */}
                    <ChevronDown
                      size={16}
                      strokeWidth={1.8}
                      style={{
                        flexShrink: 0,
                        color: 'rgba(148,163,184,0.4)',
                        transition: 'transform 0.2s',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>

                  {/* Expanded actions */}
                  {isExpanded && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '0 20px 20px 20px',
                      }}
                    >
                      <select
                        value={aposta.status}
                        onChange={(e) => handleStatus(aposta.id, e.target.value as ApostaStatus)}
                        disabled={loadingId === aposta.id}
                        style={{
                          flex: 1,
                          height: '44px',
                          borderRadius: '14px',
                          padding: '0 14px',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#FFFFFF',
                          background: 'rgba(255,255,255,0.06)',
                          border: 'none',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} style={{ background: '#0F172A', color: '#FFFFFF' }}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDelete(aposta.id)}
                        disabled={loadingId === aposta.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          height: '44px',
                          padding: '0 16px',
                          borderRadius: '14px',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#ff9aae',
                          background: 'rgba(255,77,109,0.08)',
                          border: 'none',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {loadingId === aposta.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
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
          <div className="mt-6 flex items-center justify-between px-1">
            <span className="text-[12px] font-medium text-[#94A3B8]">
              Pág. {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                className="grid h-9 w-9 place-items-center rounded-2xl text-[#94A3B8] disabled:opacity-30 transition active:scale-90"
                style={{ background: '#0F172A' }}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                className="grid h-9 w-9 place-items-center rounded-2xl text-[#94A3B8] disabled:opacity-30 transition active:scale-90"
                style={{ background: '#0F172A' }}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Desktop ─── */}
      <div
        className="hidden md:block rounded-[20px] relative overflow-hidden py-6"
        style={{ background: '#0F172A', boxShadow: '0 4px 20px rgba(0,0,0,0.18)' }}
      >
        <div className="flex items-center justify-between px-6 md:px-8 mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#00FF88]">
            Histórico de apostas
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-semibold font-mono text-[#94A3B8]">
              Pág. {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                className="text-[#94A3B8] hover:text-white rounded-xl transition-all inline-flex items-center justify-center p-2 disabled:opacity-30"
                style={{ background: 'rgba(255,255,255,0.04)' }}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                className="text-[#94A3B8] hover:text-white rounded-xl transition-all inline-flex items-center justify-center p-2 disabled:opacity-30"
                style={{ background: 'rgba(255,255,255,0.04)' }}
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
              <tr style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['DATA', 'EVENTO', 'INVESTIMENTO', 'RESULTADO'].map((h) => (
                  <th
                    key={h}
                    className="px-6 md:px-8 py-3.5 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-sm text-[#94A3B8]/50 font-medium">
                    Nenhuma aposta encontrada.
                  </td>
                </tr>
              ) : (
                paginated.map((aposta, idx) => {
                  const isLoading = loadingId === aposta.id;

                  return (
                    <tr
                      key={aposta.id}
                      className={`transition-all hover:bg-white/[0.015] group ${
                        isLoading ? 'opacity-40' : 'opacity-100'
                      } ${idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.008]'}`}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <td className="px-6 md:px-8 py-4 whitespace-nowrap">
                        <span className="text-xs font-medium text-[#94A3B8]">
                          {formatarDataDesktop(aposta.data_criacao)}
                        </span>
                      </td>
                      <td className="px-6 md:px-8 py-4">
                        <div className="text-xs font-semibold text-white leading-tight">{aposta.times_apostados}</div>
                        <div className="text-[10px] text-[#94A3B8] mt-0.5 font-medium leading-none">{aposta.detalhe_aposta}</div>
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
                            className={`appearance-none border px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider text-center cursor-pointer outline-none uppercase ${getBadgeClasses(aposta.status)}`}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value} className="bg-[#0F172A] text-white">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <button
                            className="bg-transparent hover:bg-white/5 text-[#FF4D6D] hover:text-[#ff8595] transition-all inline-flex items-center justify-center p-2 rounded-xl ml-3 opacity-0 group-hover:opacity-100"
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
