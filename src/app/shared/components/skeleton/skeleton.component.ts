import { Component, input } from '@angular/core';

type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';

/**
 * Skeleton Component - Loading placeholder for content
 * Used throughout the app for consistent loading states
 */
@Component({
  selector: 'app-skeleton',
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.css'
})
export class SkeletonComponent {
  variant = input<SkeletonVariant>('text');
  width = input<string>('100%');
  height = input<string>('1rem');

  variantClasses(): string {
    return `skeleton-${this.variant()}`;
  }
}
