import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@core/index';

/**
 * Application Routes
 * 
 * All feature routes are lazy loaded for better performance
 */
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'customers',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'customers',
    canActivate: [authGuard],
    loadChildren: () => import('./features/customers/customers.routes').then(m => m.CUSTOMERS_ROUTES)
  },
  {
    path: 'accounts',
    canActivate: [authGuard],
    loadChildren: () => import('./features/accounts/accounts.routes').then(m => m.ACCOUNTS_ROUTES)
  },
  {
    path: 'transactions',
    canActivate: [authGuard],
    loadChildren: () => import('./features/transactions/transactions.routes').then(m => m.TRANSACTIONS_ROUTES)
  },
  {
    path: 'analytics',
    canActivate: [authGuard],
    loadChildren: () => import('./features/analytics/analytics.routes').then(m => m.ANALYTICS_ROUTES)
  },
  {
    path: '**',
    redirectTo: 'customers'
  }
];
