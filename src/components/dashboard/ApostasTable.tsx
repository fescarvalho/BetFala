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

function formatarEvento(evento: string) {
  return evento
    .replace(/\s*x\s*/i, ' x ')
    .replace(/\s*vs\.?\s*/i, ' vs ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function getCardBackground(status: ApostaStatus) {
  if (status === 'Green') return '#0e2b20';
  if (status === 'Red') return '#2b161c';
  if (status === 'Void') return '#1e232e';
  return '#0F172A';
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
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {paginated.length === 0 ? (
          <div
            className="col-span-1 lg:col-span-2 rounded-[24px] px-6 py-12 text-center"
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
                    background: getCardBackground(aposta.status),
                    borderRadius: '24px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                    overflow: 'hidden',
                    transition: 'background 0.3s ease',
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
                          fontSize: '16px',
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
                          fontSize: '13px',
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
                          fontSize: '12px',
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
                          fontSize: '11px',
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
                          fontSize: '14px',
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
                          fontSize: '13px',
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
                          fontSize: '14px',
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
                          fontSize: '14px',
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
  );
}
