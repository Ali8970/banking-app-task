import { Routes } from '@angular/router';

export const ACCOUNTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/account-list/account-list.component').then(m => m.AccountListComponent)
  }
];
