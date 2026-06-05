// ============================================================
// Tipos TypeScript — BetFala
// ============================================================

export type ApostaStatus = 'Aberta' | 'Green' | 'Red' | 'Void' | 'Cashout';

export interface Banca {
  id: string;
  user_id: string;
  nome: string;
  saldo_inicial: number;
  data_criacao: string;
}

export type TipoTransacao = 'deposito' | 'saque';

export interface Transacao {
  id: string;
  user_id: string;
  banca_id: string;
  tipo: TipoTransacao;
  valor: number;
  data_criacao: string;
}

export interface Aposta {
  id: string;
  user_id: string;
  data_criacao: string; // ISO string
  times_apostados: string;
  detalhe_aposta: string;
  odd: number;
  stake: number;
  status: ApostaStatus;
  banca_id?: string;
  is_freebet?: boolean;
  bonus_percent?: number;
  valor_cashout?: number;
}

export interface ApostaInsert {
  times_apostados: string;
  detalhe_aposta: string;
  odd: number;
  stake: number;
  status?: ApostaStatus;
  banca_id?: string;
  is_freebet?: boolean;
  bonus_percent?: number;
  valor_cashout?: number;
}

export interface ApostaUpdate {
  id: string;
  status?: ApostaStatus;
  times_apostados?: string;
  detalhe_aposta?: string;
  odd?: number;
  stake?: number;
  banca_id?: string;
  is_freebet?: boolean;
  bonus_percent?: number;
  valor_cashout?: number;
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
