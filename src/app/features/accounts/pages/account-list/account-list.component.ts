import { Component, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerStateService, DataLoaderService, Account, AccountStatus, CURRENCY_SYMBOLS, Currency } from '@core/index';
import { CardComponent, EmptyStateComponent, SkeletonComponent, BadgeComponent, ButtonComponent } from '@shared/index';
import { CurrencyFormatPipe } from '@shared/pipes';

@Component({
  selector: 'app-account-list',
  imports: [CardComponent, EmptyStateComponent, SkeletonComponent, BadgeComponent, ButtonComponent, CurrencyFormatPipe],
  templateUrl: './account-list.component.html',
  styleUrl: './account-list.component.css'
})
export class AccountListComponent {
  readonly customerState = inject(CustomerStateService);
  readonly dataLoader = inject(DataLoaderService);
  private readonly router = inject(Router);

  readonly activeAccountsCount = computed(() => 
    this.customerState.customerAccounts().filter(a => a.status === 'active').length
  );

  readonly uniqueCurrencies = computed(() => {
    const currencies = new Set(this.customerState.customerAccounts().map(a => a.currency));
    return Array.from(currencies);
  });

  goToCustomers(): void {
    this.router.navigate(['/customers']);
  }

  selectAccount(account: Account): void {
    if (account.status !== 'inactive') {
      this.customerState.selectAccount(account.id);
      this.router.navigate(['/transactions']);
    }
  }

  getStatusVariant(status: AccountStatus): 'success' | 'warning' | 'danger' {
    switch (status) {
      case 'active': return 'success';
      case 'frozen': return 'warning';
      case 'inactive': return 'danger';
    }
  }

  getCurrencySymbol(currency: Currency): string {
    return CURRENCY_SYMBOLS[currency] || currency;
  }

  getCurrencyBgClass(currency: Currency): string {
    const classes: Record<Currency, string> = {
      EGP: 'bg-emerald-500',
      USD: 'bg-blue-500',
      EUR: 'bg-indigo-500',
      GBP: 'bg-purple-500',
      SAR: 'bg-amber-500'
    };
    return classes[currency] || 'bg-slate-500';
  }

  getAccountBalance(account: Account): number {
    // Calculate balance from transactions
    const transactions = this.dataLoader.transactions()
      .filter(t => t.accountId === account.id && t.status === 'completed');
    
    let balance = account.openingBalance;
    for (const txn of transactions) {
      if (txn.type === 'credit') {
        balance += txn.amount;
      } else {
        balance -= txn.amount;
      }
    }
    return balance;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
