'use client';

import { useState, useEffect } from 'react';
import { ApostaInsert, Banca } from '@/types/aposta';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { X, Zap, ChevronRight, Mic, MicOff, Loader2, CheckCircle2 } from 'lucide-react';

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
  banca_id?: string;
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.times_apostados || values.times_apostados.trim().length < 2)
    errors.times_apostados = 'Informe os times (mín. 2 caracteres)';
  if (!values.detalhe_aposta || values.detalhe_aposta.trim().length < 2)
    errors.detalhe_aposta = 'Informe o mercado (mín. 2 caracteres)';
  const odd = parseFloat(values.odd);
  if (!values.odd || isNaN(odd) || odd < 1.01) errors.odd = 'Mín: 1.01';
  if (odd > 1000) errors.odd = 'Máx: 1000';
  const stake = parseFloat(values.stake);
  if (!values.stake || isNaN(stake) || stake < 0.01) errors.stake = 'Mín: R$ 0,01';
  return errors;
}

const INITIAL: FormValues = { times_apostados: '', detalhe_aposta: '', odd: '', stake: '', banca_id: '' };

interface NovaApostaFormProps {
  onSave: (aposta: ApostaInsert) => Promise<boolean>;
  onClose: () => void;
  autoStartVoice?: boolean;
  error?: string | null;
  bancas: Banca[];
  defaultBancaId?: string;
}

