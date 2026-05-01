import { Component, signal, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Component({
  selector: 'app-pwa-install-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pwa-install-banner.component.html',
  styleUrls: ['./pwa-install-banner.component.css']
})
export class PwaInstallBannerComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);

  showInstallPrompt = signal(false);
  isIOS = signal(false);
  isStandalone = signal(false);
  deferredPrompt = signal<BeforeInstallPromptEvent | null>(null);

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Detectar se é iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    this.isIOS.set(/iphone|ipad|ipod/.test(userAgent));

    // Detectar se já está instalado (standalone mode)
    const isInStandaloneMode = () =>
      (window.matchMedia('(display-mode: standalone)').matches) ||
      ('standalone' in window.navigator && (window.navigator as any).standalone);

    this.isStandalone.set(isInStandaloneMode());

    // Se não está instalado, mostrar prompt
    if (!this.isStandalone()) {
      // Para iOS, mostrar instruções
      if (this.isIOS()) {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (!dismissed) {
          this.showInstallPrompt.set(true);
        }
      } else {
        // Para Android/Chrome
        window.addEventListener('beforeinstallprompt', (e: Event) => {
          e.preventDefault();
          this.deferredPrompt.set(e as BeforeInstallPromptEvent);
          const dismissed = localStorage.getItem('pwa-install-dismissed');
          if (!dismissed) {
            this.showInstallPrompt.set(true);
          }
        });
      }
    }
  }

  async installPWA() {
    const prompt = this.deferredPrompt();
    if (!prompt) {
      return;
    }

    await prompt.prompt();
    const { outcome } = await prompt.userChoice;

    if (outcome === 'accepted') {
      this.deferredPrompt.set(null);
      this.showInstallPrompt.set(false);
      localStorage.setItem('pwa-install-dismissed', 'true');
    }
  }

  dismiss() {
    this.showInstallPrompt.set(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  }
}
