'use client';

import { useState, useEffect } from 'react';
import { Aposta, ApostaStatus } from '@/types/aposta';
import { formatarMoeda } from '@/lib/calculations';
import { Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

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

// Helper to determine the sport icon based on game details
export function getSportIcon(times: string, detalhe: string): string {
  const t = (times + ' ' + detalhe).toLowerCase();
  if (
    t.includes('futebol') ||
    t.includes('soccer') ||
    t.includes('vs') && !t.includes('lakers') && !t.includes('warriors') && !t.includes('djokovic') ||
    t.includes('real madrid') ||
    t.includes('man city') ||
    t.includes('flamengo') ||
    t.includes('palmeiras') ||
    t.includes('corinthians') ||
    t.includes('são paulo') ||
    t.includes('barcelona') ||
    t.includes('brasileirão') ||
    t.includes('champions') ||
    t.includes('dortmund')
  ) {
    return 'sports_soccer';
  }
  if (
    t.includes('basquete') ||
    t.includes('nba') ||
    t.includes('lakers') ||
    t.includes('warriors') ||
    t.includes('celtics') ||
    t.includes('bulls') ||
    t.includes('basketball') ||
    t.includes('nuggets')
  ) {
    return 'sports_basketball';
  }
  if (
    t.includes('tênis') ||
    t.includes('tennis') ||
    t.includes('djokovic') ||
    t.includes('alcaraz') ||
    t.includes('nadal') ||
    t.includes('federer') ||
    t.includes('sinner')
  ) {
    return 'sports_tennis';
  }
  return 'sports_handball'; // Generic symbol
}

// Helper to format relative time for card view — shows "14:20 • Hoje" like mockup
export function formatarDataCard(dateStr: string): string {
  const date = new Date(dateStr);
  const now  = new Date();
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const diffMs   = now.getTime() - date.getTime();
  const diffDays  = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0)  return `${timeStr} \u2022 Hoje`;
  if (diffDays === 1)  return `${timeStr} \u2022 Ontem`;
  const d = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${timeStr} \u2022 ${d}`;
}

// Helper to format date for desktop table: e.g. "26 Mai, 2024"
function formatarDataDesktop(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month}, ${year}`;
}

