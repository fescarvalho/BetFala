'use client';

import { useState } from 'react';
import { Aposta, ApostaStatus } from '@/types/aposta';
import { formatarMoeda } from '@/lib/calculations';
import { Trash2, ChevronLeft, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';

interface ApostasTableProps {
  apostas: Aposta[];
  onStatusChange: (id: string, status: ApostaStatus) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

const STATUS_OPTIONS: ApostaStatus[] = ['Aberta', 'Green', 'Red', 'Void'];
const PAGE_SIZE = 10;

function StatusBadge({ status }: { status: ApostaStatus }) {
  const classes: Record<ApostaStatus, string> = {
    Green: 'badge-green',
    Red: 'badge-red',
    Aberta: 'badge-aberta',
    Void: 'badge-void',
  };
  const dots: Record<ApostaStatus, string> = {
    Green: 'bg-[var(--green-neon)] shadow-[0_0_8px_var(--green-neon)]',
    Red: 'bg-[var(--red-neon)] shadow-[0_0_8px_var(--red-neon)]',
    Aberta: 'bg-[var(--blue-accent)] shadow-[0_0_8px_var(--blue-accent)]',
    Void: 'bg-[var(--gold)] shadow-[0_0_8px_var(--gold)]',
  };
  return (
    <span className={`${classes[status]} select-none`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`} />
      {status}
    </span>
  );
}

export default function ApostasTable({
  apostas,
  onStatusChange,
  onDelete,
}: ApostasTableProps) {
  const [page, setPage] = useState(1);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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

  return (
    <div className="glass-card py-6">
      {/* Cabeçalho da Tabela */}
      <div className="flex items-center justify-between px-6 md:px-8 mb-5">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Histórico de Apostas
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {apostas.length} {apostas.length === 1 ? 'aposta registrada' : 'apostas registradas'}
          </p>
        </div>

        {/* Paginação */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold font-mono text-[var(--text-secondary)]">
            Pág. {page} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              className="btn-ghost !p-2 disabled:opacity-30 disabled:pointer-events-none hover:bg-[rgba(255,255,255,0.03)] border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:text-white transition-all"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              className="btn-ghost !p-2 disabled:opacity-30 disabled:pointer-events-none hover:bg-[rgba(255,255,255,0.03)] border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:text-white transition-all"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabela Responsiva */}
      <div className="overflow-x-auto w-full">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-t border-b border-[var(--border)] bg-[rgba(255,255,255,0.005)]">
              {[
                'Data',
                'Times / Evento',
                'Detalhe / Mercado',
                'Odd',
                'Stake',
                'Potencial',
                'Status',
                'Ações',
              ].map((h) => (
                <th
                  key={h}
                  className="px-6 md:px-8 py-3 text-left text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest whitespace-nowrap"
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
                  colSpan={8}
                  className="text-center py-16 text-sm text-[var(--text-muted)] font-medium"
                >
                  Nenhuma aposta encontrada.
                </td>
              </tr>
            ) : (
              paginated.map((aposta, idx) => {
                const isLoading = loadingId === aposta.id;
                const potencial = aposta.stake * aposta.odd;

                return (
                  <tr
                    key={aposta.id}
                    id={`aposta-row-${aposta.id}`}
                    className={`border-b border-[var(--border)] transition-all duration-200 hover:bg-[rgba(255,255,255,0.02)] ${
                      isLoading ? 'opacity-40' : 'opacity-100'
                    } ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[rgba(255,255,255,0.003)]'}`}
                  >
                    {/* Data */}
                    <td className="px-6 md:px-8 py-4 whitespace-nowrap">
                      <span className="text-[11px] font-semibold font-mono text-[var(--text-secondary)]">
                        {new Date(aposta.data_criacao).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                        })}
                      </span>
                    </td>

                    {/* Times */}
                    <td className="px-6 md:px-8 py-4 max-w-[200px] truncate">
                      <span className="text-xs font-semibold text-[var(--text-primary)]">
                        {aposta.times_apostados}
                      </span>
                    </td>

                    {/* Detalhe */}
                    <td className="px-6 md:px-8 py-4 max-w-[220px] truncate">
                      <span className="text-xs text-[var(--text-secondary)] font-medium">
                        {aposta.detalhe_aposta}
                      </span>
                    </td>

                    {/* Odd */}
                    <td className="px-6 md:px-8 py-4">
                      <span className="text-xs font-extrabold text-[var(--gold)] font-mono">
                        {aposta.odd.toFixed(2)}
                      </span>
                    </td>

                    {/* Stake */}
                    <td className="px-6 md:px-8 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold text-[var(--text-primary)] font-mono">
                        {formatarMoeda(aposta.stake)}
                      </span>
                    </td>

                    {/* Potencial */}
                    <td className="px-6 md:px-8 py-4 whitespace-nowrap">
                      <span
                        className={`text-xs font-bold font-mono ${
                          aposta.status === 'Green'
                            ? 'text-[var(--green-neon)]'
                            : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {formatarMoeda(potencial)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 md:px-8 py-4">
                      <StatusBadge status={aposta.status} />
                    </td>

                    {/* Ações */}
                    <td className="px-6 md:px-8 py-4">
                      <div className="flex items-center gap-2">
                        {/* Dropdown status */}
                        <div className="relative">
                          <select
                            id={`status-select-${aposta.id}`}
                            value={aposta.status}
                            onChange={(e) =>
                              handleStatus(aposta.id, e.target.value as ApostaStatus)
                            }
                            disabled={isLoading}
                            className="bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] border border-[var(--border)] hover:border-white/10 rounded-lg text-[var(--text-secondary)] hover:text-white text-[11px] font-semibold py-1.5 pl-2.5 pr-2 outline-none cursor-pointer transition-all"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s} className="bg-[var(--bg-base)] text-white">
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Deletar */}
                        <button
                          id={`delete-btn-${aposta.id}`}
                          className="btn-danger !p-1.5 rounded-lg text-xs"
                          onClick={() => handleDelete(aposta.id)}
                          disabled={isLoading}
                          title={
                            confirmDelete === aposta.id
                              ? 'Clique de novo para confirmar'
                              : 'Excluir aposta'
                          }
                        >
                          {isLoading ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : confirmDelete === aposta.id ? (
                            <div className="flex items-center gap-1 font-semibold text-[10px] uppercase tracking-wider px-1">
                              <CheckCircle2 size={12} />
                              Sim
                            </div>
                          ) : (
                            <Trash2 size={13} />
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
  );
}
