import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';

/**
 * Auth Interceptor - Adds auth token to requests and handles auth errors
 * 
 * Note: In this app, we're using static JSON data, so this interceptor
 * is primarily for demonstration and future API integration readiness.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(StorageService);
  const authService = inject(AuthService);
  const logger = inject(LoggerService);

  // Get token from storage
  const token = storage.getSession<string>('auth_token');

  // Clone request with auth header if token exists
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized - token expired or invalid
      if (error.status === 401) {
        logger.warn('Unauthorized request, logging out', { url: req.url }, 'AuthInterceptor');
        authService.logout();
      }

      // Handle 403 Forbidden - insufficient permissions
      if (error.status === 403) {
        logger.warn('Forbidden request', { url: req.url }, 'AuthInterceptor');
      }

      return throwError(() => error);
    })
  );
};
