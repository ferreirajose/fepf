import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BackupResponse {
  success: boolean;
  data?: any;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BackupService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/backup`;

  gerarBackup(): Observable<BackupResponse> {
    return this.http.get<BackupResponse>(this.apiUrl);
  }

  restaurarBackup(data: any): Observable<BackupResponse> {
    return this.http.post<BackupResponse>(`${this.apiUrl}/restaurar`, { data });
  }
}
