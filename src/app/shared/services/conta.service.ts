import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Conta, ContaResponse, SaldoResponse } from '../models/conta.model';

@Injectable({
  providedIn: 'root'
})
export class ContaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/contas`;

  listar(ativo?: boolean): Observable<ContaResponse> {
    const options = ativo !== undefined
      ? { params: { ativo: ativo.toString() } }
      : {};
    return this.http.get<ContaResponse>(this.apiUrl, options);
  }

  buscarPorId(id: string): Observable<ContaResponse> {
    return this.http.get<ContaResponse>(`${this.apiUrl}/${id}`);
  }

  criar(conta: Partial<Conta>): Observable<ContaResponse> {
    return this.http.post<ContaResponse>(this.apiUrl, conta);
  }

  atualizar(id: string, conta: Partial<Conta>): Observable<ContaResponse> {
    return this.http.put<ContaResponse>(`${this.apiUrl}/${id}`, conta);
  }

  deletar(id: string): Observable<ContaResponse> {
    return this.http.delete<ContaResponse>(`${this.apiUrl}/${id}`);
  }

  calcularSaldo(id: string): Observable<SaldoResponse> {
    return this.http.get<SaldoResponse>(`${this.apiUrl}/${id}/saldo`);
  }
}
