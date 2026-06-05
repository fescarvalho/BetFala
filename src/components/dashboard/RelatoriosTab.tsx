'use client';

import { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, Activity, WalletCards } from 'lucide-react';
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
        let lucro = a.stake * (a.odd - 1);
        if (a.bonus_percent) {
          lucro += lucro * (a.bonus_percent / 100);
        }
        combined.push({
          id: a.id,
          data: a.data_criacao || new Date().toISOString(),
          tipo: 'aposta',
          descricao: `Aposta: ${a.times_apostados}`,
          valor: lucro,
          isGreen: true,
        });
      } else if (a.status === 'Cashout') {
        const lucro = (a.valor_cashout || 0) - a.stake;
        combined.push({
          id: a.id,
          data: a.data_criacao || new Date().toISOString(),
          tipo: 'aposta',
          descricao: `Cashout: ${a.times_apostados}`,
          valor: lucro,
          isGreen: lucro > 0,
        });
      } else if (a.status === 'Red') {
        combined.push({
          id: a.id,
          data: a.data_criacao || new Date().toISOString(),
          tipo: 'aposta',
          descricao: `Aposta: ${a.times_apostados}`,
          valor: a.is_freebet ? 0 : -a.stake,
          isGreen: false,
        });
      } else if (a.status === 'Aberta') {
        combined.push({
          id: a.id,
          data: a.data_criacao || new Date().toISOString(),
          tipo: 'aposta',
          descricao: `Aposta (Aberta): ${a.times_apostados}`,
          valor: a.is_freebet ? 0 : -a.stake,
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {extrato.map((item) => {
          const isPositive = item.valor >= 0;
          
          let icon;
          if (item.tipo === 'deposito' || item.id === 'initial') {
            icon = <ArrowUpRight size={18} strokeWidth={2.5} />;
          } else if (item.tipo === 'saque') {
            icon = <ArrowDownRight size={18} strokeWidth={2.5} />;
          } else {
            icon = <Activity size={18} strokeWidth={2.5} />;
          }

          return (
            <article
              key={item.id}
              style={{
                background: '#0F172A',
                borderRadius: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '18px 20px',
                transition: 'background 0.3s ease',
              }}
            >
              {/* Ícone */}
              <div
                style={{
                  height: '40px',
                  width: '40px',
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '14px',
                  background: item.tipo === 'deposito' || item.id === 'initial' || isPositive ? 'rgba(0,255,136,0.1)' : 'rgba(255,77,109,0.1)',
                  color: item.tipo === 'deposito' || item.id === 'initial' || isPositive ? '#00FF88' : '#ff9aae',
                }}
              >
                {icon}
              </div>

              {/* Informações */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    lineHeight: '1.3',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: '4px',
                  }}
                >
                  {item.descricao}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    color: 'rgba(148,163,184,0.55)',
                    lineHeight: '1',
                  }}
                >
                  {new Date(item.data).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              {/* Valores */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '5px',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: isPositive ? '#00FF88' : '#ff9aae',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isPositive ? '+' : ''}{formatarMoeda(item.valor)}
                </span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#94A3B8',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Saldo: {formatarMoeda(item.saldoApos)}
                </span>
              </div>
            </article>
          );
        })}
        {extrato.length === 0 && (
          <div
            className="col-span-1 lg:col-span-2 rounded-[24px] px-6 py-12 text-center"
            style={{ background: '#0F172A' }}
          >
            <p className="text-[15px] font-semibold text-white">Nenhuma movimentação encontrada</p>
            <p className="mt-2 text-[13px] text-[#94A3B8]">As transações desta banca aparecerão aqui.</p>
          </div>
        )}
      </div>
    </section>
  );
}
