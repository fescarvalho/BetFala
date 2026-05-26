'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BadgeDollarSign,
  CheckCircle2,
  ChevronDown,
  Goal,
  Landmark,
  ListChecks,
  Loader2,
  Mic,
  MicOff,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { ApostaInsert, Banca } from '@/types/aposta';
import { useVoiceInput } from '@/hooks/useVoiceInput';

interface FormValues {
  times_apostados: string;
  detalhe_aposta: string;
  odd: string;
  stake: string;
  banca_id: string;
}

interface FormErrors {
  times_apostados?: string;
  detalhe_aposta?: string;
  odd?: string;
  stake?: string;
}

const INITIAL: FormValues = {
  times_apostados: '',
  detalhe_aposta: '',
  odd: '',
  stake: '',
  banca_id: '',
};

interface NovaApostaFormProps {
  onSave: (aposta: ApostaInsert) => Promise<boolean>;
  onClose: () => void;
  autoStartVoice?: boolean;
  error?: string | null;
  bancas: Banca[];
  defaultBancaId?: string;
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (values.times_apostados.trim().length < 2) {
    errors.times_apostados = 'Informe o evento.';
  }
  if (values.detalhe_aposta.trim().length < 2) {
    errors.detalhe_aposta = 'Informe o mercado.';
  }

  const odd = parseFloat(values.odd);
  if (!values.odd || Number.isNaN(odd) || odd < 1.01) {
    errors.odd = 'Odd minima 1.01';
  }
  if (odd > 1000) {
    errors.odd = 'Odd maxima 1000';
  }

  const stake = parseFloat(values.stake);
  if (!values.stake || Number.isNaN(stake) || stake < 0.01) {
    errors.stake = 'Minimo R$ 0,01';
  }

  return errors;
}

