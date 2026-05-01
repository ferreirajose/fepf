export interface Receita {
  id: string;
  descricao: string;
  valor: number;
  data: Date;
  categoriaId: string;
  subcategoriaId?: string;
  recorrente: boolean;
  observacoes?: string;
}