export default function ApostasTable({
  apostas,
  onStatusChange,
  onDelete,
}: ApostasTableProps) {
  const [page, setPage] = useState(1);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Reset page to 1 whenever the list of apostas changes (e.g. filtered or searched)
  useEffect(() => {
    setPage(1);
  }, [apostas]);

  const totalPages = Math.max(1, Math.ceil(apostas.length / PAGE_SIZE));
  const paginated = apostas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  // Helper to determine background/text classes for styled select badge
  const getBadgeClasses = (status: ApostaStatus) => {
    if (status === 'Green') return 'bg-[#003919] text-[#60ff99] border-[#005228] bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2360ff99%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")]';
    if (status === 'Red') return 'bg-[#67001b] text-[#ffb2b7] border-[#92002a] bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23ffb2b7%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")]';
    if (status === 'Void') return 'bg-[#33343e] text-[#ffd166] border-[#282a32] bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23ffd166%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")]';
    return 'bg-[#33343e] text-[#e2e1ee] border-[#282a32] bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23e2e1ee%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")]';
  };

  return (
    <>
      {/* 📱 Mobile Card List (md:hidden) — Matches mockup "Histórico Recente" */}
      <div className="block md:hidden">
        {/* Section header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[14px] font-semibold text-[#e2e1ee]">Histórico Recente</h2>
          <button className="text-[12px] font-medium text-[#60ff99] cursor-pointer">Ver Tudo</button>
        </div>

        <div className="flex flex-col gap-3">
          {paginated.length === 0 ? (
            <div className="glass-card p-6 rounded-xl text-center text-xs text-[#b9cbb9]">
              Nenhuma aposta cadastrada. Toque em + para adicionar.
            </div>
          ) : (
            paginated.map((aposta) => {
              const isWin  = aposta.status === 'Green';
              const isLoss = aposta.status === 'Red';
              const isVoid = aposta.status === 'Void';
              const isOpen = aposta.status === 'Aberta';

              // Left border accent: ONLY Pendente/Aberta gets blue, others have none
              const borderAccent = (isOpen || isVoid)
                ? 'border-l-2 border-[#adc6ff]'
                : '';

              // Status label color — exactly as mockup
              const statusColor = isWin
                ? '#60ff99'
                : isLoss
                ? '#ffb4ab'
                : isOpen
                ? '#adc6ff'
                : '#b9cbb9';

              const statusLabel = isWin
                ? 'Ganhou'
                : isLoss
                ? 'Perdeu'
                : isVoid
                ? 'Anulado'
                : 'Pendente';

              // Sport category badge label
              const getSportLabel = (times: string, detalhe: string) => {
                const t = (times + ' ' + (detalhe ?? '')).toLowerCase();
                if (t.includes('nba') || t.includes('lakers') || t.includes('warriors') || t.includes('celtics') || t.includes('bulls')) return 'NBA';
                if (t.includes('tênis') || t.includes('tennis') || t.includes('djokovic') || t.includes('alcaraz') || t.includes('nadal')) return 'Tênis';
                if (t.includes('basquete') || t.includes('basketball')) return 'Basquete';
                if (t.includes('ufc') || t.includes('mma')) return 'MMA';
                return 'Futebol';
              };

              const categoryLabel = getSportLabel(aposta.times_apostados, aposta.detalhe_aposta ?? '');
              const relativeTime  = formatarDataCard(aposta.data_criacao);
              const isExpanded = expandedId === aposta.id;

              return (
                <div key={aposta.id} className="flex flex-col gap-2">
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : aposta.id)}
                    className={`glass-card p-5 rounded-xl flex justify-between items-center active:scale-[0.98] transition-all cursor-pointer ${borderAccent}`}
                  >
                    {/* Left: meta + name + market */}
                    <div className="flex flex-col gap-1.5 min-w-0 flex-1 pr-3">
                      {/* Row 1: timestamp + category badge */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#b9cbb9]">{relativeTime}</span>
                        <span className="px-1.5 py-0.5 rounded-sm bg-[#33343e] text-[9px] font-bold text-[#e2e1ee] uppercase tracking-tighter">
                          {categoryLabel}
                        </span>
                      </div>
                      {/* Row 2: team names */}
                      <p className="text-[14px] font-semibold text-white leading-tight truncate">
                        {aposta.times_apostados}
                      </p>
                      {/* Row 3: market + odd */}
                      <p className="text-[11px] text-[#b9cbb9]">
                        {aposta.detalhe_aposta} • Odd {aposta.odd.toFixed(2)}
                      </p>
                    </div>

                    {/* Right: status + stake */}
                    <div className="text-right shrink-0">
                      <p className="text-[14px] font-semibold" style={{ color: statusColor }}>
                        {statusLabel}
                      </p>
                      <p className="text-[12px] text-[#b9cbb9] font-mono mt-0.5">
                        {formatarMoeda(aposta.stake)}
                      </p>
                    </div>
                  </div>

                  {/* Expanded Actions panel (shown exactly underneath when a card is tapped) */}
                  {isExpanded && (
                    <div
                      className="glass-card p-4 rounded-xl flex items-center justify-between gap-2 animate-fade-in border border-white/[0.08] bg-[#161a2b]/90 backdrop-blur-md"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-[9px] text-[#b9cbb9] font-bold uppercase tracking-wider">Alterar status:</span>
                        <select
                          value={aposta.status}
                          onChange={(e) => handleStatus(aposta.id, e.target.value as ApostaStatus)}
                          disabled={loadingId === aposta.id}
                          className="appearance-none bg-[#1e2338] border border-white/10 rounded-lg text-[#e2e1ee] text-[11px] font-semibold py-1.5 pl-2.5 pr-8 outline-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23e2e1ee%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_8px_center] bg-no-repeat bg-[length:10px_10px]"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-[#11131b] text-white">{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => handleDelete(aposta.id)}
                        disabled={loadingId === aposta.id}
                        className="bg-[rgba(255,77,109,0.06)] border border-[rgba(255,77,109,0.15)] text-[#ffb4ab] text-[11px] font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-[rgba(255,77,109,0.12)] transition-all"
                      >
                        {loadingId === aposta.id ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={11} />}
                        {confirmDelete === aposta.id ? 'Confirmar' : 'Excluir'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-3 px-1">
            <span className="text-[10px] font-medium text-[#b9cbb9]">Pág. {page} de {totalPages}</span>
            <div className="flex items-center gap-1">
              <button className="glass-card text-white rounded-lg p-2 disabled:opacity-30" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft size={12} />
              </button>
              <button className="glass-card text-white rounded-lg p-2 disabled:opacity-30" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🖥️ Desktop Structured Table (hidden md:block) - Matches Image 2 */}
      <div className="hidden md:block bg-[#11131b] border border-[rgba(255,255,255,0.06)] rounded-[20px] shadow-2xl relative overflow-hidden py-6">
        {/* Cabeçalho do Bloco */}
        <div className="flex items-center justify-between px-6 md:px-8 mb-5">
          <div className="flex items-center gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#00FF99]">
              HISTÓRICO DE APOSTAS
            </h3>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-xs font-semibold text-[#00FF99] hover:underline cursor-pointer">
              Ver tudo
            </button>
            <div className="w-[1px] h-4 bg-white/10" />
            <span className="text-[11px] font-semibold font-mono text-[#8A94A6]">
              Pág. {page} de {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                className="bg-transparent hover:bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] hover:border-white/10 text-[#8A94A6] hover:text-white rounded-lg transition-all duration-150 inline-flex items-center justify-center p-2 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                className="bg-transparent hover:bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] hover:border-white/10 text-[#8A94A6] hover:text-white rounded-lg transition-all duration-150 inline-flex items-center justify-center p-2 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de 4 colunas: DATA | EVENTO | INVESTIMENTO | RESULTADO */}
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-t border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.005)]">
                {['DATA', 'EVENTO', 'INVESTIMENTO', 'RESULTADO'].map((h) => (
                  <th
                    key={h}
                    className="px-6 md:px-8 py-3.5 text-left text-[10px] font-bold text-[#8A94A6] uppercase tracking-widest whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-16 text-sm text-[#525C6C] font-medium"
                  >
                    Nenhuma aposta encontrada.
                  </td>
                </tr>
              ) : (
                paginated.map((aposta, idx) => {
                  const isLoading = loadingId === aposta.id;
                  const formattedDate = formatarDataDesktop(aposta.data_criacao);

                  return (
                    <tr
                      key={aposta.id}
                      id={`aposta-row-${aposta.id}`}
                      className={`border-b border-[rgba(255,255,255,0.06)] transition-all duration-200 hover:bg-[rgba(255,255,255,0.02)] group ${
                        isLoading ? 'opacity-40' : 'opacity-100'
                      } ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[rgba(255,255,255,0.003)]'}`}
                    >
                      {/* DATA (formatted as "26 Mai, 2024") */}
                      <td className="px-6 md:px-8 py-4 whitespace-nowrap">
                        <span className="text-xs font-semibold text-[#8A94A6]">
                          {formattedDate}
                        </span>
                      </td>

                      {/* EVENTO (bold title + detailed market subtext) */}
                      <td className="px-6 md:px-8 py-4">
                        <div>
                          <div className="text-xs font-bold text-white leading-tight">
                            {aposta.times_apostados}
                          </div>
                          <div className="text-[10px] text-[#8A94A6] mt-0.5 font-medium leading-none">
                            {aposta.detalhe_aposta}
                          </div>
                        </div>
                      </td>

                      {/* INVESTIMENTO (formatarMoeda stake value) */}
                      <td className="px-6 md:px-8 py-4 whitespace-nowrap">
                        <span className="text-xs font-semibold text-white">
                          {formatarMoeda(aposta.stake)}
                        </span>
                      </td>

                      {/* RESULTADO (badge select + hover delete button) */}
                      <td className="px-6 md:px-8 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {/* Styled Select element matching the outcome badges in Image 2 */}
                          <select
                            value={aposta.status}
                            onChange={(e) =>
                              handleStatus(aposta.id, e.target.value as ApostaStatus)
                            }
                            disabled={isLoading}
                            className={`appearance-none border px-3 pr-7 py-1.5 rounded-lg text-[10px] font-bold tracking-wider text-center cursor-pointer outline-none uppercase transition-all duration-150 bg-[position:right_6px_center] bg-no-repeat bg-[length:10px_10px] ${getBadgeClasses(
                              aposta.status
                            )}`}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value} className="bg-[#11131b] text-white">
                                {opt.label}
                              </option>
                            ))}
                          </select>

                          {/* Hover Trash delete trigger */}
                          <button
                            id={`delete-btn-${aposta.id}`}
                            className="bg-transparent hover:bg-white/5 text-[#FF4D6D] hover:text-[#ff8595] transition-all duration-150 inline-flex items-center justify-center p-2 rounded-lg cursor-pointer ml-3 opacity-0 group-hover:opacity-100"
                            onClick={() => handleDelete(aposta.id)}
                            disabled={isLoading}
                            title={
                              confirmDelete === aposta.id
                                ? 'Clique de novo para confirmar'
                                : 'Excluir aposta'
                            }
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
