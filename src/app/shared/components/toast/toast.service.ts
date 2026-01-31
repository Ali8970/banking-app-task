import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
}

/**
 * Toast Service - Manages toast notifications
 * Single responsibility: notification state management
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private readonly defaultDuration = 5000;

  /**
   * Show a success toast
   */
  success(message: string, options?: Partial<Toast>): string {
    return this.show({ type: 'success', message, ...options });
  }

  /**
   * Show an error toast
   */
  error(message: string, options?: Partial<Toast>): string {
    return this.show({ type: 'error', message, duration: 8000, ...options });
  }

  /**
   * Show a warning toast
   */
  warning(message: string, options?: Partial<Toast>): string {
    return this.show({ type: 'warning', message, ...options });
  }

  /**
   * Show an info toast
   */
  info(message: string, options?: Partial<Toast>): string {
    return this.show({ type: 'info', message, ...options });
  }

  /**
   * Show toast with undo action
   */
  showWithUndo(message: string, onUndo: () => void): string {
    return this.show({
      type: 'success',
      message,
      duration: 8000,
      action: {
        label: 'Undo',
        callback: onUndo
      }
    });
  }

  /**
   * Show a toast notification
   */
  private show(options: Partial<Toast> & { type: ToastType; message: string }): string {
    const id = this.generateId();
    const toast: Toast = {
      id,
      type: options.type,
      message: options.message,
      title: options.title,
      duration: options.duration ?? this.defaultDuration,
      action: options.action
    };

    this._toasts.update(toasts => [...toasts, toast]);

    // Auto dismiss
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => this.dismiss(id), toast.duration);
    }

    return id;
  }

  /**
   * Dismiss a toast by ID
   */
  dismiss(id: string): void {
    this._toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  /**
   * Clear all toasts
   */
  clearAll(): void {
    this._toasts.set([]);
  }

  private generateId(): string {
    return 'toast_' + Math.random().toString(36).substring(2, 11);
  }
}
