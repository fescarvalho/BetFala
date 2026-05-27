'use client';

import { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, Search, Activity, WalletCards } from 'lucide-react';
import { Banca, Aposta, Transacao } from '@/types/aposta';
import { formatarMoeda } from '@/lib/calculations';

interface RelatoriosTabProps {
  activeBanca: Banca | null;
  apostas: Aposta[];
  transacoes: Transacao[];
  bancas: Banca[];
}

type ExtratoItem = {
  id: string;
  data: string;
  tipo: 'deposito' | 'saque' | 'aposta';
  descricao: string;
  valor: number;
  saldoApos: number;
  isGreen?: boolean;
};

export default function RelatoriosTab({ activeBanca, apostas, transacoes, bancas }: RelatoriosTabProps) {
  const extrato = useMemo(() => {
    if (!activeBanca) return [];

    const defaultBancaId = bancas[0]?.id;
    const bancaBets = apostas.filter(
      (a) => a.banca_id === activeBanca.id || (!a.banca_id && activeBanca.id === defaultBancaId)
    );
    const bancaTransacoes = transacoes.filter((t) => t.banca_id === activeBanca.id);

    // Combine both into a common type
    const combined: Omit<ExtratoItem, 'saldoApos'>[] = [];

    // Add transactions
    bancaTransacoes.forEach(t => {
      combined.push({
        id: t.id,
        data: t.data_criacao,
        tipo: t.tipo,
        descricao: t.tipo === 'deposito' ? 'Depósito' : 'Saque',
        valor: t.tipo === 'deposito' ? t.valor : -t.valor,
      });
    });

    // Add finalized bets
    bancaBets.forEach(a => {
      if (a.status === 'Green') {
        const lucro = a.stake * (a.odd - 1);
        combined.push({
          id: a.id,
          data: a.data_criacao || new Date().toISOString(),
          tipo: 'aposta',
          descricao: `Aposta: ${a.times_apostados}`,
          valor: lucro,
          isGreen: true,
        });
      } else if (a.status === 'Red') {
        combined.push({
          id: a.id,
          data: a.data_criacao || new Date().toISOString(),
          tipo: 'aposta',
          descricao: `Aposta: ${a.times_apostados}`,
          valor: -a.stake,
          isGreen: false,
        });
      }
    });

    // Sort ascending to calculate running balance
    combined.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    let runningBalance = activeBanca.saldo_inicial;
    const result: ExtratoItem[] = [];

    // Add initial balance as first item
    result.push({
      id: 'initial',
      data: activeBanca.data_criacao || new Date(0).toISOString(),
      tipo: 'deposito',
      descricao: 'Saldo Inicial',
      valor: activeBanca.saldo_inicial,
      saldoApos: activeBanca.saldo_inicial,
    });

    for (const item of combined) {
      runningBalance += item.valor;
      result.push({
        ...item,
        saldoApos: runningBalance,
      });
    }

    // Return reversed (newest first)
    return result.reverse();
  }, [activeBanca, apostas, transacoes, bancas]);

  if (!activeBanca) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#94A3B8]">
        <WalletCards size={48} className="mb-4 opacity-20" />
        <p>Selecione uma banca para ver o relatório.</p>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-6 w-full animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white leading-tight">Extrato da Banca</h2>
          <p className="text-sm font-medium text-[#94A3B8] mt-1">
            Histórico completo de depósitos, saques e resultados de apostas.
          </p>
        </div>
      </div>

      <div className="bg-[#0F172A] border border-white/[0.05] rounded-[24px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="px-6 py-4 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider text-right">Valor</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider text-right">Saldo na Banca</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {extrato.map((item) => {
                const isPositive = item.valor >= 0;
                
                let icon;
                if (item.tipo === 'deposito' || item.id === 'initial') {
                  icon = <ArrowUpRight size={14} className="text-[#00FF88]" strokeWidth={2.5} />;
                } else if (item.tipo === 'saque') {
                  icon = <ArrowDownRight size={14} className="text-[#ff9aae]" strokeWidth={2.5} />;
                } else {
                  icon = <Activity size={14} className={isPositive ? "text-[#00FF88]" : "text-[#ff9aae]"} strokeWidth={2.5} />;
                }

                return (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[#94A3B8]">
                        {new Date(item.data).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          item.tipo === 'deposito' || item.id === 'initial' ? 'bg-[#00FF88]/10' :
                          item.tipo === 'saque' ? 'bg-[#ff9aae]/10' :
                          isPositive ? 'bg-[#00FF88]/10' : 'bg-[#ff9aae]/10'
                        }`}>
                          {icon}
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {item.descricao}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-bold font-monospace ${
                        isPositive ? 'text-[#00FF88]' : 'text-[#ff9aae]'
                      }`}>
                        {isPositive ? '+' : ''}{formatarMoeda(item.valor)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-bold text-white font-monospace">
                        {formatarMoeda(item.saldoApos)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {extrato.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[#94A3B8] text-sm">
                    Nenhuma movimentação encontrada nesta banca.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
