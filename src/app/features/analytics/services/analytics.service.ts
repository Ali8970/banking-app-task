import { Injectable, inject, computed } from '@angular/core';
import { DataLoaderService, CustomerStateService, MonthlySpending, AnalyticsData } from '@core/index';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly dataLoader = inject(DataLoaderService);
  private readonly customerState = inject(CustomerStateService);

  private readonly ABNORMAL_THRESHOLD = 1.5;

  private readonly customerTransactions = computed(() => {
    const customerId = this.customerState.selectedCustomerId();
    if (!customerId) return [];

    const accountIds = this.dataLoader.accounts()
      .filter(a => a.customerId === customerId)
      .map(a => a.id);

    return this.dataLoader.transactions()
      .filter(t => accountIds.includes(t.accountId) && t.status === 'completed');
  });

  private readonly debitTransactions = computed(() => 
    this.customerTransactions().filter(t => t.type === 'debit')
  );

  /**
   * Spending trend for last 3 months
   */
  readonly spendingTrend = computed((): MonthlySpending[] => {
    const transactions = this.debitTransactions();
    const now = new Date();
    const months: MonthlySpending[] = [];

    for (let i = 2; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.toLocaleString('en-US', { month: 'short' });
      const monthNum = date.getMonth();

      const monthTransactions = transactions.filter(t => {
        const txnDate = new Date(t.date);
        return txnDate.getFullYear() === year && txnDate.getMonth() === monthNum;
      });

      const total = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
      const count = monthTransactions.length;

      months.push({ month, year, total, count });
    }

    return months;
  });

  readonly averageTransactionSize = computed(() => {
    const transactions = this.customerTransactions();
    if (transactions.length === 0) return 0;

    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    return Math.round(total / transactions.length);
  });

  /**
   * Average debit (spending) amount
   */
  readonly averageSpending = computed(() => {
    const debits = this.debitTransactions();
    if (debits.length === 0) return 0;

    const total = debits.reduce((sum, t) => sum + t.amount, 0);
    return Math.round(total / debits.length);
  });

  readonly totalSpending = computed(() => 
    this.debitTransactions().reduce((sum, t) => sum + t.amount, 0)
  );

  /**
   * Total credits amount
   */
  readonly totalCredits = computed(() => 
    this.customerTransactions()
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  readonly abnormalSpending = computed(() => {
    const debits = this.debitTransactions();
    const average = this.averageSpending();
    
    if (average === 0 || debits.length < 3) {
      return { detected: false, transactions: [], message: '' };
    }

    const threshold = average * this.ABNORMAL_THRESHOLD;
    const abnormalTxns = debits.filter(t => t.amount > threshold);

    if (abnormalTxns.length === 0) {
      return { 
        detected: false, 
        transactions: [], 
        message: 'No abnormal spending detected' 
      };
    }

    return {
      detected: true,
      transactions: abnormalTxns,
      message: `${abnormalTxns.length} transaction(s) exceed ${Math.round(this.ABNORMAL_THRESHOLD * 100)}% of average spending`
    };
  });

  readonly spendingByCategory = computed(() => {
    const debits = this.debitTransactions();
    const byCategory: Record<string, number> = {};

    for (const txn of debits) {
      byCategory[txn.category] = (byCategory[txn.category] || 0) + txn.amount;
    }

    return Object.entries(byCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  });

  /**
   * Month-over-month change
   */
  readonly monthOverMonthChange = computed(() => {
    const trend = this.spendingTrend();
    if (trend.length < 2) return { change: 0, percentage: 0, direction: 'stable' as const };

    const current = trend[trend.length - 1].total;
    const previous = trend[trend.length - 2].total;

    if (previous === 0) {
      return { change: current, percentage: 0, direction: 'stable' as const };
    }

    const change = current - previous;
    const percentage = Math.round((change / previous) * 100);
    const direction = change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'stable' as const;

    return { change, percentage, direction };
  });

  readonly analyticsData = computed((): AnalyticsData => ({
    spendingTrend: this.spendingTrend(),
    averageTransactionSize: this.averageTransactionSize(),
    totalTransactions: this.customerTransactions().length,
    abnormalSpendingDetected: this.abnormalSpending().detected,
    abnormalSpendingDetails: this.abnormalSpending().message
  }));
}
