import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { 
  CustomerStateService, 
  AuthService, 
  Transaction, 
  CURRENCY_SYMBOLS 
} from '@core/index';
import { TransactionService } from '../../services/transaction.service';
import { 
  CardComponent, 
  EmptyStateComponent, 
  ButtonComponent, 
  BadgeComponent,
  ToastService 
} from '@shared/index';
import { CurrencyFormatPipe, RelativeDatePipe } from '@shared/pipes';

type TabType = 'all' | 'completed' | 'scheduled';

@Component({
  selector: 'app-transaction-list',
  imports: [
    ScrollingModule,
    CardComponent,
    EmptyStateComponent,
    ButtonComponent,
    BadgeComponent,
    CurrencyFormatPipe,
    RelativeDatePipe
  ],
  templateUrl: './transaction-list.component.html',
  styleUrl: './transaction-list.component.css'
})
export class TransactionListComponent implements OnInit {
  readonly customerState = inject(CustomerStateService);
  readonly authService = inject(AuthService);
  readonly transactionService = inject(TransactionService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly tabs = [
    { id: 'all' as TabType, label: 'All' },
    { id: 'completed' as TabType, label: 'Completed' },
    { id: 'scheduled' as TabType, label: 'Scheduled' }
  ];

  readonly activeTab = signal<TabType>('all');

  readonly filteredTransactions = computed(() => {
    const tab = this.activeTab();
    switch (tab) {
      case 'completed':
        return this.transactionService.completedTransactions();
      case 'scheduled':
        return this.transactionService.scheduledTransactions();
      default:
        return this.transactionService.accountTransactions();
    }
  });

  readonly remainingLimitText = computed(() => {
    const remaining = this.transactionService.remainingDailyLimit();
    const currency = this.customerState.selectedAccount()?.currency || 'EGP';
    return `${remaining.toLocaleString()} ${currency} remaining`;
  });

  ngOnInit(): void {
    // Process any scheduled transactions that are due
    this.transactionService.processScheduledTransactions();
  }

  setActiveTab(tab: TabType): void {
    this.activeTab.set(tab);
  }

  goToCustomers(): void {
    this.router.navigate(['/customers']);
  }

  goToAccounts(): void {
    this.router.navigate(['/accounts']);
  }

  createTransaction(): void {
    this.router.navigate(['/transactions/create']);
  }

  resumeDraft(): void {
    this.router.navigate(['/transactions/create'], { queryParams: { resume: 'true' } });
  }

  undoTransaction(): void {
    if (this.transactionService.undoLastTransaction()) {
      this.toast.success('Transaction undone successfully');
    }
  }

  processScheduled(): void {
    const count = this.transactionService.processScheduledTransactions();
    if (count > 0) {
      this.toast.success(`${count} scheduled transaction(s) processed`);
    } else {
      this.toast.info('No scheduled transactions ready to process');
    }
  }

  trackTransaction(index: number, txn: Transaction): string {
    return txn.id;
  }
}
