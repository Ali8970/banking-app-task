import { Component, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerStateService, DataLoaderService } from '@core/index';
import { AnalyticsService } from '../../services/analytics.service';
import { 
  CardComponent, 
  EmptyStateComponent, 
  ButtonComponent, 
  BadgeComponent,
  SkeletonComponent 
} from '@shared/index';
import { CurrencyFormatPipe } from '@shared/pipes';

/**
 * Analytics Dashboard Component - Financial insights display
 * 
 * Features:
 * - Spending trend visualization
 * - Average transaction metrics
 * - Abnormal spending alerts
 * - Category breakdown
 */
@Component({
  selector: 'app-analytics-dashboard',
  imports: [
    CardComponent,
    EmptyStateComponent,
    ButtonComponent,
    BadgeComponent,
    SkeletonComponent,
    CurrencyFormatPipe
  ],
  templateUrl: './analytics-dashboard.component.html',
  styleUrl: './analytics-dashboard.component.css'
})
export class AnalyticsDashboardComponent {
  readonly customerState = inject(CustomerStateService);
  readonly dataLoader = inject(DataLoaderService);
  readonly analytics = inject(AnalyticsService);
  private readonly router = inject(Router);

  protected Math = Math;

  private readonly maxSpending = computed(() => {
    const trend = this.analytics.spendingTrend();
    return Math.max(...trend.map(m => m.total), 1);
  });

  goToCustomers(): void {
    this.router.navigate(['/customers']);
  }

  getBarWidth(total: number): number {
    return (total / this.maxSpending()) * 100;
  }

  getCategoryPercentage(amount: number): number {
    const total = this.analytics.totalSpending();
    return total > 0 ? (amount / total) * 100 : 0;
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      payment: 'bg-blue-500',
      withdrawal: 'bg-red-500',
      transfer: 'bg-purple-500',
      fees: 'bg-amber-500',
      other: 'bg-slate-500'
    };
    return colors[category] || 'bg-slate-500';
  }

  getCategoryBarColor(category: string): string {
    const colors: Record<string, string> = {
      payment: 'bg-blue-500',
      withdrawal: 'bg-red-500',
      transfer: 'bg-purple-500',
      fees: 'bg-amber-500',
      other: 'bg-slate-500'
    };
    return colors[category] || 'bg-slate-500';
  }

  averageDailySpending(): number {
    const total = this.analytics.totalSpending();
    const trend = this.analytics.spendingTrend();
    const totalCount = trend.reduce((sum, m) => sum + m.count, 0);
    return totalCount > 0 ? Math.round(total / Math.max(totalCount, 1)) : 0;
  }

  largestTransaction(): number {
    const byCategory = this.analytics.spendingByCategory();
    if (byCategory.length === 0) return 0;
    return Math.max(...byCategory.map(c => c.amount));
  }

  topCategory(): string {
    const byCategory = this.analytics.spendingByCategory();
    return byCategory.length > 0 ? byCategory[0].category : '';
  }
}
