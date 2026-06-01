export interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  data: Date;
  categoriaId: string;
  subcategoriaId?: string;
  cartaoId?: string;
  contaId?: string;
  recorrente: boolean;
  observacoes?: string;
}
