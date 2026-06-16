'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  WalletCards,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from 'lucide-react';
import { Banca, TipoTransacao } from '@/types/aposta';
import { formatarMoeda } from '@/lib/calculations';

/* ─── Types ──────────────────────────────────────────────── */
interface BancaManagerSheetProps {
  bancas: Banca[];
  activeBancaId: string | undefined;
  getBancaBalance: (b: Banca) => number;
  onSelectBanca: (id: string) => void;
  onAddBanca: (nome: string, saldo: number) => Promise<boolean>;
  onUpdateBanca: (id: string, nome: string, saldo: number) => Promise<boolean>;
  onDeleteBanca: (id: string) => Promise<boolean>;
  onAddTransaction: (banca_id: string, tipo: TipoTransacao, valor: number) => Promise<boolean>;
  onClose: () => void;
  initialView?: View;
  initialTransactionType?: TipoTransacao;
  initialTargetBancaId?: string;
}

type View = 'list' | 'add' | 'edit' | 'transaction';

/* ─── Floating-label field (reusable) ───────────────────── */
function Field({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const raised = focused || value.length > 0;

  return (
    <div>
      <div
        style={{
          position: 'relative',
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.04)',
          border: `1.5px solid ${error ? 'rgba(255,77,109,0.5)' : focused ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.07)'}`,
          transition: 'border-color 0.2s',
        }}
      >
        <label
          htmlFor={id}
          style={{
            position: 'absolute',
            left: '16px',
            top: raised ? '8px' : '50%',
            transform: raised ? 'none' : 'translateY(-50%)',
            fontSize: raised ? '10px' : '14px',
            fontWeight: raised ? 600 : 500,
            color: focused ? '#8B5CF6' : '#94A3B8',
            letterSpacing: raised ? '0.05em' : '0',
            textTransform: raised ? 'uppercase' : 'none',
            transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
            pointerEvents: 'none',
            lineHeight: '1',
            zIndex: 1,
          }}
        >
          {label}
        </label>
        <input
          id={id}
          type={type}
          step={type === 'number' ? '0.01' : undefined}
          inputMode={type === 'number' ? 'decimal' : undefined}
          placeholder={raised ? placeholder : ''}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            display: 'block',
            width: '100%',
            height: '62px',
            paddingTop: raised ? '22px' : '0',
            paddingBottom: '10px',
            paddingLeft: '16px',
            paddingRight: '16px',
            fontSize: '16px',
            fontWeight: 600,
            color: '#FFFFFF',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            boxSizing: 'border-box',
            WebkitAppearance: 'none',
          }}
          className="placeholder:text-[#94A3B8]/25"
        />
      </div>
      {error && (
        <p style={{ marginTop: '5px', fontSize: '11px', fontWeight: 600, color: '#ff9aae', paddingLeft: '4px' }}>
          {error}
        </p>
      )}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */
