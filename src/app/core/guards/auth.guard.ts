import { inject } from '@angular/core';
import { Router, CanActivateFn, CanMatchFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models';

/**
 * Auth Guard - Protects routes that require authentication
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect to login if not authenticated
  router.navigate(['/auth/login']);
  return false;
};

/**
 * Guest Guard - Allows only unauthenticated users (login page)
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Redirect to dashboard if already authenticated
  router.navigate(['/customers']);
  return false;
};

/**
 * Role Guard Factory - Creates a guard that checks for specific roles
 */
export function roleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/auth/login']);
      return false;
    }

    if (authService.hasRole(allowedRoles)) {
      return true;
    }

    // Redirect to unauthorized or back to dashboard
    router.navigate(['/customers']);
    return false;
  };
}

/**
 * Can Match Guard for lazy loaded routes
 */
export const canMatchAuthGuard: CanMatchFn = () => {
  const authService = inject(AuthService);
  return authService.isAuthenticated();
};
