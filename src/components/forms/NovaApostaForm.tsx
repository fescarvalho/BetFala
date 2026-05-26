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

interface NovaApostaFormProps {
  onSave: (aposta: ApostaInsert) => Promise<boolean>;
  onClose: () => void;
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

export default function NovaApostaForm({ onSave, onClose }: NovaApostaFormProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mark all touched
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
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: 520,
          padding: 28,
          border: '1px solid rgba(0,255,135,0.15)',
          boxShadow: '0 0 40px rgba(0,255,135,0.08)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              ➕ Nova Aposta
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Status padrão: Aberta
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-card-hover)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Banner de voz */}
        <div
          style={{
            background: isListening ? 'rgba(0,255,135,0.08)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${isListening ? 'rgba(0,255,135,0.3)' : 'var(--border)'}`,
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div>
            <p
              style={{
                fontSize: '0.8rem',
                color: isListening ? 'var(--green-neon)' : 'var(--text-secondary)',
                fontWeight: isListening ? 600 : 400,
              }}
            >
              {isListening ? '🎙️ Ouvindo... fale os times e o detalhe' : '🎙️ Preencher com Voz'}
            </p>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {isSupported
                ? 'Odd e Stake devem ser preenchidos manualmente'
                : 'Simulação ativa (browser sem suporte à Web Speech API)'}
            </p>
          </div>
          <button
            id="btn-voice-input"
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={isListening ? 'listening-pulse' : ''}
            style={{
              background: isListening ? 'var(--green-neon)' : 'var(--bg-card-hover)',
              border: `1px solid ${isListening ? 'var(--green-neon)' : 'var(--border)'}`,
              borderRadius: 8,
              padding: '7px 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.8rem',
              fontWeight: 600,
              color: isListening ? '#0A0E1A' : 'var(--text-secondary)',
              flexShrink: 0,
            }}
          >
            {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            {isListening ? 'Parar' : 'Falar'}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Times */}
            <div>
              <label htmlFor="field-times" style={labelStyle}>Times Apostados</label>
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
              {fieldError('times_apostados') && <ErrMsg msg={fieldError('times_apostados')!} />}
            </div>

            {/* Detalhe */}
            <div>
              <label htmlFor="field-detalhe" style={labelStyle}>Detalhe da Aposta</label>
              <input
                id="field-detalhe"
                type="text"
                placeholder="Ex: Flamengo vence + ambas marcam"
                className="input-field"
                value={values.detalhe_aposta}
                onChange={set('detalhe_aposta')}
                onBlur={blur('detalhe_aposta')}
                style={fieldError('detalhe_aposta') ? { borderColor: 'var(--red-neon)' } : {}}
              />
              {fieldError('detalhe_aposta') && <ErrMsg msg={fieldError('detalhe_aposta')!} />}
            </div>

            {/* Odd + Stake */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label htmlFor="field-odd" style={labelStyle}>Odd</label>
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
                {fieldError('odd') && <ErrMsg msg={fieldError('odd')!} />}
              </div>
              <div>
                <label htmlFor="field-stake" style={labelStyle}>Stake (R$)</label>
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
                {fieldError('stake') && <ErrMsg msg={fieldError('stake')!} />}
              </div>
            </div>

            {/* Preview de retorno */}
            {retornoPotencial && (
              <div
                style={{
                  background: 'rgba(0,255,135,0.05)',
                  border: '1px solid rgba(0,255,135,0.15)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Retorno Total</p>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    R$ {retornoPotencial}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Lucro Potencial</p>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--green-neon)' }}>
                    + R$ {lucroPotencial}
                  </p>
                </div>
              </div>
            )}

            {/* Botões */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>
                Cancelar
              </button>
              <button
                id="btn-salvar-aposta"
                type="submit"
                className="btn-primary"
                disabled={saving || success}
                style={{ flex: 2, justifyContent: 'center' }}
              >
                {saving ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : success ? '✅ Aposta salva!' : (
                  <><Send size={15} /> Salvar Aposta</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

function ErrMsg({ msg }: { msg: string }) {
  return (
    <p style={{ fontSize: '0.72rem', color: 'var(--red-neon)', marginTop: 4 }}>{msg}</p>
  );
}
