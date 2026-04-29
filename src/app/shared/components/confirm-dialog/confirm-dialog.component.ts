import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, FeatherModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" (click)="onCancel()"></div>

      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all w-full max-w-md">

          <!-- Icon and Title -->
          <div class="p-6 pb-4">
            <div class="flex items-start">
              <div [ngClass]="getIconClass()" class="mx-auto flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full">
                <i-feather [name]="getIconName()" class="h-7 w-7 text-white"></i-feather>
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

          <!-- Actions -->
          <div class="px-6 py-4 bg-[#f7f5ff] flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              (click)="onCancel()"
              class="flex-1 px-4 py-3 bg-white border-2 border-[#a3abd7]/30 text-[#515981] rounded-xl font-bold text-sm hover:bg-[#efefff] transition-colors font-inter">
              {{ cancelText }}
            </button>
            <button
              type="button"
              (click)="onConfirm()"
              [ngClass]="getConfirmButtonClass()"
              class="flex-1 px-4 py-3 text-white rounded-xl font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] font-inter">
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

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
    this.isOpen = false;
  }

  onCancel() {
    this.cancel.emit();
    this.isOpen = false;
  }

  getIconName(): string {
    switch (this.type) {
      case 'danger':
        return 'trash-2';
      case 'warning':
        return 'alert-triangle';
      case 'success':
        return 'check-circle';
      case 'info':
      default:
        return 'info';
    }
  }

  getIconClass(): string {
    switch (this.type) {
      case 'danger':
        return 'bg-gradient-to-br from-[#b51621] to-[#ff928b]';
      case 'warning':
        return 'bg-gradient-to-br from-[#f59e0b] to-[#fbbf24]';
      case 'success':
        return 'bg-gradient-to-br from-[#006947] to-[#69f6b8]';
      case 'info':
      default:
        return 'bg-gradient-to-br from-[#0057bd] to-[#6e9fff]';
    }
  }

  getConfirmButtonClass(): string {
    switch (this.type) {
      case 'danger':
        return 'bg-gradient-to-r from-[#b51621] to-[#ff928b] shadow-[#b51621]/20';
      case 'warning':
        return 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] shadow-[#f59e0b]/20';
      case 'success':
        return 'bg-gradient-to-r from-[#006947] to-[#69f6b8] shadow-[#006947]/20';
      case 'info':
      default:
        return 'bg-gradient-to-r from-[#0057bd] to-[#6e9fff] shadow-[#0057bd]/20';
    }
  }
}
