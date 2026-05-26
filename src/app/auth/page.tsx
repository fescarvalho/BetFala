'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Zap, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) throw err;
        window.location.href = '/';
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
        });
        if (err) throw err;
        setSuccess('Conta criada! Verifique seu e-mail para confirmar.');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro de autenticação';
      setError(
        msg.includes('Invalid login credentials')
          ? 'E-mail ou senha incorretos.'
          : msg.includes('already registered')
          ? 'Este e-mail já está cadastrado.'
          : msg
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow de fundo decorativo */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '30%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,255,135,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '20%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(76,201,240,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: 420,
          padding: 36,
          border: '1px solid rgba(0,255,135,0.12)',
          boxShadow: '0 0 60px rgba(0,0,0,0.5)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 32,
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              background: 'linear-gradient(135deg, var(--green-neon), #00A8FF)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={24} color="#0A0E1A" strokeWidth={2.5} />
          </div>
          <div>
            <div
              className="gradient-text"
              style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}
            >
              BetFala
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Gestão de Banca de Apostas
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-surface)',
            borderRadius: 10,
            padding: 4,
            marginBottom: 24,
          }}
        >
          {(['login', 'register'] as const).map((tab) => (
            <button
              key={tab}
              id={`tab-${tab}`}
              onClick={() => { setMode(tab); setError(null); setSuccess(null); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'all 0.2s',
                background: mode === tab ? 'var(--bg-card)' : 'transparent',
                color: mode === tab ? 'var(--green-neon)' : 'var(--text-muted)',
                boxShadow: mode === tab ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              {tab === 'login' ? 'Entrar' : 'Criar Conta'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* E-mail */}
            <div>
              <label
                htmlFor="auth-email"
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                E-mail
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={14}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  className="input-field"
                  style={{ paddingLeft: 34 }}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label
                htmlFor="auth-password"
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={14}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  id="auth-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="input-field"
                  style={{ paddingLeft: 34, paddingRight: 36 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                  }}
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Erros / sucesso */}
            {error && (
              <div
                style={{
                  background: 'rgba(255,77,109,0.08)',
                  border: '1px solid rgba(255,77,109,0.25)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  color: 'var(--red-neon)',
                }}
              >
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div
                style={{
                  background: 'rgba(0,255,135,0.08)',
                  border: '1px solid rgba(0,255,135,0.25)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  color: 'var(--green-neon)',
                }}
              >
                ✅ {success}
              </div>
            )}

            {/* Submit */}
            <button
              id="btn-auth-submit"
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ justifyContent: 'center', marginTop: 4, padding: '12px' }}
            >
              {loading ? (
                <Loader2
                  size={16}
                  style={{ animation: 'spin 1s linear infinite' }}
                />
              ) : mode === 'login' ? (
                'Entrar na Banca'
              ) : (
                'Criar Minha Conta'
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
