import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Transferencia, TransferenciaResponse, FiltrosTransferencia } from '../models/transferencia.model';

@Injectable({
  providedIn: 'root'
})
export class TransferenciaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/transferencias`;

  listar(filtros?: FiltrosTransferencia): Observable<TransferenciaResponse> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.dataInicio) {
        params = params.set('dataInicio', filtros.dataInicio);
      }
      if (filtros.dataFim) {
        params = params.set('dataFim', filtros.dataFim);
      }
      if (filtros.contaId) {
        params = params.set('contaId', filtros.contaId);
      }
    }

    return this.http.get<TransferenciaResponse>(this.apiUrl, { params });
  }

  buscarPorId(id: string): Observable<TransferenciaResponse> {
    return this.http.get<TransferenciaResponse>(`${this.apiUrl}/${id}`);
  }

  criar(transferencia: Partial<Transferencia>): Observable<TransferenciaResponse> {
    return this.http.post<TransferenciaResponse>(this.apiUrl, transferencia);
  }

  atualizar(id: string, transferencia: Partial<Transferencia>): Observable<TransferenciaResponse> {
    return this.http.put<TransferenciaResponse>(`${this.apiUrl}/${id}`, transferencia);
  }

  deletar(id: string): Observable<TransferenciaResponse> {
    return this.http.delete<TransferenciaResponse>(`${this.apiUrl}/${id}`);
  }
}
