import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Subcategoria {
  id: string;
  nome: string;
  icone?: string;
  categoriaId: string;
  ativo: boolean;
}

export interface Categoria {
  _id?: string;
  nome: string;
  tipo?: 'receita' | 'despesa';
  cor?: string;
  icone?: string;
  subcategorias?: Subcategoria[];
  ativo: boolean;
  dataCriacao?: Date;
}

export interface CategoriaResponse {
  success: boolean;
  data?: Categoria | Categoria[];
  error?: string;
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/categorias`;

  listar(): Observable<CategoriaResponse> {
    return this.http.get<CategoriaResponse>(this.apiUrl);
  }

  buscarPorId(id: string): Observable<CategoriaResponse> {
    return this.http.get<CategoriaResponse>(`${this.apiUrl}/${id}`);
  }

  criar(categoria: Categoria): Observable<CategoriaResponse> {
    return this.http.post<CategoriaResponse>(this.apiUrl, categoria);
  }

  atualizar(id: string, categoria: Partial<Categoria>): Observable<CategoriaResponse> {
    return this.http.put<CategoriaResponse>(`${this.apiUrl}/${id}`, categoria);
  }

  deletar(id: string): Observable<CategoriaResponse> {
    return this.http.delete<CategoriaResponse>(`${this.apiUrl}/${id}`);
  }

  adicionarSubcategoria(categoriaId: string, nome: string, icone?: string): Observable<CategoriaResponse> {
    return this.http.post<CategoriaResponse>(`${this.apiUrl}/${categoriaId}/subcategorias`, { nome, icone });
  }

  atualizarSubcategoria(categoriaId: string, subcategoriaId: string, dados: { nome?: string; icone?: string; ativo?: boolean }): Observable<CategoriaResponse> {
    return this.http.put<CategoriaResponse>(`${this.apiUrl}/${categoriaId}/subcategorias/${subcategoriaId}`, dados);
  }

  deletarSubcategoria(categoriaId: string, subcategoriaId: string): Observable<CategoriaResponse> {
    return this.http.delete<CategoriaResponse>(`${this.apiUrl}/${categoriaId}/subcategorias/${subcategoriaId}`);
  }
}
