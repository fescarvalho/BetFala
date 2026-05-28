'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  Mic,
  MicOff,
  ImagePlus,
  X,
} from 'lucide-react';
import { ApostaInsert, Banca, Aposta, ApostaUpdate } from '@/types/aposta';
import { useVoiceInput } from '@/hooks/useVoiceInput';

/* ─── Types ──────────────────────────────────────────────── */
interface FormValues {
  times_apostados: string;
  detalhe_aposta: string;
  odd: string;
  stake: string;
  banca_id: string;
  is_freebet: boolean;
  bonus_percent: string;
}

interface FormErrors {
  times_apostados?: string;
  detalhe_aposta?: string;
  odd?: string;
  stake?: string;
  bonus_percent?: string;
}

interface NovaApostaFormProps {
  onSave: (aposta: ApostaInsert) => Promise<boolean>;
  onUpdate?: (aposta: ApostaUpdate) => Promise<boolean>;
  onClose: () => void;
  autoStartVoice?: boolean;
  error?: string | null;
  bancas: Banca[];
  defaultBancaId?: string;
  initialData?: Aposta;
}

const INITIAL: FormValues = {
  times_apostados: '',
  detalhe_aposta: '',
  odd: '',
  stake: '',
  banca_id: '',
  is_freebet: false,
  bonus_percent: '',
};

/* Stake quick-pick chips */
const STAKE_CHIPS = [10, 25, 50, 100, 200];

function validate(v: FormValues): FormErrors {
  const e: FormErrors = {};
  if (v.times_apostados.trim().length < 2) e.times_apostados = 'Informe o evento.';
  if (v.detalhe_aposta.trim().length < 2) e.detalhe_aposta = 'Informe o mercado.';
  const odd = parseFloat(v.odd);
  if (!v.odd || isNaN(odd) || odd < 1.01) e.odd = 'Mín. 1.01';
  if (odd > 1000) e.odd = 'Máx. 1000';
  const stake = parseFloat(v.stake);
  if (!v.stake || isNaN(stake) || stake < 0.01) e.stake = 'Mín. R$0,01';
  if (v.bonus_percent) {
    const bonus = parseFloat(v.bonus_percent);
    if (isNaN(bonus) || bonus < 0) e.bonus_percent = 'Valor inválido';
  }
  return e;
}

