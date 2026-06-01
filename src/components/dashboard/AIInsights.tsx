'use client';

import { useEffect, useState } from 'react';
import { Bot, X, ArrowRight, Calendar, AlertCircle, RefreshCcw } from 'lucide-react';

interface Insight {
  jogo: string;
  mercado: string;
  selecao?: string;
  odd: number;
  horario?: string;
  justificativa: string;
}

interface AIInsightsProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNovaAposta?: (prefill: { jogo: string; mercado: string; odd: number }) => void;
}

export function AIInsights({ isOpen, onClose, onOpenNovaAposta }: AIInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = force ? '/api/insights?refresh=true' : '/api/insights';
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao buscar insights');
      }

      if (data.insights && Array.isArray(data.insights)) {
        setInsights(data.insights);
      } else {
        setInsights([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && insights.length === 0 && !error) {
      // Fetch insights, relying on backend cache verification (or generating fresh if stale)
      fetchInsights(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#11131A] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/[0.05] bg-[#11131A] shrink-0" style={{ padding: "10px" }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <Bot className="w-7 h-7 text-[#00FF88] shrink-0" />
          <h2 className="text-2xl font-bold text-[#00FF88] tracking-tight truncate">AI Insights</h2>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 shrink-0 rounded-full bg-[#1C1F2E] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto w-full pt-5 pb-24 flex flex-col gap-4" style={{ paddingLeft: '20px', paddingRight: '20px', marginTop: '20px' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <RefreshCcw className="w-10 h-10 text-[#00FF88] animate-spin mb-4" />
            <h3 className="text-white font-bold text-xl mb-2">Analisando Mercado</h3>
            <p className="text-gray-400 text-sm text-center">Processando dados e cruzando estatísticas...</p>
          </div>
        ) : error || insights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <AlertCircle className="w-12 h-12 text-gray-500 mb-4" />
            <h3 className="text-white font-bold text-xl mb-2">Sem Recomendações</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
              {error ? 'Erro ao conectar. Tente novamente.' : 'Nenhuma aposta com valor esperado encontrada agora.'}
            </p>
            <button
              onClick={() => fetchInsights(true)}
              className="px-6 py-3 bg-[#00FF88] text-[#11131A] font-bold rounded-xl flex items-center gap-2 mx-auto"
            >
              <RefreshCcw className="w-4 h-4" /> Refazer Análise
            </button>
          </div>
        ) : (
          <>
            {insights.map((insight, idx) => {
              const marketName = insight.mercado;

              return (
                <div key={idx} className="bg-[#1C1F2E] rounded-3xl p-5 border border-white/[0.04]  shadow-lg w-full min-w-0" style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: "10px", paddingBottom: "10px" }}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="inline-flex max-w-full text-[#93C5FD] text-[10px] font-bold px-3 py-1.5 rounded-full mb-3.5 uppercase tracking-wide bg-white/[0.03] border border-white/[0.05]">
                        <span className="truncate">{marketName}</span>
                      </div>
                      <h3 className="text-white text-[19px] font-medium leading-snug mb-2.5 break-words">
                        {insight.jogo}
                      </h3>
                      
                      {insight.selecao && (
                        <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl px-3.5 py-2 mb-3 mt-1">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                            Entrada Sugerida:
                          </div>
                          <div className="text-[15px] text-[#00FF88] font-extrabold tracking-tight">
                            {insight.selecao}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-gray-400 text-[13px] mb-5">
                        <Calendar className="w-4 h-4 opacity-70 shrink-0" />
                        <span className="truncate">
                          {insight.horario ? `Hoje às ${insight.horario}` : 'Mercados Diários • Hoje'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 shrink-0">
                      <div className="bg-[#00FF88] text-black font-black text-xl px-4 py-2 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,255,136,0.15)] min-w-[60px]">
                        {Number(insight.odd).toFixed(2)}
                      </div>
                      <button
                        onClick={() => {
                          if (onOpenNovaAposta) {
                            onClose();
                            const fullMarket = insight.selecao 
                              ? `${insight.mercado} - ${insight.selecao}`
                              : insight.mercado;
                            onOpenNovaAposta({ jogo: insight.jogo, mercado: fullMarket, odd: insight.odd });
                          }
                        }}
                        className="bg-[#00FF88] text-black rounded-xl h-10 w-full flex items-center justify-center hover:bg-[#00CC70] active:scale-95 transition-all shadow-[0_0_15px_rgba(0,255,136,0.15)]"
                        title="Abrir formulário de nova aposta"
                      >
                        <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#11131A] rounded-2xl p-5 mt-1 border border-white/[0.02] w-full min-w-0" style={{ padding: '10px', marginTop: "10px" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Bot className="w-4 h-4 text-[#00FF88] shrink-0" />
                      <span className="text-[#00FF88] text-[11px] font-bold uppercase tracking-widest truncate">
                        Analysis
                      </span>
                    </div>
                    <p className="text-gray-300 text-[14px] leading-relaxed break-words" >
                      {insight.justificativa}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Bottom Banner */}

          </>
        )}
      </div>
    </div>
  );
}
