'use client';

import { useState } from 'react';
import { loginAction, signupAction } from './actions';
import { Zap, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      if (mode === 'login') {
        const res = await loginAction(formData);
        if (res?.error) throw new Error(res.error);
        window.location.href = '/';
      } else {
        const res = await signupAction(formData);
        if (res?.error) throw new Error(res.error);
        setSuccess(res?.success || 'Conta criada! Verifique seu e-mail.');
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
    <div className="min-h-screen bg-[#050816] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow de fundo decorativo */}
      <div className="absolute top-[20%] left-[30%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(0,255,153,0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(76,201,240,0.04)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[420px] p-9 bg-[rgba(14,22,40,0.7)] border border-[rgba(255,255,255,0.08)] rounded-[20px] backdrop-blur-[16px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fade-in">
        {/* Logo */}
        <div className="flex items-center gap-3.5 mb-8 justify-center">
          <div className="w-11 h-11 bg-gradient-to-br from-[#00FF99] to-[#4CC9F0] rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(0,255,153,0.15)]">
            <Zap size={22} color="#050816" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-xl font-black tracking-tight leading-none bg-gradient-to-r from-[#00FF99] to-[#4CC9F0] bg-clip-text text-transparent">
              BetFala
            </div>
            <div className="text-[10px] text-[#8A94A6] font-medium mt-1">
              Gestão de Banca de Apostas
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#0E1628] rounded-xl p-1 mb-6">
          {(['login', 'register'] as const).map((tab) => (
            <button
              key={tab}
              id={`tab-${tab}`}
              onClick={() => { setMode(tab); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 rounded-lg cursor-pointer text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                mode === tab
                  ? 'bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-[#00FF99] shadow-[0_1px_4px_rgba(0,0,0,0.3)]'
                  : 'text-[#8A94A6] hover:text-white border-transparent'
              }`}
            >
              {tab === 'login' ? 'Entrar' : 'Criar Conta'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4.5">
            {/* E-mail */}
            <div>
              <label htmlFor="auth-email" className="block text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A94A6] pointer-events-none"
                />
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] focus:border-[#00FF99] focus:bg-[rgba(255,255,255,0.04)] focus:shadow-[0_0_0_3px_rgba(0,255,153,0.08)] rounded-xl text-sm py-2.5 pl-11 pr-4 outline-none placeholder-[#525C6C] transition-all duration-200 text-white"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="auth-password" className="block text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A94A6] pointer-events-none"
                />
                <input
                  id="auth-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] focus:border-[#00FF99] focus:bg-[rgba(255,255,255,0.04)] focus:shadow-[0_0_0_3px_rgba(0,255,153,0.08)] rounded-xl text-sm py-2.5 pl-11 pr-10 outline-none placeholder-[#525C6C] transition-all duration-200 text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A94A6] hover:text-white transition-colors cursor-pointer"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Erros / sucesso */}
            {error && (
              <div className="bg-[rgba(255,77,109,0.06)] border border-[rgba(255,77,109,0.25)] rounded-xl p-3 text-xs text-[#FF4D6D]">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="bg-[rgba(0,255,153,0.06)] border border-[rgba(0,255,153,0.25)] rounded-xl p-3 text-xs text-[#00FF99]">
                ✅ {success}
              </div>
            )}

            {/* Submit */}
            <button
              id="btn-auth-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-br from-[#00FF99] to-[#00CC7A] text-[#050816] font-semibold text-xs md:text-sm py-3 rounded-xl shadow-[0_4px_12px_rgba(0,255,153,0.15)] hover:shadow-[0_6px_20px_rgba(0,255,153,0.25),0_0_25px_rgba(0,255,153,0.12)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
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
    </div>
  );
}
