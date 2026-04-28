import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Cartao {
  _id?: string;
  nome: string;
  bandeira: 'visa' | 'mastercard' | 'elo' | 'amex' | 'outra';
  limite: number;
  diaVencimento: number;
  diaFechamento: number;
  ativo: boolean;
}

export interface CartaoResponse {
  success: boolean;
  data?: Cartao | Cartao[];
  error?: string;
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class CartaoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/cartoes`;

  listar(): Observable<CartaoResponse> {
    return this.http.get<CartaoResponse>(this.apiUrl);
  }

  buscarPorId(id: string): Observable<CartaoResponse> {
    return this.http.get<CartaoResponse>(`${this.apiUrl}/${id}`);
  }

  criar(cartao: Cartao): Observable<CartaoResponse> {
    return this.http.post<CartaoResponse>(this.apiUrl, cartao);
  }

  atualizar(id: string, cartao: Partial<Cartao>): Observable<CartaoResponse> {
    return this.http.put<CartaoResponse>(`${this.apiUrl}/${id}`, cartao);
  }

  deletar(id: string): Observable<CartaoResponse> {
    return this.http.delete<CartaoResponse>(`${this.apiUrl}/${id}`);
  }
}
