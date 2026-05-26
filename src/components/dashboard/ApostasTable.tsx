'use client';

import { useState } from 'react';
import { Aposta, ApostaStatus } from '@/types/aposta';
import { formatarMoeda } from '@/lib/calculations';
import { Trash2, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

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
  const icons: Record<ApostaStatus, string> = {
    Green: '✅',
    Red: '❌',
    Aberta: '⏳',
    Void: '↩️',
  };
  return (
    <span className={classes[status]}>
      {icons[status]} {status}
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
    <div className="glass-card" style={{ padding: '20px 0' }}>
      {/* Cabeçalho */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 22px',
          marginBottom: 16,
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            📋 Histórico de Apostas
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {apostas.length} aposta{apostas.length !== 1 ? 's' : ''} encontrada
            {apostas.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Paginação */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {page} / {totalPages}
          </span>
          <button
            className="btn-ghost"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: '4px 8px', opacity: page === 1 ? 0.4 : 1 }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            className="btn-ghost"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: '4px 8px', opacity: page === totalPages ? 0.4 : 1 }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                borderTop: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {[
                'Data',
                'Times',
                'Detalhe',
                'Odd',
                'Stake',
                'Potencial',
                'Status',
                'Ações',
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 22px',
                    textAlign: 'left',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    whiteSpace: 'nowrap',
                  }}
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
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: 'var(--text-muted)',
                    fontSize: '0.875rem',
                  }}
                >
                  Nenhuma aposta encontrada
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
                    style={{
                      borderBottom: '1px solid var(--border)',
                      opacity: isLoading ? 0.5 : 1,
                      transition: 'all 0.15s ease',
                      background:
                        idx % 2 === 0
                          ? 'transparent'
                          : 'rgba(255,255,255,0.01)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-card-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)';
                    }}
                  >
                    {/* Data */}
                    <td style={{ padding: '12px 22px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {new Date(aposta.data_criacao).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                        })}
                      </span>
                    </td>

                    {/* Times */}
                    <td style={{ padding: '12px 22px', maxWidth: 200 }}>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {aposta.times_apostados}
                      </span>
                    </td>

                    {/* Detalhe */}
                    <td style={{ padding: '12px 22px', maxWidth: 220 }}>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {aposta.detalhe_aposta}
                      </span>
                    </td>

                    {/* Odd */}
                    <td style={{ padding: '12px 22px' }}>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: 'var(--gold)',
                        }}
                      >
                        {aposta.odd.toFixed(2)}
                      </span>
                    </td>

                    {/* Stake */}
                    <td style={{ padding: '12px 22px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}
                      >
                        {formatarMoeda(aposta.stake)}
                      </span>
                    </td>

                    {/* Potencial */}
                    <td style={{ padding: '12px 22px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          color:
                            aposta.status === 'Green'
                              ? 'var(--green-neon)'
                              : 'var(--text-muted)',
                          fontWeight: aposta.status === 'Green' ? 600 : 400,
                        }}
                      >
                        {formatarMoeda(potencial)}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 22px' }}>
                      <StatusBadge status={aposta.status} />
                    </td>

                    {/* Ações */}
                    <td style={{ padding: '12px 22px' }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {/* Dropdown de status */}
                        <select
                          id={`status-select-${aposta.id}`}
                          value={aposta.status}
                          onChange={(e) =>
                            handleStatus(aposta.id, e.target.value as ApostaStatus)
                          }
                          disabled={isLoading}
                          style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            color: 'var(--text-secondary)',
                            fontSize: '0.78rem',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>

                        {/* Botão deletar */}
                        <button
                          id={`delete-btn-${aposta.id}`}
                          className="btn-danger"
                          onClick={() => handleDelete(aposta.id)}
                          disabled={isLoading}
                          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                          title={
                            confirmDelete === aposta.id
                              ? 'Clique novamente para confirmar'
                              : 'Excluir aposta'
                          }
                        >
                          {confirmDelete === aposta.id ? (
                            <CheckCircle2 size={13} />
                          ) : (
                            <Trash2 size={13} />
                          )}
                          {confirmDelete === aposta.id ? 'Confirmar' : ''}
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
