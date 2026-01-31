import { Component, inject } from '@angular/core';
import { ToastService, Toast } from './toast.service';

@Component({
  selector: 'app-toast-container',
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.css'
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  getToastClasses(toast: Toast): string {
    const typeClasses: Record<string, string> = {
      success: 'toast-success',
      error: 'toast-error',
      warning: 'toast-warning',
      info: 'toast-info'
    };
    return `toast-item ${typeClasses[toast.type] || ''}`;
  }

  handleAction(toast: Toast): void {
    if (toast.action?.callback) {
      toast.action.callback();
      this.dismiss(toast.id);
    }
  }

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
