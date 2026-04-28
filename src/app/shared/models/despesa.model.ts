export interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  data: Date;
  categoriaId: string;
  cartaoId?: string;
  recorrente: boolean;
  observacoes?: string;
}
