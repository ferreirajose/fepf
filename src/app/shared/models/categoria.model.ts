export interface Categoria {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor?: string;
  icone?: string;
  subcategorias?: Subcategoria[];
  ativo: boolean;
  dataCriacao: Date;
}

export interface Subcategoria {
  id: string;
  nome: string;
  categoriaId: string;
  ativo: boolean;
}
