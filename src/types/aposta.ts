// ============================================================
// Tipos TypeScript — BetFala
// ============================================================

export type ApostaStatus = 'Aberta' | 'Green' | 'Red' | 'Void';

export interface Aposta {
  id: string;
  user_id: string;
  data_criacao: string; // ISO string
  times_apostados: string;
  detalhe_aposta: string;
  odd: number;
  stake: number;
  status: ApostaStatus;
}

export interface ApostaInsert {
  times_apostados: string;
  detalhe_aposta: string;
  odd: number;
  stake: number;
  status?: ApostaStatus;
}

export interface ApostaUpdate {
  id: string;
  status?: ApostaStatus;
  times_apostados?: string;
  detalhe_aposta?: string;
  odd?: number;
  stake?: number;
}

export interface KpiData {
  lucroTotal: number;
  taxaAcerto: number;
  roi: number;
  totalApostas: number;
  totalInvestido: number;
  greens: number;
  reds: number;
  abertas: number;
  voids: number;
}

export interface FiltrosState {
  busca: string;
  periodo: 'todos' | '7dias' | 'mes' | 'personalizado';
  dataInicio?: string;
  dataFim?: string;
}
