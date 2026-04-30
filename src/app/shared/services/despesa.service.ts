import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Localizacao {
  latitude?: number;
  longitude?: number;
  endereco?: string;
}

export interface Despesa {
  id?: string;
  descricao: string;
  valor: number;
  data: Date | string;
  categoriaId: string;
  cartaoId?: string;
  recorrente: boolean;
  observacoes?: string;
  formaPagamento?: 'dinheiro' | 'debito' | 'credito' | 'pix';
  pago?: boolean;
  localizacao?: Localizacao;
}

export interface DespesaResponse {
  success: boolean;
  data?: Despesa | Despesa[];
  error?: string;
  details?: any;
}

export interface DespesaEstatisticas {
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

export interface FiltrosDespesa {
  dataInicio?: string;
  dataFim?: string;
  categoriaId?: string;
  cartaoId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DespesaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/despesas`;

  listar(filtros?: FiltrosDespesa): Observable<DespesaResponse> {
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
      if (filtros.cartaoId) {
        params = params.set('cartaoId', filtros.cartaoId);
      }
    }

    return this.http.get<DespesaResponse>(this.apiUrl, { params });
  }

  buscarPorId(id: string): Observable<DespesaResponse> {
    return this.http.get<DespesaResponse>(`${this.apiUrl}/${id}`);
  }

  criar(despesa: Despesa): Observable<DespesaResponse> {
    return this.http.post<DespesaResponse>(this.apiUrl, despesa);
  }

  atualizar(id: string, despesa: Partial<Despesa>): Observable<DespesaResponse> {
    return this.http.put<DespesaResponse>(`${this.apiUrl}/${id}`, despesa);
  }

  deletar(id: string): Observable<DespesaResponse> {
    return this.http.delete<DespesaResponse>(`${this.apiUrl}/${id}`);
  }

  obterEstatisticas(filtros?: { dataInicio?: string; dataFim?: string }): Observable<{ success: boolean; data: DespesaEstatisticas }> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.dataInicio) {
        params = params.set('dataInicio', filtros.dataInicio);
      }
      if (filtros.dataFim) {
        params = params.set('dataFim', filtros.dataFim);
      }
    }

    return this.http.get<{ success: boolean; data: DespesaEstatisticas }>(`${this.apiUrl}/estatisticas`, { params });
  }

  exportar(filtros?: FiltrosDespesa): Observable<Blob> {
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
      if (filtros.cartaoId) {
        params = params.set('cartaoId', filtros.cartaoId);
      }
    }

    return this.http.get(`${environment.apiUrl}/api/export/despesas`, {
      params,
      responseType: 'blob'
    });
  }

  importar(arquivo: File): Observable<DespesaResponse> {
    const formData = new FormData();
    formData.append('file', arquivo);
    return this.http.post<DespesaResponse>(`${environment.apiUrl}/api/import/despesas`, formData);
  }
}
