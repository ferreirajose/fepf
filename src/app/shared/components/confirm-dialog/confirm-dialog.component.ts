import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" (click)="handleCancel()"></div>

      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all w-full max-w-md">

          <!-- Icon and Title -->
          <div class="p-6 pb-4">
            <div class="flex items-start">
              <div [ngClass]="getIconClass()" class="mx-auto flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full">
                <i [class]="getIconName() + 'text-white'"></i>
              </div>
            </div>
            <div class="mt-4 text-center">
              <h3 class="text-xl font-bold text-on-surface font-manrope" id="modal-title">
                {{ title }}
              </h3>
              <div class="mt-3">
                <p class="text-sm text-[#57534E] font-body">
                  {{ message }}
                </p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="px-6 py-4 bg-[#FAFFFE] flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              (click)="handleCancel()"
              class="flex-1 px-4 py-3 bg-white border-2 border-[#A8A29E]/30 text-[#57534E] rounded-xl font-bold text-sm hover:bg-[#F5F5F4] transition-colors font-body">
              {{ cancelText }}
            </button>
            <button
              type="button"
              (click)="handleConfirm()"
              [ngClass]="getConfirmButtonClass()"
              class="flex-1 px-4 py-3 text-white rounded-xl font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] font-body">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirmar ação';
  @Input() message = 'Tem certeza que deseja realizar esta ação?';
  @Input() confirmText = 'Confirmar';
  @Input() cancelText = 'Cancelar';
  @Input() type: 'danger' | 'warning' | 'info' | 'success' = 'warning';

  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  handleConfirm() {
    this.onConfirm.emit();
    this.isOpen = false;
  }

  handleCancel() {
    this.onCancel.emit();
    this.isOpen = false;
  }

  getIconName(): string {
    switch (this.type) {
      case 'danger':
        return 'ri-delete-bin-line';
      case 'warning':
        return 'ri-alert-line';
      case 'success':
        return 'ri-checkbox-circle-line';
      case 'info':
      default:
        return 'ri-information-line';
    }
  }

  getIconClass(): string {
    switch (this.type) {
      case 'danger':
        return 'bg-gradient-to-br from-[#DC2626] to-[#F87171]';
      case 'warning':
        return 'bg-gradient-to-br from-[#f59e0b] to-[#fbbf24]';
      case 'success':
        return 'bg-gradient-to-br from-[#059669] to-[#6EE7B7]';
      case 'info':
      default:
        return 'bg-gradient-to-br from-[#10B981] to-[#34D399]';
    }
  }

  getConfirmButtonClass(): string {
    switch (this.type) {
      case 'danger':
        return 'bg-gradient-to-r from-[#DC2626] to-[#F87171] shadow-[#DC2626]/20';
      case 'warning':
        return 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] shadow-[#f59e0b]/20';
      case 'success':
        return 'bg-gradient-to-r from-[#059669] to-[#6EE7B7] shadow-[#059669]/20';
      case 'info':
      default:
        return 'bg-gradient-to-r from-[#10B981] to-[#34D399] shadow-[#10B981]/20';
    }
  }
}
