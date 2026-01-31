import { Injectable } from '@angular/core';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: unknown;
}

/**
 * Logger Service - Abstraction for logging
 * Currently uses console, but can be extended to use external logging services
 * Single Responsibility: Only handles logging concerns
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private readonly context = 'BankingApp';

  debug(message: string, data?: unknown, context?: string): void {
    this.log('debug', message, data, context);
  }

  info(message: string, data?: unknown, context?: string): void {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: unknown, context?: string): void {
    this.log('warn', message, data, context);
  }

  error(message: string, data?: unknown, context?: string): void {
    this.log('error', message, data, context);
  }

  private log(level: LogLevel, message: string, data?: unknown, context?: string): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: context || this.context,
      data
    };

    const formattedMessage = this.formatMessage(entry);

    switch (level) {
      case 'debug':
        console.debug(formattedMessage, data ?? '');
        break;
      case 'info':
        console.info(formattedMessage, data ?? '');
        break;
      case 'warn':
        console.warn(formattedMessage, data ?? '');
        break;
      case 'error':
        console.error(formattedMessage, data ?? '');
        break;
    }
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    return `[${timestamp}] [${level}] [${entry.context}] ${entry.message}`;
  }
}
