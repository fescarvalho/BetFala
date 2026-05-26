'use client';

import { useState, useEffect } from 'react';
import { ApostaInsert } from '@/types/aposta';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { Mic, MicOff, X, Send, Loader2 } from 'lucide-react';

interface FormValues {
  times_apostados: string;
  detalhe_aposta: string;
  odd: string;
  stake: string;
}

interface FormErrors {
  times_apostados?: string;
  detalhe_aposta?: string;
  odd?: string;
  stake?: string;
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.times_apostados || values.times_apostados.trim().length < 2)
    errors.times_apostados = 'Informe os times apostados (mín. 2 caracteres)';
  if (!values.detalhe_aposta || values.detalhe_aposta.trim().length < 2)
    errors.detalhe_aposta = 'Informe o detalhe da aposta (mín. 2 caracteres)';
  const odd = parseFloat(values.odd);
  if (!values.odd || isNaN(odd) || odd < 1.01)
    errors.odd = 'Odd mínima: 1.01';
  if (odd > 1000) errors.odd = 'Odd máxima: 1000';
  const stake = parseFloat(values.stake);
  if (!values.stake || isNaN(stake) || stake < 0.01)
    errors.stake = 'Stake mínima: R$ 0,01';
  if (stake > 1000000) errors.stake = 'Stake muito alta';
  return errors;
}

const INITIAL: FormValues = {
  times_apostados: '',
  detalhe_aposta: '',
  odd: '',
  stake: '',
};

interface NovaApostaFormProps {
  onSave: (aposta: ApostaInsert) => Promise<boolean>;
  onClose: () => void;
  autoStartVoice?: boolean;
}

