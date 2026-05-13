import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackupService } from '../../shared/services/backup.service';

@Component({
  selector: 'app-backup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './backup.component.html',
  styleUrl: './backup.component.css'
})
export class BackupComponent {
  private backupService = inject(BackupService);

  carregando = signal(false);
  mensagem = signal<{ tipo: 'success' | 'error', texto: string } | null>(null);
  ultimoBackup = signal<any>(null);

  gerarBackup() {
    this.carregando.set(true);
    this.mensagem.set(null);

    this.backupService.gerarBackup().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.ultimoBackup.set(response.data);
          const dataStr = JSON.stringify(response.data, null, 2);
          const blob = new Blob([dataStr], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `backup-fepf-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          window.URL.revokeObjectURL(url);

          this.mensagem.set({
            tipo: 'success',
            texto: 'Backup gerado com sucesso! O arquivo foi baixado.'
          });
        } else {
          this.mensagem.set({
            tipo: 'error',
            texto: response.error || 'Erro ao gerar backup'
          });
        }
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao gerar backup:', err);
        this.mensagem.set({
          tipo: 'error',
          texto: 'Não foi possível gerar o backup'
        });
        this.carregando.set(false);
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const backup = JSON.parse(content);
          this.restaurarBackup(backup);
        } catch (error) {
          this.mensagem.set({
            tipo: 'error',
            texto: 'Arquivo inválido. Selecione um arquivo JSON válido.'
          });
        }
      };

      reader.readAsText(file);
    }
  }

  restaurarBackup(backup: any) {
    if (!backup.data) {
      this.mensagem.set({
        tipo: 'error',
        texto: 'Estrutura de backup inválida'
      });
      return;
    }

    if (!confirm('⚠️ ATENÇÃO: Esta ação irá sobrescrever os dados existentes. Deseja continuar?')) {
      return;
    }

    this.carregando.set(true);
    this.mensagem.set(null);

    this.backupService.restaurarBackup(backup.data).subscribe({
      next: (response) => {
        if (response.success) {
          this.mensagem.set({
            tipo: 'success',
            texto: 'Backup restaurado com sucesso!'
          });
        } else {
          this.mensagem.set({
            tipo: 'error',
            texto: response.error || 'Erro ao restaurar backup'
          });
        }
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao restaurar backup:', err);
        this.mensagem.set({
          tipo: 'error',
          texto: 'Não foi possível restaurar o backup'
        });
        this.carregando.set(false);
      }
    });
  }
}
