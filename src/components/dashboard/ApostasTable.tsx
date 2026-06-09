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
  Edit2,
} from 'lucide-react';
import { Aposta, ApostaStatus } from '@/types/aposta';
import { formatarMoeda } from '@/lib/calculations';

interface ApostasTableProps {
  apostas: Aposta[];
  onStatusChange: (id: string, status: ApostaStatus, valor_cashout?: number) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onEdit?: (aposta: Aposta) => void;
}

const STATUS_OPTIONS: { value: ApostaStatus; label: string }[] = [
  { value: 'Aberta', label: 'PENDENTE' },
  { value: 'Green', label: 'GANHOU' },
  { value: 'Red', label: 'PERDEU' },
  { value: 'Cashout', label: 'CASHOUT' },
  { value: 'Void', label: 'ANULADO' },
];

const PAGE_SIZE = 10;

export interface ApostaSelecao {
  jogo: string;
  mercado: string;
  selecao: string;
  status?: string;
}

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
  if (status === 'Green') return { label: 'Ganhou', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
  if (status === 'Red') return { label: 'Perdeu', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
  if (status === 'Cashout') return { label: 'Cashout', color: '#00d2ff', bg: 'rgba(0,210,255,0.1)' };
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
  if (status === 'Cashout') return '#0f293b';
  if (status === 'Void') return '#1e232e';
  return '#171717';
}

export default function ApostasTable({ apostas, onStatusChange, onDelete, onEdit }: ApostasTableProps) {
  const [page, setPage] = useState(1);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cashoutModal, setCashoutModal] = useState<{ isOpen: boolean; apostaId: string | null }>({ isOpen: false, apostaId: null });
  const [cashoutValue, setCashoutValue] = useState<string>('');

  const totalPages = Math.max(1, Math.ceil(apostas.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = apostas.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleStatus = async (id: string, status: ApostaStatus) => {
    if (status === 'Cashout') {
      setCashoutModal({ isOpen: true, apostaId: id });
      setCashoutValue('');
      return;
    }
    setLoadingId(id);
    await onStatusChange(id, status);
    setLoadingId(null);
  };

  const handleConfirmCashout = async () => {
    if (!cashoutModal.apostaId) return;
    const num = parseFloat(cashoutValue.replace(',', '.'));
    if (isNaN(num) || num < 0) {
      alert('Valor inválido!');
      return;
    }
    setCashoutModal({ isOpen: false, apostaId: null });
    setLoadingId(cashoutModal.apostaId);
    await onStatusChange(cashoutModal.apostaId, 'Cashout', num);
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
            style={{ background: '#171717' }}
          >
            <p className="text-[15px] font-semibold text-white">Nenhuma aposta encontrada</p>
            <p className="mt-2 text-[13px] text-[#94A3B8]">Toque no botão + para registrar a primeira.</p>
          </div>
        ) : (
          paginated.map((aposta) => {
            const apostaExt = aposta as Aposta & { tipo_aposta?: string; selecoes?: ApostaSelecao[] };
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
                    {(aposta.is_freebet || aposta.bonus_percent) && (
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                        {aposta.is_freebet && (
                          <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                            GRÁTIS
                          </span>
                        )}
                        {!!aposta.bonus_percent && (
                          <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,209,102,0.1)', color: '#ffd166' }}>
                            +{aposta.bonus_percent}% BÔNUS
                          </span>
                        )}
                      </div>
                    )}
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
                        color: '#22c55e',
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
                  <div className="flex flex-col border-t border-neutral-800/50">
                    {apostaExt.tipo_aposta === 'Multipla' && apostaExt.selecoes && apostaExt.selecoes.length > 0 && (
                      <div className="p-4 bg-neutral-900/50 border-b border-neutral-800">
                        <div className="flex flex-col gap-2">
                          {apostaExt.selecoes.map((sel, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 rounded-xl border border-neutral-800 bg-neutral-900/50">
                              <div className="flex flex-col">
                                <span className="text-[14px] font-semibold text-white">{sel.jogo}</span>
                                <span className="text-[12px] text-neutral-400 mt-1">{sel.mercado}: {sel.selecao}</span>
                              </div>
                              {sel.status && (
                                <span className={`text-[12px] font-bold ${sel.status === 'Green' ? 'text-green-400' : sel.status === 'Red' ? 'text-red-400' : 'text-neutral-400'}`}>
                                  {sel.status}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '20px',
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
                        <option key={opt.value} value={opt.value} style={{ background: '#171717', color: '#FFFFFF' }}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {onEdit && (
                      <button
                        onClick={() => onEdit(aposta)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          height: '44px',
                          padding: '0 16px',
                          borderRadius: '14px',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#94A3B8',
                          background: 'rgba(255,255,255,0.06)',
                          border: 'none',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Edit2 size={13} /> Editar
                      </button>
                    )}
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
                        color: '#ef4444',
                        background: 'rgba(239,68,68,0.08)',
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
              style={{ background: '#171717' }}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              className="grid h-9 w-9 place-items-center rounded-2xl text-[#94A3B8] disabled:opacity-30 transition active:scale-90"
              style={{ background: '#171717' }}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
      {/* Cashout Modal */}
      {cashoutModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" style={{ paddingLeft: '10px', paddingRight: '10px' }}>
          <div
            className="w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            style={{ background: '#171717', border: '1px solid rgba(255,255,255,0.1)', padding: '10px' }}
          >
            <h3 className="text-xl font-bold text-white mb-2">Confirmar Cashout</h3>
            <p className="text-sm text-[#94A3B8] mb-6" style={{ marginBottom: '8px', marginTop: '10px' }}>Insira o valor retornado na operação de cashout.</p>

            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] font-medium" style={{ marginLeft: '5px' }}>R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                autoFocus
                value={cashoutValue}
                onChange={(e) => setCashoutValue(e.target.value)}
                placeholder="0.00"
                className="w-full h-14 bg-white/5 rounded-2xl text-white font-medium outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-all p-5"
                style={{ paddingLeft: '48px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && cashoutValue) handleConfirmCashout();
                }}
              />
            </div>

            <div className="flex gap-3" style={{ marginTop: '20px' }}>
              <button
                onClick={() => setCashoutModal({ isOpen: false, apostaId: null })}
                className="flex-1 h-12 rounded-xl font-semibold text-[#94A3B8] bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmCashout}
                disabled={!cashoutValue}
                className="flex-1 h-12 rounded-xl font-bold text-white transition-opacity disabled:opacity-50"
                style={{ background: '#8B5CF6' }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

