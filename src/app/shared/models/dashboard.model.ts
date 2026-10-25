import { SaldoAcumulado } from './saldo.model';

// Datas chegam da API como string ISO (meia-noite UTC)

export interface DashboardEvolucaoMes {
  ano: number;
  mes: number;
  receitas: number;
  despesas: number;
}

export interface DashboardCategoria {
  categoriaId: string | null;
  nome: string;
  cor: string;
  total: number;
  quantidade: number;
}

export interface DashboardCartao {
  _id: string;
  nome: string;
  limite: number;
  utilizado: number;
  disponivel: number;
  percentualUtilizado: number;
  cicloInicio: string;
  cicloFim: string;
}

export interface DashboardOrcamento {
  _id: string;
  categoriaNome: string;
  categoriaCor: string;
  valorPlanejado: number;
  valorGasto: number;
  valorRestante: number;
  percentualGasto: number;
}

export interface DashboardTransacao {
  _id: string;
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor: number;
  data: string;
}

export interface DashboardLocal {
  _id: string;
  descricao: string;
  valor: number;
  data: string;
  latitude: number;
  longitude: number;
  endereco: string;
  categoriaNome: string;
  categoriaCor: string;
}

export interface DashboardFinanceiro {
  saldo: SaldoAcumulado;
  evolucao: DashboardEvolucaoMes[];
  despesasPorCategoria: DashboardCategoria[];
  cartoes: DashboardCartao[];
  orcamentos: DashboardOrcamento[];
  transacoesRecentes: DashboardTransacao[];
  locais: DashboardLocal[];
}
