import { Routes } from '@angular/router';
import { roleGuard } from '@core/index';

export const TRANSACTIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/transaction-list/transaction-list.component').then(m => m.TransactionListComponent)
  },
  {
    path: 'create',
    canActivate: [roleGuard(['admin', 'teller'])],
    loadComponent: () => import('./pages/create-transaction/create-transaction.component').then(m => m.CreateTransactionComponent)
  }
];
