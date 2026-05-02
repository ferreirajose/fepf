import { Component, signal, OnInit, PLATFORM_ID, inject, Optional } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-pwa-update-prompt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pwa-update-prompt.component.html',
  styleUrls: ['./pwa-update-prompt.component.css']
})
export class PwaUpdatePromptComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private swUpdate = inject(SwUpdate, { optional: true });

  showUpdatePrompt = signal(false);

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId) || !this.swUpdate) {
      return;
    }

    if (this.swUpdate.isEnabled) {
      // Verificar se há atualizações disponíveis
      this.swUpdate.versionUpdates
        .pipe(
          filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
        )
        .subscribe(() => {
          this.showUpdatePrompt.set(true);
        });

      // Verificar atualizações periodicamente (a cada 6 horas)
      setInterval(() => {
        this.swUpdate?.checkForUpdate();
      }, 6 * 60 * 60 * 1000);

      // Verificar imediatamente ao iniciar
      this.swUpdate.checkForUpdate();
    }
  }

  updateApp() {
    if (this.swUpdate?.isEnabled) {
      this.swUpdate.activateUpdate().then(() => {
        // Recarregar a página para aplicar a atualização
        window.location.reload();
      });
    }
  }

  dismiss() {
    this.showUpdatePrompt.set(false);
  }
}

