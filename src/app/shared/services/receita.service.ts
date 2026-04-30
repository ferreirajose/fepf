import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Receita {
  id?: string;
  descricao: string;
  valor: number;
  data: Date | string;
  categoriaId: string;
  recorrente: boolean;
  observacoes?: string;
}

export interface ReceitaResponse {
  success: boolean;
  data?: Receita | Receita[];
  error?: string;
  details?: any;
}

export interface ReceitaEstatisticas {
  total: number;
  porCategoria: Array<{
    categoriaId: string;
    categoriaNome: string;
    total: number;
    quantidade: number;
  }>;
  porMes: Array<{
    _id: {
      mes: number;
      ano: number;
    };
    total: number;
    quantidade: number;
  }>;
}

export interface FiltrosReceita {
  dataInicio?: string;
  dataFim?: string;
  categoriaId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReceitaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/receitas`;

  listar(filtros?: FiltrosReceita): Observable<ReceitaResponse> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.dataInicio) {
        params = params.set('dataInicio', filtros.dataInicio);
      }
      if (filtros.dataFim) {
        params = params.set('dataFim', filtros.dataFim);
      }
      if (filtros.categoriaId) {
        params = params.set('categoriaId', filtros.categoriaId);
      }
    }

    return this.http.get<ReceitaResponse>(this.apiUrl, { params });
  }

  buscarPorId(id: string): Observable<ReceitaResponse> {
    return this.http.get<ReceitaResponse>(`${this.apiUrl}/${id}`);
  }

  criar(receita: Receita): Observable<ReceitaResponse> {
    return this.http.post<ReceitaResponse>(this.apiUrl, receita);
  }

  atualizar(id: string, receita: Partial<Receita>): Observable<ReceitaResponse> {
    return this.http.put<ReceitaResponse>(`${this.apiUrl}/${id}`, receita);
  }

  deletar(id: string): Observable<ReceitaResponse> {
    return this.http.delete<ReceitaResponse>(`${this.apiUrl}/${id}`);
  }

  obterEstatisticas(filtros?: { dataInicio?: string; dataFim?: string }): Observable<{ success: boolean; data: ReceitaEstatisticas }> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.dataInicio) {
        params = params.set('dataInicio', filtros.dataInicio);
      }
      if (filtros.dataFim) {
        params = params.set('dataFim', filtros.dataFim);
      }
    }

    return this.http.get<{ success: boolean; data: ReceitaEstatisticas }>(`${this.apiUrl}/estatisticas`, { params });
  }

  exportar(filtros?: FiltrosReceita): Observable<Blob> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.dataInicio) {
        params = params.set('dataInicio', filtros.dataInicio);
      }
      if (filtros.dataFim) {
        params = params.set('dataFim', filtros.dataFim);
      }
      if (filtros.categoriaId) {
        params = params.set('categoriaId', filtros.categoriaId);
      }
    }

    return this.http.get(`${environment.apiUrl}/api/export/receitas`, {
      params,
      responseType: 'blob'
    });
  }

  importar(arquivo: File): Observable<ReceitaResponse> {
    const formData = new FormData();
    formData.append('file', arquivo);
    return this.http.post<ReceitaResponse>(`${environment.apiUrl}/api/import/receitas`, formData);
  }
}
