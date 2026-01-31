import { Component, input } from '@angular/core';

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