export default function NovaApostaForm({ onSave, onClose, autoStartVoice = false, error = null, bancas, defaultBancaId }: NovaApostaFormProps) {
  const [values, setValues] = useState<FormValues>(() => ({
    ...INITIAL,
    banca_id: defaultBancaId || (bancas[0]?.id || ''),
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setTouched((t) => ({ ...t, [field]: true }));
  };
  const blur = (field: keyof FormValues) => () => setTouched((t) => ({ ...t, [field]: true }));

  useEffect(() => { setErrors(validate(values)); }, [values]);

  const { isListening, startListening, stopListening, isSupported } =
    useVoiceInput((transcript) => {
      const parts = transcript.split(',');
      if (parts.length >= 2) {
        setValues((v) => ({ ...v, times_apostados: parts[0].trim(), detalhe_aposta: parts.slice(1).join(',').trim() }));
        setTouched({ times_apostados: true, detalhe_aposta: true });
      } else {
        setValues((v) => ({ ...v, times_apostados: transcript }));
        setTouched((t) => ({ ...t, times_apostados: true }));
      }
    });

  useEffect(() => {
    if (autoStartVoice) { const t = setTimeout(() => startListening(), 300); return () => clearTimeout(t); }
  }, [autoStartVoice, startListening]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ times_apostados: true, detalhe_aposta: true, odd: true, stake: true });
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    const ok = await onSave({
      times_apostados: values.times_apostados.trim(),
      detalhe_aposta: values.detalhe_aposta.trim(),
      odd: parseFloat(values.odd),
      stake: parseFloat(values.stake),
      banca_id: values.banca_id || undefined,
    });
    setSaving(false);
    if (ok) { setSuccess(true); setValues(INITIAL); setTimeout(() => { setSuccess(false); onClose(); }, 1400); }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const fe = (f: keyof FormValues) => touched[f] ? errors[f] : undefined;

  return (
    /* ── Backdrop ─────────────────────────────────────────────── */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* ── Modal card ─────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-[460px] rounded-2xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.7)] animate-fade-in">

        {/* ── HEADER — darker section ─────────────────────────── */}
        <div className="bg-[#12141f] px-5 py-4 flex items-center justify-between border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            {/* Lightning icon */}
            <div className="w-10 h-10 rounded-full bg-[rgba(0,255,136,0.1)] border border-[#00ff88]/20 flex items-center justify-center shrink-0">
              <Zap size={18} className="text-[#00ff88]" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-white leading-tight">Nova Aposta</h2>
              <p className="text-[11px] font-semibold text-[#00ff88] flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] inline-block" />
                STATUS: ABERTA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center cursor-pointer text-[#b9cbb9] hover:text-white hover:bg-white/[0.10] transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── BODY — lighter dark section ─────────────────────── */}
        <div className="bg-[#181b27] px-5 py-5 flex flex-col gap-5">

          {/* Voice input row */}
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer ${
              isListening
                ? 'bg-[rgba(0,255,136,0.05)] border-[#00ff88]/30'
                : 'bg-[#1e2235] border-white/[0.06] hover:border-white/[0.12]'
            }`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
              isListening ? 'bg-[#00ff88] text-[#12141f]' : 'bg-[#252a40] text-[#7b8cde]'
            } ${isListening ? 'listening-pulse' : ''}`}>
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </div>
            <div className="flex-1 text-left">
              <p className={`text-[13px] font-medium ${isListening ? 'text-[#00ff88]' : 'text-[#e2e1ee]'}`}>
                {isListening ? 'Escutando... fale agora' : 'Entrada por voz'}
              </p>
              <p className="text-[11px] text-[#6b7a8d] mt-0.5">
                {isSupported ? 'Diga: times, mercado separados por vírgula' : 'Navegador sem suporte de voz'}
              </p>
            </div>
            <ChevronRight size={16} className={isListening ? 'text-[#00ff88]' : 'text-[#6b7a8d]'} />
          </button>

          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-4">

              {/* SELECIONAR BANCA */}
              <div>
                <label htmlFor="f-banca" className="block text-[10px] font-bold uppercase tracking-widest text-[#6b7a8d] mb-2">
                  Selecionar Banca
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#6b7a8d] select-none pointer-events-none">
                    account_balance_wallet
                  </span>
                  <select
                    id="f-banca"
                    value={values.banca_id}
                    onChange={(e) => {
                      setValues((v) => ({ ...v, banca_id: e.target.value }));
                      setTouched((t) => ({ ...t, banca_id: true }));
                    }}
                    className="appearance-none w-full bg-[#12141f] border border-white/[0.07] focus:border-[#00ff88]/50 rounded-xl pl-10 pr-8 py-3 text-[14px] text-[#e2e1ee] outline-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23e2e1ee%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_12px_center] bg-no-repeat bg-[length:10px_10px]"
                  >
                    {bancas.map((b) => (
                      <option key={b.id} value={b.id} className="bg-[#181b27] text-white">
                        {b.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* TIMES / EVENTO */}
              <div>
                <label htmlFor="f-times" className="block text-[10px] font-bold uppercase tracking-widest text-[#6b7a8d] mb-2">
                  Times / Evento
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#6b7a8d] select-none pointer-events-none">
                    sports_soccer
                  </span>
                  <input
                    id="f-times"
                    type="text"
                    placeholder="Ex: Flamengo vs Palmeiras"
                    value={values.times_apostados}
                    onChange={set('times_apostados')}
                    onBlur={blur('times_apostados')}
                    className={`w-full bg-[#12141f] border rounded-xl pl-10 pr-4 py-3 text-[14px] text-[#e2e1ee] placeholder-[#3d4458] outline-none transition-all duration-150 ${
                      fe('times_apostados') ? 'border-[#ff4d6d]/50 focus:border-[#ff4d6d]' : 'border-white/[0.07] focus:border-[#00ff88]/50'
                    }`}
                  />
                </div>
                {fe('times_apostados') && <p className="text-[10px] text-[#ff4d6d] mt-1.5 font-medium">{fe('times_apostados')}</p>}
              </div>

              {/* MERCADO / DETALHE */}
              <div>
                <label htmlFor="f-detalhe" className="block text-[10px] font-bold uppercase tracking-widest text-[#6b7a8d] mb-2">
                  Mercado / Detalhe
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#6b7a8d] select-none pointer-events-none">
                    leaderboard
                  </span>
                  <input
                    id="f-detalhe"
                    type="text"
                    placeholder="Ex: Resultado Final, Over 2.5"
                    value={values.detalhe_aposta}
                    onChange={set('detalhe_aposta')}
                    onBlur={blur('detalhe_aposta')}
                    className={`w-full bg-[#12141f] border rounded-xl pl-10 pr-4 py-3 text-[14px] text-[#e2e1ee] placeholder-[#3d4458] outline-none transition-all duration-150 ${
                      fe('detalhe_aposta') ? 'border-[#ff4d6d]/50 focus:border-[#ff4d6d]' : 'border-white/[0.07] focus:border-[#00ff88]/50'
                    }`}
                  />
                </div>
                {fe('detalhe_aposta') && <p className="text-[10px] text-[#ff4d6d] mt-1.5 font-medium">{fe('detalhe_aposta')}</p>}
              </div>

              {/* ODD + STAKE — side by side */}
              <div className="grid grid-cols-2 gap-3">
                {/* ODD */}
                <div>
                  <label htmlFor="f-odd" className="block text-[10px] font-bold uppercase tracking-widest text-[#6b7a8d] mb-2">
                    Odd
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[#6b7a8d] select-none pointer-events-none">@</span>
                    <input
                      id="f-odd"
                      type="number"
                      step="0.01"
                      placeholder="Ex: 1.85"
                      value={values.odd}
                      onChange={set('odd')}
                      onBlur={blur('odd')}
                      className={`w-full bg-[#12141f] border rounded-xl pl-7 pr-3 py-3 text-[14px] text-[#e2e1ee] placeholder-[#3d4458] outline-none transition-all duration-150 ${
                        fe('odd') ? 'border-[#ff4d6d]/50 focus:border-[#ff4d6d]' : 'border-white/[0.07] focus:border-[#00ff88]/50'
                      }`}
                    />
                  </div>
                  {fe('odd') && <p className="text-[10px] text-[#ff4d6d] mt-1.5 font-medium">{fe('odd')}</p>}
                </div>

                {/* STAKE */}
                <div>
                  <label htmlFor="f-stake" className="block text-[10px] font-bold uppercase tracking-widest text-[#6b7a8d] mb-2">
                    Stake (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#6b7a8d] select-none pointer-events-none">R$</span>
                    <input
                      id="f-stake"
                      type="number"
                      step="0.01"
                      placeholder="Ex: 100.00"
                      value={values.stake}
                      onChange={set('stake')}
                      onBlur={blur('stake')}
                      className={`w-full bg-[#12141f] border rounded-xl pl-9 pr-3 py-3 text-[14px] text-[#e2e1ee] placeholder-[#3d4458] outline-none transition-all duration-150 ${
                        fe('stake') ? 'border-[#ff4d6d]/50 focus:border-[#ff4d6d]' : 'border-white/[0.07] focus:border-[#00ff88]/50'
                      }`}
                    />
                  </div>
                  {fe('stake') && <p className="text-[10px] text-[#ff4d6d] mt-1.5 font-medium">{fe('stake')}</p>}
                </div>
              </div>

              {/* DB error */}
              {error && (
                <div className="rounded-xl bg-[rgba(255,77,109,0.06)] border border-[rgba(255,77,109,0.2)] p-3 text-[12px] text-[#ff4d6d] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d6d] shrink-0" />
                  {error}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 rounded-xl bg-[#1e2235] border border-white/[0.07] text-[#e2e1ee] text-[14px] font-semibold hover:bg-[#252a40] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-salvar-aposta"
                  type="submit"
                  disabled={saving || success}
                  className="flex-[1.5] py-3.5 rounded-xl bg-[#00ff88] hover:bg-[#00e57a] text-[#003919] text-[14px] font-bold flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,255,136,0.3)] hover:shadow-[0_6px_28px_rgba(0,255,136,0.4)] transition-all cursor-pointer disabled:opacity-70 active:scale-[0.98]"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : success ? (
                    <><CheckCircle2 size={16} /> Salvo!</>
                  ) : (
                    'Confirmar Aposta'
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Bottom drag handle */}
          <div className="flex justify-center pt-1">
            <div className="w-10 h-1 rounded-full bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
