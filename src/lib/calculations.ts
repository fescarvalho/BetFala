import { Aposta, KpiData } from '@/types/aposta';

// ============================================================
// Cálculos de KPI — BetFala
// ============================================================

/**
 * Calcula todos os KPIs a partir da lista de apostas
 */
export function calcularKpis(apostas: Aposta[]): KpiData {
  const greens = apostas.filter((a) => a.status === 'Green');
  const reds = apostas.filter((a) => a.status === 'Red');
  const abertas = apostas.filter((a) => a.status === 'Aberta');
  const voids = apostas.filter((a) => a.status === 'Void');

  // Lucro das greens: stake * (odd - 1) por cada aposta ganha, mais bônus se houver
  const lucroGreens = greens.reduce((acc, a) => {
    let netProfit = a.stake * (a.odd - 1);
    if (a.bonus_percent) {
      netProfit += netProfit * (a.bonus_percent / 100);
    }
    return acc + netProfit;
  }, 0);
  
  // Prejuízo das reds: soma dos stakes perdidos (0 para freebets)
  const prejuizoReds = reds.reduce((acc, a) => acc + (a.is_freebet ? 0 : a.stake), 0);
  const lucroTotal = lucroGreens - prejuizoReds;

  // Total investido (apenas resolvidas: Green + Red) - exclui freebets
  const totalInvestido = [...greens, ...reds].reduce((acc, a) => acc + (a.is_freebet ? 0 : a.stake), 0);

  // Taxa de acerto
  const resolvidas = greens.length + reds.length;
  const taxaAcerto = resolvidas > 0 ? (greens.length / resolvidas) * 100 : 0;

  // ROI
  const roi = totalInvestido > 0 ? (lucroTotal / totalInvestido) * 100 : 0;

  return {
    lucroTotal,
    taxaAcerto,
    roi,
    totalApostas: apostas.length,
    totalInvestido,
    greens: greens.length,
    reds: reds.length,
    abertas: abertas.length,
    voids: voids.length,
  };
}

/**
 * Gera dados para o gráfico de evolução da banca ao longo do tempo
 */
export function calcularEvolucaoBanca(
  apostas: Aposta[],
  transacoes: import('@/types/aposta').Transacao[] = [],
  bancaInicial: number = 0
): { data: string; banca: number; label: string; timestamp?: number }[] {
  // Apostas ativas e resolvidas
  const ativasEResolvidas = apostas.filter((a) => a.status === 'Green' || a.status === 'Red' || a.status === 'Aberta');

  // Cria eventos para apostas
  const eventos: { tipo: 'aposta' | 'deposito' | 'saque'; valor: number; date: Date; timestamp: number }[] = ativasEResolvidas.map(a => {
    let valor = 0;
    if (a.status === 'Green') {
      let netProfit = a.stake * (a.odd - 1);
      if (a.bonus_percent) {
        netProfit += netProfit * (a.bonus_percent / 100);
      }
      valor = netProfit;
    } else {
      // Red ou Aberta
      valor = a.is_freebet ? 0 : -a.stake;
    }
    const date = new Date(a.data_criacao);
    return { tipo: 'aposta', valor, date, timestamp: date.getTime() };
  });

  // Cria eventos para transacoes
  transacoes.forEach(t => {
    const valor = t.tipo === 'deposito' ? t.valor : -t.valor;
    const date = new Date(t.data_criacao);
    eventos.push({ tipo: t.tipo, valor, date, timestamp: date.getTime() });
  });

  // Ordena todos os eventos cronologicamente
  eventos.sort((a, b) => a.timestamp - b.timestamp);

  let bancaAtual = bancaInicial;
  const pontos: { data: string; banca: number; label: string; timestamp?: number }[] = [
    {
      data: 'Início',
      banca: bancaInicial,
      label: `R$ ${bancaInicial.toFixed(2)}`,
      timestamp: 0,
    },
  ];

  eventos.forEach((evento) => {
    bancaAtual += evento.valor;

    const label = evento.date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });

    pontos.push({
      data: label,
      banca: parseFloat(bancaAtual.toFixed(2)),
      label: `R$ ${bancaAtual.toFixed(2)}`,
      timestamp: evento.timestamp,
    });
  });

  return pontos;
}

/**
 * Filtra apostas por período
 */
export function filtrarPorPeriodo(
  apostas: Aposta[],
  periodo: string,
  dataInicio?: string,
  dataFim?: string
): Aposta[] {
  const agora = new Date();

  switch (periodo) {
    case '7dias': {
      const limite = new Date(agora.getTime() - 7 * 86400000);
      return apostas.filter((a) => new Date(a.data_criacao) >= limite);
    }
    case 'mes': {
      const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
      return apostas.filter((a) => new Date(a.data_criacao) >= inicio);
    }
    case 'personalizado': {
      if (!dataInicio && !dataFim) return apostas;
      return apostas.filter((a) => {
        const d = new Date(a.data_criacao);
        const start = dataInicio ? new Date(dataInicio) : new Date(0);
        const end = dataFim ? new Date(dataFim + 'T23:59:59') : new Date();
        return d >= start && d <= end;
      });
    }
    default:
      return apostas;
  }
}

/**
 * Formata valor monetário em BRL
 */
export function formatarMoeda(valor: number): string {
  // Evita exibir -R$ 0,00 para valores muito próximos de zero
  const v = Math.abs(valor) < 0.01 ? 0 : valor;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v);
}

/**
 * Formata porcentagem
 */
export function formatarPorcentagem(valor: number): string {
  return `${valor.toFixed(1)}%`;
}
