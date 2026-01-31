import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';
import { LoggerService } from '../services/logger.service';

/**
 * Error mapping for user-friendly messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  'NETWORK_ERROR': 'Unable to connect to the server. Please check your internet connection.',
  'TIMEOUT_ERROR': 'The request timed out. Please try again.',
  'VALIDATION_ERROR': 'Please check your input and try again.',
  'AUTH_ERROR': 'Your session has expired. Please log in again.',
  'PERMISSION_ERROR': 'You do not have permission to perform this action.',
  'NOT_FOUND': 'The requested resource was not found.',
  'SERVER_ERROR': 'An unexpected error occurred. Please try again later.',
  'UNKNOWN_ERROR': 'Something went wrong. Please try again.'
};

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  timestamp: Date;
  context?: string;
  stack?: string;
}

/**
 * Global Error Handler - Centralized error handling
 * 
 * Responsibilities:
 * - Catch all unhandled errors
 * - Log errors for debugging
 * - Map technical errors to user-friendly messages
 * - Optionally notify error tracking service
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly logger = inject(LoggerService);
  private readonly zone = inject(NgZone);

  handleError(error: unknown): void {
    // Run outside Angular zone to avoid triggering change detection
    this.zone.runOutsideAngular(() => {
      const appError = this.normalizeError(error);
      
      // Log the error
      this.logger.error(appError.message, {
        code: appError.code,
        stack: appError.stack,
        context: appError.context
      }, 'GlobalErrorHandler');

      // In a real app, you might send to an error tracking service here
      // this.errorTrackingService.captureError(appError);
    });
  }

  /**
   * Normalize various error types to AppError
   */
  private normalizeError(error: unknown): AppError {
    const timestamp = new Date();
    
    // Handle Error instances
    if (error instanceof Error) {
      const code = this.extractErrorCode(error);
      return {
        code,
        message: error.message,
        userMessage: ERROR_MESSAGES[code] || ERROR_MESSAGES['UNKNOWN_ERROR'],
        timestamp,
        stack: error.stack
      };
    }
    
    // Handle string errors
    if (typeof error === 'string') {
      return {
        code: 'UNKNOWN_ERROR',
        message: error,
        userMessage: ERROR_MESSAGES['UNKNOWN_ERROR'],
        timestamp
      };
    }
    
    // Handle unknown error types
    return {
      code: 'UNKNOWN_ERROR',
      message: String(error),
      userMessage: ERROR_MESSAGES['UNKNOWN_ERROR'],
      timestamp
    };
  }

  /**
   * Extract error code from error
   */
  private extractErrorCode(error: Error): string {
    // Check for custom error code property
    if ('code' in error && typeof error.code === 'string') {
      return error.code;
    }
    
    // Check error message patterns
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'NETWORK_ERROR';
    }
    if (message.includes('timeout')) {
      return 'TIMEOUT_ERROR';
    }
    if (message.includes('unauthorized') || message.includes('401')) {
      return 'AUTH_ERROR';
    }
    if (message.includes('forbidden') || message.includes('403')) {
      return 'PERMISSION_ERROR';
    }
    if (message.includes('not found') || message.includes('404')) {
      return 'NOT_FOUND';
    }
    if (message.includes('validation')) {
      return 'VALIDATION_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * Get user-friendly message for an error code
   */
  static getUserMessage(code: string): string {
    return ERROR_MESSAGES[code] || ERROR_MESSAGES['UNKNOWN_ERROR'];
  }
}
