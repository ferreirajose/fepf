import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" (click)="onClose()"></div>

      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all w-full max-w-md">

          <!-- Icon and Title -->
          <div class="p-6 pb-4">
            <div class="flex items-start">
              <div [ngClass]="getIconClass()" class="mx-auto flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full">
                <i [class]="getIconName() + ' h-7 w-7 text-white'"></i>
              </div>
            </div>
            <div class="mt-4 text-center">
              <h3 class="text-xl font-bold text-on-surface font-manrope" id="modal-title">
                {{ title }}
              </h3>
              <div class="mt-3">
                <p class="text-sm text-[#515981] font-inter">
                  {{ message }}
                </p>
              </div>
            </div>
          </div>

          <!-- Action -->
          <div class="px-6 py-4 bg-[#f7f5ff]">
            <button
              type="button"
              (click)="onClose()"
              [ngClass]="getButtonClass()"
              class="w-full px-4 py-3 text-white rounded-xl font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] font-inter">
              {{ buttonText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AlertDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Atenção';
  @Input() message = '';
  @Input() buttonText = 'OK';
  @Input() type: 'error' | 'success' | 'info' | 'warning' = 'info';

  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
    this.isOpen = false;
  }

  getIconName(): string {
    switch (this.type) {
      case 'error':
        return 'ri-close-circle-line';
      case 'success':
        return 'ri-checkbox-circle-line';
      case 'warning':
        return 'ri-alert-line';
      case 'info':
      default:
        return 'ri-information-line';
    }
  }

  getIconClass(): string {
    switch (this.type) {
      case 'error':
        return 'bg-gradient-to-br from-[#b51621] to-[#ff928b]';
      case 'success':
        return 'bg-gradient-to-br from-[#006947] to-[#69f6b8]';
      case 'warning':
        return 'bg-gradient-to-br from-[#f59e0b] to-[#fbbf24]';
      case 'info':
      default:
        return 'bg-gradient-to-br from-[#0057bd] to-[#6e9fff]';
    }
  }

  getButtonClass(): string {
    switch (this.type) {
      case 'error':
        return 'bg-gradient-to-r from-[#b51621] to-[#ff928b] shadow-[#b51621]/20';
      case 'success':
        return 'bg-gradient-to-r from-[#006947] to-[#69f6b8] shadow-[#006947]/20';
      case 'warning':
        return 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] shadow-[#f59e0b]/20';
      case 'info':
      default:
        return 'bg-gradient-to-r from-[#0057bd] to-[#6e9fff] shadow-[#0057bd]/20';
    }
  }
}