export default function NovaApostaForm({
  onSave,
  onClose,
  autoStartVoice = false,
  error = null,
  bancas,
  defaultBancaId,
}: NovaApostaFormProps) {
  const [values, setValues] = useState<FormValues>(() => ({
    ...INITIAL,
    banca_id: defaultBancaId || bancas[0]?.id || '',
  }));
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const errors = useMemo(() => validate(values), [values]);

  const fieldError = (field: keyof FormValues) => (touched[field] ? errors[field as keyof FormErrors] : undefined);

  const setInput = (field: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [field]: e.target.value }));
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const setSelect = (field: keyof FormValues) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValues((current) => ({ ...current, [field]: e.target.value }));
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const blur = (field: keyof FormValues) => () => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const { isListening, startListening, stopListening, isSupported } = useVoiceInput((transcript) => {
    const parts = transcript.split(',');
    if (parts.length >= 2) {
      setValues((current) => ({
        ...current,
        times_apostados: parts[0].trim(),
        detalhe_aposta: parts.slice(1).join(',').trim(),
      }));
      setTouched((current) => ({ ...current, times_apostados: true, detalhe_aposta: true }));
      return;
    }

    setValues((current) => ({ ...current, times_apostados: transcript }));
    setTouched((current) => ({ ...current, times_apostados: true }));
  });

  useEffect(() => {
    if (!autoStartVoice) return;
    const timer = setTimeout(() => startListening(), 300);
    return () => clearTimeout(timer);
  }, [autoStartVoice, startListening]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      times_apostados: true,
      detalhe_aposta: true,
      odd: true,
      stake: true,
    });

    const validation = validate(values);
    if (Object.keys(validation).length > 0) return;

    setSaving(true);
    const ok = await onSave({
      times_apostados: values.times_apostados.trim(),
      detalhe_aposta: values.detalhe_aposta.trim(),
      odd: parseFloat(values.odd),
      stake: parseFloat(values.stake),
      banca_id: values.banca_id || undefined,
    });
    setSaving(false);

    if (ok) {
      setSuccess(true);
      setValues({ ...INITIAL, banca_id: values.banca_id });
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    }
  };

  const inputClass = (hasError?: string) =>
    `h-12 w-full rounded-2xl border bg-[#0f1420] px-4 text-[15px] font-semibold text-white outline-none transition placeholder:text-[#596274] ${
      hasError
        ? 'border-[#ff4d6d]/55 focus:border-[#ff4d6d]'
        : 'border-white/[0.08] focus:border-[#00ff88]/55'
    }`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-[28px] border border-white/[0.08] bg-[#151a27] shadow-[0_-20px_70px_rgba(0,0,0,0.55)] sm:rounded-[28px]">
        <div className="flex items-center justify-between border-b border-white/[0.07] bg-[#101521] px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#00ff88]/20 bg-[#00ff88]/10 text-[#00ff88]">
              <Zap size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-black leading-tight text-white">Nova aposta</h2>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.08em] text-[#00ff88]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00ff88]" />
                Aberta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-2xl bg-white/[0.06] text-[#b9cbb9] transition hover:text-white"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`mb-5 flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
              isListening
                ? 'border-[#00ff88]/35 bg-[#00ff88]/10'
                : 'border-white/[0.08] bg-[#1a2030]'
            }`}
          >
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
                isListening ? 'bg-[#00ff88] text-[#101521] listening-pulse' : 'bg-white/[0.06] text-[#adc6ff]'
              }`}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-sm font-black ${isListening ? 'text-[#00ff88]' : 'text-white'}`}>
                {isListening ? 'Escutando agora' : 'Entrada por voz'}
              </span>
              <span className="mt-0.5 block text-xs font-medium leading-snug text-[#8a94a6]">
                {isSupported ? 'Diga: times, mercado separados por virgula' : 'Voz simulada neste navegador'}
              </span>
            </span>
          </button>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="f-banca" className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.1em] text-[#8a94a6]">
                <Landmark size={14} />
                Banca
              </label>
              <div className="relative">
                <select
                  id="f-banca"
                  value={values.banca_id}
                  onChange={setSelect('banca_id')}
                  className={`${inputClass()} appearance-none pr-10`}
                >
                  {bancas.map((banca) => (
                    <option key={banca.id} value={banca.id} className="bg-[#151a27] text-white">
                      {banca.nome}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8a94a6]" />
              </div>
            </div>

            <div>
              <label htmlFor="f-times" className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.1em] text-[#8a94a6]">
                <Trophy size={14} />
                Times / evento
              </label>
              <input
                id="f-times"
                type="text"
                placeholder="Ex: Flamengo vs Palmeiras"
                value={values.times_apostados}
                onChange={setInput('times_apostados')}
                onBlur={blur('times_apostados')}
                className={inputClass(fieldError('times_apostados'))}
              />
              {fieldError('times_apostados') && (
                <p className="mt-1.5 text-xs font-semibold text-[#ff8da0]">{fieldError('times_apostados')}</p>
              )}
            </div>

            <div>
              <label htmlFor="f-detalhe" className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.1em] text-[#8a94a6]">
                <ListChecks size={14} />
                Mercado / detalhe
              </label>
              <input
                id="f-detalhe"
                type="text"
                placeholder="Ex: Resultado final, Over 2.5"
                value={values.detalhe_aposta}
                onChange={setInput('detalhe_aposta')}
                onBlur={blur('detalhe_aposta')}
                className={inputClass(fieldError('detalhe_aposta'))}
              />
              {fieldError('detalhe_aposta') && (
                <p className="mt-1.5 text-xs font-semibold text-[#ff8da0]">{fieldError('detalhe_aposta')}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="f-odd" className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.1em] text-[#8a94a6]">
                  <Goal size={14} />
                  Odd
                </label>
                <input
                  id="f-odd"
                  type="number"
                  step="0.01"
                  placeholder="1.85"
                  value={values.odd}
                  onChange={setInput('odd')}
                  onBlur={blur('odd')}
                  className={inputClass(fieldError('odd'))}
                />
                {fieldError('odd') && (
                  <p className="mt-1.5 text-xs font-semibold text-[#ff8da0]">{fieldError('odd')}</p>
                )}
              </div>

              <div>
                <label htmlFor="f-stake" className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.1em] text-[#8a94a6]">
                  <BadgeDollarSign size={14} />
                  Stake
                </label>
                <input
                  id="f-stake"
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  value={values.stake}
                  onChange={setInput('stake')}
                  onBlur={blur('stake')}
                  className={inputClass(fieldError('stake'))}
                />
                {fieldError('stake') && (
                  <p className="mt-1.5 text-xs font-semibold text-[#ff8da0]">{fieldError('stake')}</p>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-[#ff4d6d]/25 bg-[#ff4d6d]/10 p-3 text-xs font-semibold leading-relaxed text-[#ff8da0]">
                {error}
              </div>
            )}

            <div className="sticky bottom-0 -mx-5 mt-2 grid grid-cols-[0.85fr_1.15fr] gap-3 border-t border-white/[0.06] bg-[#151a27]/95 px-5 pb-5 pt-4 backdrop-blur">
              <button
                type="button"
                onClick={onClose}
                className="h-12 rounded-2xl border border-white/[0.08] bg-[#202638] text-sm font-black text-white"
              >
                Cancelar
              </button>
              <button
                id="btn-salvar-aposta"
                type="submit"
                disabled={saving || success}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#00ff88] text-sm font-black text-[#04110c] shadow-[0_10px_28px_rgba(0,255,136,0.25)] disabled:opacity-70"
              >
                {saving ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : success ? (
                  <>
                    <CheckCircle2 size={17} />
                    Salvo
                  </>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
