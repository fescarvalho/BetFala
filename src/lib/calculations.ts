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

  // Lucro das greens: stake * (odd - 1) por cada aposta ganha
  const lucroGreens = greens.reduce((acc, a) => acc + a.stake * (a.odd - 1), 0);
  // Prejuízo das reds: soma dos stakes perdidos
  const prejuizoReds = reds.reduce((acc, a) => acc + a.stake, 0);
  const lucroTotal = lucroGreens - prejuizoReds;

  // Total investido (apenas resolvidas: Green + Red)
  const totalInvestido = [...greens, ...reds].reduce((acc, a) => acc + a.stake, 0);

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
  bancaInicial: number = 0
): { data: string; banca: number; label: string }[] {
  // Apenas apostas resolvidas, ordenadas por data
  const resolvidas = apostas
    .filter((a) => a.status === 'Green' || a.status === 'Red')
    .sort(
      (a, b) =>
        new Date(a.data_criacao).getTime() - new Date(b.data_criacao).getTime()
    );

  let bancaAtual = bancaInicial;
  const pontos: { data: string; banca: number; label: string }[] = [
    {
      data: 'Início',
      banca: bancaInicial,
      label: `R$ ${bancaInicial.toFixed(2)}`,
    },
  ];

  resolvidas.forEach((aposta) => {
    if (aposta.status === 'Green') {
      bancaAtual += aposta.stake * (aposta.odd - 1);
    } else {
      bancaAtual -= aposta.stake;
    }

    const date = new Date(aposta.data_criacao);
    const label = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });

    pontos.push({
      data: label,
      banca: parseFloat(bancaAtual.toFixed(2)),
      label: `R$ ${bancaAtual.toFixed(2)}`,
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
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

/**
 * Formata porcentagem
 */
export function formatarPorcentagem(valor: number): string {
  return `${valor.toFixed(1)}%`;
}
