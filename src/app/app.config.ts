import { ApplicationConfig, ErrorHandler, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { GlobalErrorHandler, authInterceptor } from '@core/index';

/**
 * Application Configuration
 * 
 * Providers:
 * - Zoneless change detection (Angular 21 default for new apps)
 * - Router with component input binding
 * - HTTP client with auth interceptor
 * - Global error handler
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};
