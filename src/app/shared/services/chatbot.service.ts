import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ChatResponse,
  SendMessageRequest
} from '../models/chatbot.model';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/chatbot`;

  enviarMensagem(request: SendMessageRequest): Observable<ChatResponse> {
    const formData = new FormData();
    formData.append('sessionId', request.sessionId);
    formData.append('message', request.message);

    if (request.provider) {
      formData.append('provider', request.provider);
    }

    if (request.model) {
      formData.append('model', request.model);
    }

    if (request.files && request.files.length > 0) {
      request.files.forEach(file => {
        formData.append('files', file, file.name);
      });
    }

    return this.http.post<ChatResponse>(`${this.apiUrl}/message`, formData);
  }

  obterHistorico(sessionId: string, limite?: number): Observable<ChatResponse> {
    let params = new HttpParams();

    if (limite) {
      params = params.set('limite', limite.toString());
    }

    return this.http.get<ChatResponse>(`${this.apiUrl}/history/${sessionId}`, { params });
  }

  limparHistorico(sessionId: string): Observable<ChatResponse> {
    return this.http.delete<ChatResponse>(`${this.apiUrl}/history/${sessionId}`);
  }

  obterContextoFinanceiro(filtros?: {
    dataInicio?: string;
    dataFim?: string;
    limite?: number;
  }): Observable<ChatResponse> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.dataInicio) {
        params = params.set('dataInicio', filtros.dataInicio);
      }
      if (filtros.dataFim) {
        params = params.set('dataFim', filtros.dataFim);
      }
      if (filtros.limite) {
        params = params.set('limite', filtros.limite.toString());
      }
    }

    return this.http.get<ChatResponse>(`${this.apiUrl}/context`, { params });
  }

  gerarSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  validarTipoArquivo(file: File): boolean {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ];

    return allowedTypes.includes(file.type);
  }

  formatarTamanhoArquivo(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
