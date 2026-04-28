export interface Orcamento {
  id: string;
  categoriaId: string;
  valor: number;
  mes: number;
  ano: number;
  observacoes?: string;
}
