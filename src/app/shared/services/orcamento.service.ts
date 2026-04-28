import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Orcamento {
  _id?: string;
  categoriaId: string;
  valor: number;
  mes: number;
  ano: number;
  observacoes?: string;
}

export interface OrcamentoResponse {
  success: boolean;
  data?: Orcamento | Orcamento[];
  error?: string;
  details?: any;
}

export interface FiltrosOrcamento {
  mes?: number;
  ano?: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrcamentoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/orcamentos`;

  listar(filtros?: FiltrosOrcamento): Observable<OrcamentoResponse> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.mes) {
        params = params.set('mes', filtros.mes.toString());
      }
      if (filtros.ano) {
        params = params.set('ano', filtros.ano.toString());
      }
    }

    return this.http.get<OrcamentoResponse>(this.apiUrl, { params });
  }

  buscarPorId(id: string): Observable<OrcamentoResponse> {
    return this.http.get<OrcamentoResponse>(`${this.apiUrl}/${id}`);
  }

  criar(orcamento: Orcamento): Observable<OrcamentoResponse> {
    return this.http.post<OrcamentoResponse>(this.apiUrl, orcamento);
  }

  atualizar(id: string, orcamento: Partial<Orcamento>): Observable<OrcamentoResponse> {
    return this.http.put<OrcamentoResponse>(`${this.apiUrl}/${id}`, orcamento);
  }

  deletar(id: string): Observable<OrcamentoResponse> {
    return this.http.delete<OrcamentoResponse>(`${this.apiUrl}/${id}`);
  }
}
