import { Component, input } from '@angular/core';

/**
 * Empty State Component - Displayed when no data is available
 * Provides consistent empty state messaging across the app
 */
@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css'
})
export class EmptyStateComponent {
  title = input<string>('No data found');
  description = input<string>('There is no data to display at the moment.');
  icon = input<'document' | 'users' | 'credit-card' | 'chart' | 'inbox'>('inbox');
}
