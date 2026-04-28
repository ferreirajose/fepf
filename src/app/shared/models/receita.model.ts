export interface Receita {
  id: string;
  descricao: string;
  valor: number;
  data: Date;
  categoriaId: string;
  recorrente: boolean;
  observacoes?: string;
}
