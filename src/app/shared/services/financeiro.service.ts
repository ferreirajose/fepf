import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SaldoAcumulado } from '../models/saldo.model';
import { DashboardFinanceiro } from '../models/dashboard.model';

export interface SaldoResponse {
  success: boolean;
  data?: SaldoAcumulado;
  error?: string;
}

export interface DashboardResponse {
  success: boolean;
  data?: DashboardFinanceiro;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FinanceiroService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/financeiro`;

  obterSaldoAcumulado(mes: number, ano: number): Observable<SaldoResponse> {
    return this.http.get<SaldoResponse>(
      `${this.apiUrl}/saldo-acumulado?mes=${mes}&ano=${ano}`
    );
  }

  obterDashboard(mes: number, ano: number): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(
      `${this.apiUrl}/dashboard?mes=${mes}&ano=${ano}`
    );
  }
}