export default function BancaManagerSheet({
  bancas,
  activeBancaId,
  getBancaBalance,
  onSelectBanca,
  onAddBanca,
  onUpdateBanca,
  onDeleteBanca,
  onAddTransaction,
  onClose,
  initialView = 'list',
  initialTransactionType = 'deposito',
  initialTargetBancaId,
}: BancaManagerSheetProps) {
  const [view, setView] = useState<View>(initialView);
  const initialTarget = bancas.find(b => b.id === initialTargetBancaId) || null;
  const [editTarget, setEditTarget] = useState<Banca | null>(initialTarget);
  const [transactionType, setTransactionType] = useState<TipoTransacao>(initialTransactionType);

  // Form state (shared add/edit)
  const [nome, setNome] = useState('');
  const [saldo, setSaldo] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  /* ── Open Add ── */
  const openAdd = () => {
    setNome('');
    setSaldo('');
    setFormError('');
    setSuccess(false);
    setEditTarget(null);
    setView('add');
  };

  /* ── Open Edit ── */
  const openEdit = (b: Banca) => {
    setNome(b.nome);
    setSaldo(String(b.saldo_inicial));
    setFormError('');
    setSuccess(false);
    setEditTarget(b);
    setView('edit');
  };

  /* ── Open Transaction ── */
  const openTransaction = (b: Banca, tipo: TipoTransacao) => {
    setSaldo('');
    setFormError('');
    setSuccess(false);
    setEditTarget(b);
    setTransactionType(tipo);
    setView('transaction');
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const isTransaction = view === 'transaction';
    if (!isTransaction && !nome.trim()) { setFormError('Informe o nome da banca.'); return; }
    const s = parseFloat(saldo || '0');
    if (isNaN(s) || s <= 0) { setFormError('Valor inválido.'); return; }

    setSaving(true);
    let ok = false;
    if (view === 'add') {
      ok = await onAddBanca(nome.trim(), s);
    } else if (view === 'edit' && editTarget) {
      ok = await onUpdateBanca(editTarget.id, nome.trim(), s);
    } else if (view === 'transaction' && editTarget) {
      if (transactionType === 'saque') {
        const saldoAtual = getBancaBalance(editTarget);
        if (s > saldoAtual) {
          setFormError('Saldo insuficiente para realizar este saque.');
          setSaving(false);
          return;
        }
      }
      ok = await onAddTransaction(editTarget.id, transactionType, s);
    }
    setSaving(false);

    if (ok) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setView('list');
      }, 1000);
    } else {
      setFormError('Erro ao salvar. Tente novamente.');
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    setDeletingId(id);
    await onDeleteBanca(id);
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  const isAdd = view === 'add';
  const isEdit = view === 'edit';
  const isTransaction = view === 'transaction';
  const isForm = isAdd || isEdit || isTransaction;

  return (
    /* Backdrop */
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      />

      {/* Sheet */}
      <div
        className="sheet-enter sm:!rounded-[32px] sm:!mb-4"
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '520px',
          maxHeight: '88dvh',
          display: 'flex',
          flexDirection: 'column',
          background: '#171717',
          borderRadius: '32px 32px 0 0',
          boxShadow: '0 -24px 80px rgba(0,0,0,0.55)',
          overflow: 'hidden',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px', flexShrink: 0 }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.14)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px 20px', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', lineHeight: '1.2' }}>
              {isAdd ? 'Nova banca' : isEdit ? 'Editar banca' : isTransaction ? (transactionType === 'deposito' ? 'Depositar na Banca' : 'Sacar da Banca') : 'Suas bancas'}
            </h2>
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#94A3B8', marginTop: '3px', lineHeight: '1' }}>
              {isAdd ? 'Configure o nome e saldo inicial'
                : isEdit ? `Editando: ${editTarget?.nome}`
                : isTransaction ? `Banca: ${editTarget?.nome}`
                : `${bancas.length} banca${bancas.length !== 1 ? 's' : ''} cadastrada${bancas.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Back button in form views */}
            {isForm && (
              <button
                onClick={() => setView('list')}
                style={{
                  height: '40px',
                  paddingLeft: '14px',
                  paddingRight: '14px',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#94A3B8',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                â† Voltar
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Fechar"
              style={{
                height: '40px',
                width: '40px',
                display: 'grid',
                placeItems: 'center',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.06)',
                color: '#94A3B8',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <X size={17} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* ──── LIST VIEW ──── */}
        {view === 'list' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {bancas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
                <WalletCards size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} strokeWidth={1.5} />
                <p style={{ fontSize: '14px', fontWeight: 600 }}>Nenhuma banca cadastrada</p>
                <p style={{ fontSize: '12px', marginTop: '4px', opacity: 0.7 }}>Crie sua primeira banca abaixo</p>
              </div>
            ) : (
              bancas.map((b) => {
                const isActive = b.id === activeBancaId;
                const balance = getBancaBalance(b);
                const profit = balance - b.saldo_inicial;
                const isDeleting = deletingId === b.id;
                const isConfirming = confirmDeleteId === b.id;

                return (
                  <div
                    key={b.id}
                    style={{
                      borderRadius: '20px',
                      background: isActive ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.03)',
                      outline: isActive ? '1.5px solid rgba(139,92,246,0.25)' : '1.5px solid rgba(255,255,255,0.05)',
                      padding: '18px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      transition: 'all 0.15s',
                      opacity: isDeleting ? 0.4 : 1,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {isActive && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        background: 'rgba(139,92,246,0.15)',
                        color: '#8B5CF6',
                        fontSize: '9px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        padding: '4px 12px',
                        borderBottomLeftRadius: '12px',
                      }}>
                        Ativa
                      </div>
                    )}
                    {/* Icon */}
                    <div
                      style={{
                        height: '42px',
                        width: '42px',
                        flexShrink: 0,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: '14px',
                        background: isActive ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.05)',
                        color: isActive ? '#8B5CF6' : '#94A3B8',
                      }}
                    >
                      <WalletCards size={18} strokeWidth={1.8} />
                    </div>

                    {/* Info — tap to select */}
                    <button
                      onClick={() => { onSelectBanca(b.id); onClose(); }}
                      style={{
                        flex: 1,
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        minWidth: 0,
                        display: 'block',
                        width: '100%',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px', width: '100%' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0, paddingRight: '4px' }}>
                          {b.nome}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                          {formatarMoeda(balance)}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 500, color: profit >= 0 ? '#8B5CF6' : '#ff9aae', whiteSpace: 'nowrap' }}>
                          {profit >= 0 ? '+' : ''}{formatarMoeda(profit)}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                        Inicial: {formatarMoeda(b.saldo_inicial)}
                      </div>
                    </button>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); openTransaction(b, 'deposito'); }}
                        title="Depositar"
                        style={{
                          height: '36px', width: '36px', display: 'grid', placeItems: 'center',
                          borderRadius: '12px', background: 'rgba(139,92,246,0.1)', color: '#8B5CF6',
                          border: 'none', cursor: 'pointer', transition: 'all 0.12s'
                        }}
                      >
                        <ArrowUpRight size={16} strokeWidth={2} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openTransaction(b, 'saque'); }}
                        title="Sacar"
                        style={{
                          height: '36px', width: '36px', display: 'grid', placeItems: 'center',
                          borderRadius: '12px', background: 'rgba(255,77,109,0.1)', color: '#ff9aae',
                          border: 'none', cursor: 'pointer', transition: 'all 0.12s'
                        }}
                      >
                        <ArrowDownRight size={16} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => openEdit(b)}
                        title="Editar"
                        style={{
                          height: '36px',
                          width: '36px',
                          display: 'grid',
                          placeItems: 'center',
                          borderRadius: '12px',
                          background: 'rgba(255,255,255,0.05)',
                          color: '#94A3B8',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.12s',
                        }}
                      >
                        <Pencil size={14} strokeWidth={1.8} />
                      </button>

                      {bancas.length > 1 && (
                        <button
                          onClick={() => handleDelete(b.id)}
                          disabled={isDeleting}
                          title={isConfirming ? 'Clique para confirmar' : 'Excluir banca'}
                          style={{
                            height: '36px',
                            paddingLeft: isConfirming ? '10px' : '0',
                            paddingRight: isConfirming ? '10px' : '0',
                            width: isConfirming ? 'auto' : '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            borderRadius: '12px',
                            background: isConfirming ? 'rgba(255,77,109,0.15)' : 'rgba(255,255,255,0.05)',
                            color: isConfirming ? '#ff9aae' : '#94A3B8',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 600,
                            transition: 'all 0.15s',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isDeleting ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <>
                              <Trash2 size={13} strokeWidth={1.8} />
                              {isConfirming && 'Confirmar'}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {/* Spacer at bottom */}
            <div style={{ height: '8px' }} />
          </div>
        )}

        {/* ──── FORM VIEW (add / edit / transaction) ──── */}
        {isForm && (
          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ flex: 1, overflowY: 'auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            {(isAdd || isEdit) && (
              <Field
                id="banca-nome"
                label="Nome da banca"
                placeholder="Ex: Banca Principal, Betano…"
                value={nome}
                onChange={setNome}
                error={formError && !nome.trim() ? formError : undefined}
              />
            )}
            <Field
              id="banca-saldo"
              label={isTransaction ? `Valor do ${transactionType}` : "Saldo inicial (R$)"}
              type="number"
              placeholder={isTransaction ? "100" : "1000"}
              value={saldo}
              onChange={setSaldo}
              error={formError && (isTransaction || nome.trim()) ? formError : undefined}
            />

            {/* Quick saldo chips */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[100, 500, 1000, 2000, 5000].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSaldo(String(v))}
                  style={{
                    height: '34px',
                    paddingLeft: '14px',
                    paddingRight: '14px',
                    borderRadius: '17px',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: saldo === String(v) ? '#8B5CF6' : 'rgba(255,255,255,0.06)',
                    color: saldo === String(v) ? '#FFFFFF' : '#94A3B8',
                    transition: 'all 0.12s',
                  }}
                >
                  R${v >= 1000 ? `${v / 1000}k` : v}
                </button>
              ))}
            </div>

            <div style={{ flex: 1 }} />
          </form>
        )}

        {/* Footer */}
        <div
          style={{
            flexShrink: 0,
            padding: '16px 24px',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            background: '#171717',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {view === 'list' ? (
            /* List footer — add button */
            <button
              type="button"
              onClick={openAdd}
              style={{
                height: '56px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: '18px',
                background: '#8B5CF6',
                color: '#050816',
                fontSize: '16px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 28px rgba(139,92,246,0.2)',
                transition: 'opacity 0.15s',
              }}
            >
              <Plus size={20} strokeWidth={2.5} />
              Nova banca
            </button>
          ) : (
            /* Form footer — save button */
            <>
              <button
                type="submit"
                form=""
                onClick={handleSubmit}
                disabled={saving || success}
                style={{
                  height: '56px',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '18px',
                  background: success ? 'rgba(139,92,246,0.15)' : '#8B5CF6',
                  color: success ? '#8B5CF6' : '#FFFFFF',
                  fontSize: '16px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: saving || success ? 'default' : 'pointer',
                  opacity: saving ? 0.75 : 1,
                  boxShadow: success ? 'none' : '0 8px 28px rgba(139,92,246,0.2)',
                  transition: 'all 0.2s',
                }}
              >
                {saving ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : success ? (
                  <><CheckCircle2 size={20} strokeWidth={2} /> Salvo!</>
                ) : isAdd ? (
                  'Criar banca'
                ) : isTransaction ? (
                  `Confirmar ${transactionType}`
                ) : (
                  'Salvar alterações'
                )}
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                style={{
                  height: '44px',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '14px',
                  background: 'transparent',
                  color: '#94A3B8',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