function formatBRL(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/* ─── Floating-label input ───────────────────────────────── */
function FloatInput({
  id,
  label,
  type = 'text',
  step,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  inputMode,
}: {
  id: string;
  label: string;
  type?: string;
  step?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  error?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  const [focused, setFocused] = useState(false);
  const raised = focused || value.length > 0;
  const borderColor = error
    ? 'rgba(255,77,109,0.5)'
    : focused
      ? 'rgba(0,255,136,0.4)'
      : 'rgba(255,255,255,0.07)';

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          position: 'relative',
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.04)',
          border: `1.5px solid ${borderColor}`,
          transition: 'border-color 0.2s',
          overflow: 'hidden',
        }}
      >
        {/* Floating label */}
        <label
          htmlFor={id}
          style={{
            position: 'absolute',
            left: '16px',
            top: raised ? '8px' : '50%',
            transform: raised ? 'none' : 'translateY(-50%)',
            fontSize: raised ? '10px' : '14px',
            fontWeight: raised ? 600 : 500,
            color: focused ? '#00FF88' : '#94A3B8',
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
          step={step}
          placeholder={raised ? placeholder : ''}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          inputMode={inputMode}
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
          className="placeholder:text-[#94A3B8]/30"
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

/* ─── Component ──────────────────────────────────────────── */
export default function NovaApostaForm({
  onSave,
  onUpdate,
  onClose,
  autoStartVoice = false,
  error = null,
  bancas,
  defaultBancaId,
  initialData,
}: NovaApostaFormProps) {
  const [values, setValues] = useState<FormValues>(
    initialData
      ? {
          times_apostados: initialData.times_apostados,
          detalhe_aposta: initialData.detalhe_aposta || '',
          odd: String(initialData.odd),
          stake: String(initialData.stake),
          banca_id: initialData.banca_id || defaultBancaId || bancas[0]?.id || '',
          is_freebet: initialData.is_freebet || false,
          bonus_percent: initialData.bonus_percent ? String(initialData.bonus_percent) : '',
        }
      : {
          ...INITIAL,
          banca_id: defaultBancaId || bancas[0]?.id || '',
        }
  );
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const errors = useMemo(() => validate(values), [values]);
  const fieldError = (f: keyof FormValues) => (touched[f] ? errors[f as keyof FormErrors] : undefined);

  const setInput = (field: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((c) => ({ ...c, [field]: e.target.value }));
    setTouched((c) => ({ ...c, [field]: true }));
  };

  const blur = (field: keyof FormValues) => () =>
    setTouched((c) => ({ ...c, [field]: true }));

  /* Retorno automático */
  const { retorno, lucroReal, valorBonus } = useMemo(() => {
    const odd = parseFloat(values.odd);
    const stake = parseFloat(values.stake);
    if (!isNaN(odd) && !isNaN(stake) && odd >= 1.01 && stake > 0) {
      const calcRetornoBase = stake * odd;
      let calcBonus = 0;
      if (values.bonus_percent) {
        const bonus = parseFloat(values.bonus_percent);
        if (!isNaN(bonus) && bonus > 0) {
          calcBonus = calcRetornoBase * (bonus / 100);
        }
      }
      return { 
        retorno: calcRetornoBase + calcBonus, 
        lucroReal: calcRetornoBase - stake,
        valorBonus: calcBonus 
      };
    }
    return { retorno: null, lucroReal: null, valorBonus: null };
  }, [values.odd, values.stake, values.bonus_percent]);

  const lucro = retorno !== null ? retorno - parseFloat(values.stake) : null;

  /* Voice */
  const handleVoiceResult = useCallback((transcript: string) => {
    // Tenta encontrar palavras-chave
    const eventoRegex = /(?:evento|jogo|partida)[:\s]+(.*?)(?:,|$|(?=\s*(?:mercado|mercado|odd|stake)[:\s]))/i;
    const mercadoRegex = /(?:mercado|mercado|detalhe)[:\s]+(.*?)(?:,|$|(?=\s*(?:evento|jogo|partida|odd|stake)[:\s]))/i;
    const oddRegex = /(?:odd|cotação)[:\s]+(.*?)(?:,|$|(?=\s*(?:evento|jogo|partida|mercado|mercado|stake)[:\s]))/i;
    const stakeRegex = /(?:stake|valor|aposta)[:\s]+(.*?)(?:,|$|(?=\s*(?:evento|jogo|partida|mercado|mercado|odd)[:\s]))/i;

    const eventoMatch = transcript.match(eventoRegex);
    const mercadoMatch = transcript.match(mercadoRegex);
    const oddMatch = transcript.match(oddRegex);
    const stakeMatch = transcript.match(stakeRegex);

    const newValues: Partial<FormValues> = {};
    const newTouched: Partial<Record<keyof FormValues, boolean>> = {};

    let hasKeywordMatch = false;

    if (eventoMatch && eventoMatch[1].trim()) {
      newValues.times_apostados = eventoMatch[1].trim();
      newTouched.times_apostados = true;
      hasKeywordMatch = true;
    }

    if (mercadoMatch && mercadoMatch[1].trim()) {
      newValues.detalhe_aposta = mercadoMatch[1].trim();
      newTouched.detalhe_aposta = true;
      hasKeywordMatch = true;
    }

    const extractNumber = (str: string) => {
      const cleanStr = str.replace(/[^\d,.]/g, '').replace(',', '.');
      return cleanStr;
    };

    if (oddMatch && oddMatch[1].trim()) {
      const num = extractNumber(oddMatch[1]);
      if (num && !isNaN(parseFloat(num))) {
        newValues.odd = num;
        newTouched.odd = true;
        hasKeywordMatch = true;
      }
    }

    if (stakeMatch && stakeMatch[1].trim()) {
      const num = extractNumber(stakeMatch[1]);
      if (num && !isNaN(parseFloat(num))) {
        newValues.stake = num;
        newTouched.stake = true;
        hasKeywordMatch = true;
      }
    }

    if (hasKeywordMatch) {
      setValues((c) => ({ ...c, ...newValues }));
      setTouched((c) => ({ ...c, ...newTouched }));
    } else {
      const parts = transcript.split(',');
      if (parts.length >= 2) {
        setValues((c) => ({
          ...c,
          times_apostados: parts[0].trim(),
          detalhe_aposta: parts.slice(1).join(',').trim(),
        }));
        setTouched((c) => ({ ...c, times_apostados: true, detalhe_aposta: true }));
      } else {
        setValues((c) => ({ ...c, times_apostados: transcript }));
        setTouched((c) => ({ ...c, times_apostados: true }));
      }
    }
  }, []);

  const { isListening, startListening, stopListening, isSupported } = useVoiceInput(handleVoiceResult);

  useEffect(() => {
    if (!autoStartVoice) return;
    const t = setTimeout(() => startListening(), 300);
    return () => clearTimeout(t);
  }, [autoStartVoice, startListening]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  /* Imagem (Print) handler */
  const handleImageUpload = async (file: File) => {
    setIsAnalyzingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        const res = await fetch('/api/parse-print', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image }),
        });

        const data = await res.json();
        if (!res.ok) {
          alert(data.error || 'Erro ao processar imagem');
          setIsAnalyzingImage(false);
          return;
        }

        setValues((prev) => ({
          ...prev,
          times_apostados: data.times_apostados || prev.times_apostados,
          detalhe_aposta: data.detalhe_aposta || prev.detalhe_aposta,
          odd: data.odd ? String(data.odd) : prev.odd,
          stake: data.stake ? String(data.stake) : prev.stake,
        }));
        setTouched({ times_apostados: true, detalhe_aposta: true, odd: true, stake: true });
        setIsAnalyzingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert('Erro ao ler a imagem');
      setIsAnalyzingImage(false);
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) handleImageUpload(file);
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ times_apostados: true, detalhe_aposta: true, odd: true, stake: true });
    if (Object.keys(validate(values)).length > 0) return;
    setSaving(true);
    let ok = false;
    if (initialData && onUpdate) {
      ok = await onUpdate({
        id: initialData.id,
        times_apostados: values.times_apostados.trim(),
        detalhe_aposta: values.detalhe_aposta.trim(),
        odd: parseFloat(values.odd),
        stake: parseFloat(values.stake),
        banca_id: values.banca_id || undefined,
        is_freebet: values.is_freebet,
        bonus_percent: values.bonus_percent ? parseFloat(values.bonus_percent) : undefined,
      });
    } else {
      ok = await onSave({
        times_apostados: values.times_apostados.trim(),
        detalhe_aposta: values.detalhe_aposta.trim(),
        odd: parseFloat(values.odd),
        stake: parseFloat(values.stake),
        banca_id: values.banca_id || undefined,
        is_freebet: values.is_freebet,
        bonus_percent: values.bonus_percent ? parseFloat(values.bonus_percent) : undefined,
      });
    }
    setSaving(false);
    if (ok) {
      setSuccess(true);
      setValues({ ...INITIAL, banca_id: values.banca_id });
      setTimeout(() => { setSuccess(false); onClose(); }, 1300);
    }
  };

  return (
    /* ── Backdrop ── */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Blur backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      />

      {/* ── Bottom sheet ── */}
      <div
        ref={sheetRef}
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '520px',
          maxHeight: '94dvh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0F172A',
          borderRadius: '32px 32px 0 0',
          boxShadow: '0 -24px 80px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
        className="sheet-enter sm:!rounded-[32px] sm:!mb-4 sm:!max-h-[90dvh]"
      >
        {/* ── Drag handle ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '12px',
            paddingBottom: '4px',
            flexShrink: 0,
          }}
        >
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px 20px 24px',
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', lineHeight: '1.2' }}>
              {initialData ? 'Editar aposta' : 'Nova aposta'}
            </h2>
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#94A3B8', marginTop: '3px', lineHeight: '1' }}>
              {initialData ? 'Atualize os dados da aposta' : 'Preencha os dados rapidamente'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Image Upload toggle */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Ler aposta por print/imagem"
              disabled={isAnalyzingImage}
              style={{
                height: '40px',
                width: '40px',
                display: 'grid',
                placeItems: 'center',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.06)',
                color: isAnalyzingImage ? '#00FF88' : '#94A3B8',
                border: 'none',
                cursor: isAnalyzingImage ? 'wait' : 'pointer',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
              className={isAnalyzingImage ? 'listening-pulse' : ''}
            >
              {isAnalyzingImage ? <Loader2 size={17} className="animate-spin" /> : <ImagePlus size={17} strokeWidth={1.8} />}
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />

            {/* Voice toggle — compact */}
            {isSupported && (
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                title={isListening ? 'Parar voz' : 'Entrada por voz'}
                style={{
                  height: '40px',
                  width: '40px',
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '14px',
                  background: isListening ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.06)',
                  color: isListening ? '#00FF88' : '#94A3B8',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
                className={isListening ? 'listening-pulse' : ''}
              >
                {isListening ? <MicOff size={17} strokeWidth={2} /> : <Mic size={17} strokeWidth={1.8} />}
              </button>
            )}

            {/* Close */}
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
                flexShrink: 0,
              }}
            >
              <X size={17} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Listening / Analyzing indicator bar */}
        {(isListening || isAnalyzingImage) && (
          <div
            style={{
              marginLeft: '24px',
              marginRight: '24px',
              marginBottom: '16px',
              padding: '10px 16px',
              borderRadius: '14px',
              background: 'rgba(0,255,136,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#00FF88',
                flexShrink: 0,
                animation: 'fab-pulse 1.2s ease-in-out infinite',
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#00FF88' }}>
              {isAnalyzingImage ? 'Lendo o bilhete com IA...' : 'Escutando... diga o evento e o mercado'}
            </span>
          </div>
        )}

        {/* ── Scrollable body ── */}
        <form
          onSubmit={handleSubmit}
          noValidate
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            paddingBottom: '8px',
          }}
        >
          {/* Banca selector — only if multiple */}
          {bancas.length > 1 && (
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1.5px solid rgba(255,255,255,0.07)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <label
                  htmlFor="f-banca"
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '16px',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#94A3B8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    pointerEvents: 'none',
                    zIndex: 1,
                    lineHeight: '1',
                  }}
                >
                  Banca
                </label>
                <select
                  id="f-banca"
                  value={values.banca_id}
                  onChange={(e) => setValues((c) => ({ ...c, banca_id: e.target.value }))}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '62px',
                    paddingTop: '22px',
                    paddingBottom: '10px',
                    paddingLeft: '16px',
                    paddingRight: '40px',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                >
                  {bancas.map((b) => (
                    <option key={b.id} value={b.id} style={{ background: '#0F172A', color: '#FFFFFF' }}>
                      {b.nome}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  strokeWidth={1.8}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94A3B8',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {/* Evento */}
          <FloatInput
            id="f-times"
            label="Evento"
            placeholder="Flamengo vs Palmeiras"
            value={values.times_apostados}
            onChange={setInput('times_apostados')}
            onBlur={blur('times_apostados')}
            error={fieldError('times_apostados')}
          />

          {/* Mercado */}
          <FloatInput
            id="f-detalhe"
            label="Mercado / detalhe"
            placeholder="Resultado final, Over 2.5…"
            value={values.detalhe_aposta}
            onChange={setInput('detalhe_aposta')}
            onBlur={blur('detalhe_aposta')}
            error={fieldError('detalhe_aposta')}
          />

          {/* Odd + Stake — grid 2 cols */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FloatInput
              id="f-odd"
              label="Odd"
              type="number"
              step="0.01"
              placeholder="1.85"
              inputMode="decimal"
              value={values.odd}
              onChange={setInput('odd')}
              onBlur={blur('odd')}
              error={fieldError('odd')}
            />
            <FloatInput
              id="f-stake"
              label="Stake (R$)"
              type="number"
              step="0.01"
              placeholder="100"
              inputMode="decimal"
              value={values.stake}
              onChange={setInput('stake')}
              onBlur={blur('stake')}
              error={fieldError('stake')}
            />
          </div>

          {/* Stake quick chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {STAKE_CHIPS.map((chip) => {
              const active = values.stake === String(chip);
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setValues((c) => ({ ...c, stake: String(chip) }));
                    setTouched((c) => ({ ...c, stake: true }));
                  }}
                  style={{
                    height: '34px',
                    paddingLeft: '14px',
                    paddingRight: '14px',
                    borderRadius: '17px',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                    background: active ? '#00FF88' : 'rgba(255,255,255,0.06)',
                    color: active ? '#050816' : '#94A3B8',
                  }}
                >
                  R${chip}
                </button>
              );
            })}
          </div>

          {/* Opções Avançadas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
            {/* Freebet Checkbox */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '16px',
                borderRadius: '16px',
                background: values.is_freebet ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${values.is_freebet ? 'rgba(0,255,136,0.3)' : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <input
                type="checkbox"
                checked={values.is_freebet}
                onChange={(e) => setValues(c => ({ ...c, is_freebet: e.target.checked }))}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#00FF88',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: '14px', fontWeight: 600, color: values.is_freebet ? '#00FF88' : '#94A3B8' }}>
                Aposta Grátis
              </span>
            </label>

            {/* Bonus Percent */}
            <FloatInput
              id="f-bonus"
              label="Bônus (%)"
              type="number"
              step="0.1"
              placeholder="Ex: 10"
              inputMode="decimal"
              value={values.bonus_percent}
              onChange={setInput('bonus_percent')}
              onBlur={blur('bonus_percent')}
              error={fieldError('bonus_percent')}
            />
          </div>

          {/* Retorno automático */}
          {retorno !== null && (
            <div
              style={{
                borderRadius: '18px',
                background: 'rgba(0,255,136,0.06)',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', lineHeight: '1', marginBottom: '5px' }}>
                  Retorno potencial
                </p>
                <p style={{ fontSize: '22px', fontWeight: 700, color: '#00FF88', fontFamily: 'monospace', lineHeight: '1' }}>
                  {formatBRL(retorno)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', lineHeight: '1', marginBottom: '5px' }}>
                  {valorBonus && valorBonus > 0 ? 'Lucro Total' : 'Lucro'}
                </p>
                <p style={{ fontSize: '17px', fontWeight: 700, color: lucro! >= 0 ? '#00FF88' : '#ff9aae', fontFamily: 'monospace', lineHeight: '1' }}>
                  +{formatBRL(lucro!)}
                </p>
                {valorBonus !== null && valorBonus > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 500, color: '#94A3B8', display: 'flex', gap: '6px' }}>
                      <span>Real:</span>
                      <span style={{ color: '#FFFFFF', fontFamily: 'monospace' }}>{formatBRL(lucroReal!)}</span>
                    </p>
                    <p style={{ fontSize: '11px', fontWeight: 500, color: '#94A3B8', display: 'flex', gap: '6px' }}>
                      <span>Bônus:</span>
                      <span style={{ color: '#00FF88', fontFamily: 'monospace' }}>+{formatBRL(valorBonus)}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* API error */}
          {error && (
            <div
              style={{
                borderRadius: '14px',
                background: 'rgba(255,77,109,0.08)',
                padding: '12px 16px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#ff9aae',
                lineHeight: '1.5',
              }}
            >
              {error}
            </div>
          )}
        </form>

        {/* ── Footer — sticky CTA ── */}
        <div
          style={{
            flexShrink: 0,
            padding: '16px 24px',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            background: '#0F172A',
          }}
        >
          <button
            id="btn-salvar-aposta"
            type="submit"
            form=""
            onClick={handleSubmit}
            disabled={saving || success}
            style={{
              height: '58px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              borderRadius: '18px',
              background: success ? 'rgba(0,255,136,0.15)' : '#00FF88',
              color: success ? '#00FF88' : '#050816',
              fontSize: '16px',
              fontWeight: 700,
              border: 'none',
              cursor: saving || success ? 'default' : 'pointer',
              opacity: saving ? 0.75 : 1,
              transition: 'all 0.2s',
              boxShadow: success ? 'none' : '0 8px 28px rgba(0,255,136,0.22)',
              letterSpacing: '-0.1px',
            }}
          >
            {success ? (
              <>
                <CheckCircle2 size={20} strokeWidth={2.5} />
                Salvo com sucesso!
              </>
            ) : saving ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              initialData ? 'Salvar alterações' : 'Salvar aposta'
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              height: '46px',
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
              transition: 'color 0.15s',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
