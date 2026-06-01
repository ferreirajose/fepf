export type TipoConta = 'conta_corrente' | 'poupanca' | 'investimentos' | 'conta_beneficios';
export type Banco = 'inter' | 'bradesco' | 'itau' | 'caixa' | 'nubank' | 'santander' | 'pan';

export interface Conta {
  id?: string;
  _id?: string;
  nome: string;
  tipoConta: TipoConta;
  banco?: Banco;
  subTipoConta?: string;
  saldoInicial: number;
  saldoAtual: number;
  ativo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContaResponse {
  success: boolean;
  data?: Conta | Conta[];
  error?: string;
  details?: any;
}

export interface SaldoResponse {
  success: boolean;
  data?: {
    contaId: string;
    nome: string;
    saldoInicial: number;
    totalReceitas: number;
    totalDespesas: number;
    totalRecebido: number;
    totalEnviado: number;
    saldoAtual: number;
  };
  error?: string;
}