export default function NovaApostaForm({ onSave, onClose, autoStartVoice = false }: NovaApostaFormProps) {
  const [values, setValues] = useState<FormValues>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setTouched((t) => ({ ...t, [field]: true }));
  };

  const blur = (field: keyof FormValues) => () =>
    setTouched((t) => ({ ...t, [field]: true }));

  // Validate on change
  useEffect(() => {
    setErrors(validate(values));
  }, [values]);

  // Hook de voz — preenche apenas os campos de texto
  const { isListening, startListening, stopListening, isSupported } =
    useVoiceInput((transcript) => {
      const parts = transcript.split(',');
      if (parts.length >= 2) {
        setValues((v) => ({
          ...v,
          times_apostados: parts[0].trim(),
          detalhe_aposta: parts.slice(1).join(',').trim(),
        }));
        setTouched({ times_apostados: true, detalhe_aposta: true });
      } else {
        setValues((v) => ({ ...v, times_apostados: transcript }));
        setTouched((t) => ({ ...t, times_apostados: true }));
      }
    });

  // Auto trigger voice input if requested on mount
  useEffect(() => {
    if (autoStartVoice) {
      const t = setTimeout(() => {
        startListening();
      }, 300);
      return () => clearTimeout(t);
    }
  }, [autoStartVoice, startListening]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ times_apostados: true, detalhe_aposta: true, odd: true, stake: true });
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    const payload: ApostaInsert = {
      times_apostados: values.times_apostados.trim(),
      detalhe_aposta: values.detalhe_aposta.trim(),
      odd: parseFloat(values.odd),
      stake: parseFloat(values.stake),
    };
    const ok = await onSave(payload);
    setSaving(false);
    if (ok) {
      setSuccess(true);
      setValues(INITIAL);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    }
  };

  // Fechar com ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const oddNum = parseFloat(values.odd);
  const stakeNum = parseFloat(values.stake);
  const retornoPotencial =
    !isNaN(oddNum) && !isNaN(stakeNum) && oddNum > 1 && stakeNum > 0
      ? (stakeNum * oddNum).toFixed(2)
      : null;
  const lucroPotencial = retornoPotencial
    ? (stakeNum * (oddNum - 1)).toFixed(2)
    : null;

  const fieldError = (field: keyof FormValues) =>
    touched[field] ? errors[field] : undefined;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="glass-card animate-fade-in w-full max-w-[500px] p-6 md:p-8 border border-[rgba(255,255,255,0.08)] bg-[rgba(14,22,40,0.85)] shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Adicionar Aposta
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Nova entrada na banca (Status: Aberta)
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-secondary)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {/* Banner de Entrada por Voz */}
        <div
          className={`border rounded-xl p-3 mb-5 flex items-center justify-between gap-4 transition-all duration-300 ${
            isListening
              ? 'bg-[rgba(0,255,153,0.03)] border-[rgba(0,255,153,0.25)] shadow-[0_0_15px_rgba(0,255,153,0.05)]'
              : 'bg-[rgba(255,255,255,0.01)] border-[var(--border)]'
          }`}
        >
          <div>
            <p
              className={`text-xs font-semibold uppercase tracking-wider ${
                isListening ? 'text-[var(--green-neon)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              {isListening ? '🎙️ Escutando Áudio...' : '🎙️ Comando de Voz'}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1 leading-normal">
              {isSupported
                ? 'Diga os times e o detalhe separados por vírgula'
                : 'Navegador sem suporte. Modo simulação ativo.'}
            </p>
          </div>
          <button
            id="btn-voice-input"
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`cursor-pointer px-3.5 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 ${
              isListening
                ? 'listening-pulse bg-[var(--green-neon)] border-[var(--green-neon)] text-[#050816]'
                : 'bg-[rgba(255,255,255,0.02)] border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-white/15'
            }`}
          >
            {isListening ? <MicOff size={13} /> : <Mic size={13} />}
            {isListening ? 'Parar' : 'Falar'}
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            {/* Times */}
            <div>
              <label htmlFor="field-times" className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                Times / Evento
              </label>
              <input
                id="field-times"
                type="text"
                placeholder="Ex: Flamengo vs Palmeiras"
                className="input-field"
                value={values.times_apostados}
                onChange={set('times_apostados')}
                onBlur={blur('times_apostados')}
                style={fieldError('times_apostados') ? { borderColor: 'var(--red-neon)' } : {}}
              />
              {fieldError('times_apostados') && <p className="text-[10px] text-[var(--red-neon)] mt-1.5 font-medium">⚠️ {fieldError('times_apostados')}</p>}
            </div>

            {/* Detalhe */}
            <div>
              <label htmlFor="field-detalhe" className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                Mercado / Detalhe
              </label>
              <input
                id="field-detalhe"
                type="text"
                placeholder="Ex: Flamengo Vence + Ambas Marcam"
                className="input-field"
                value={values.detalhe_aposta}
                onChange={set('detalhe_aposta')}
                onBlur={blur('detalhe_aposta')}
                style={fieldError('detalhe_aposta') ? { borderColor: 'var(--red-neon)' } : {}}
              />
              {fieldError('detalhe_aposta') && <p className="text-[10px] text-[var(--red-neon)] mt-1.5 font-medium">⚠️ {fieldError('detalhe_aposta')}</p>}
            </div>

            {/* Odd + Stake */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="field-odd" className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Odd (Cotação)
                </label>
                <input
                  id="field-odd"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 2.10"
                  className="input-field"
                  value={values.odd}
                  onChange={set('odd')}
                  onBlur={blur('odd')}
                  style={fieldError('odd') ? { borderColor: 'var(--red-neon)' } : {}}
                />
                {fieldError('odd') && <p className="text-[10px] text-[var(--red-neon)] mt-1.5 font-medium">⚠️ {fieldError('odd')}</p>}
              </div>
              <div>
                <label htmlFor="field-stake" className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Stake (Valor)
                </label>
                <input
                  id="field-stake"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 100.00"
                  className="input-field"
                  value={values.stake}
                  onChange={set('stake')}
                  onBlur={blur('stake')}
                  style={fieldError('stake') ? { borderColor: 'var(--red-neon)' } : {}}
                />
                {fieldError('stake') && <p className="text-[10px] text-[var(--red-neon)] mt-1.5 font-medium">⚠️ {fieldError('stake')}</p>}
              </div>
            </div>

            {/* Preview de Retorno */}
            {retornoPotencial && (
              <div className="bg-[rgba(0,255,153,0.02)] border border-[rgba(0,255,153,0.15)] rounded-xl p-3.5 flex justify-between items-center mt-2">
                <div>
                  <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Retorno Total</p>
                  <p className="text-sm font-extrabold text-[var(--text-primary)] font-mono mt-1">
                    R$ {retornoPotencial}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Lucro Estimado</p>
                  <p className="text-sm font-extrabold text-[var(--green-neon)] font-mono mt-1">
                    + R$ {lucroPotencial}
                  </p>
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                id="btn-salvar-aposta"
                type="submit"
                className="btn-primary flex-2"
                disabled={saving || success}
              >
                {saving ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : success ? (
                  'Salvo com sucesso! ✅'
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <Send size={13} />
                    Confirmar Entrada
                  </span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
