import { Component, input } from '@angular/core';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md';

/**
 * Badge Component - Status indicator
 */
@Component({
  selector: 'app-badge',
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.css'
})
export class BadgeComponent {
  variant = input<BadgeVariant>('default');
  size = input<BadgeSize>('sm');
  dot = input<boolean>(false);

  badgeClasses(): string {
    const variants: Record<BadgeVariant, string> = {
      default: 'badge-default',
      success: 'badge-success',
      warning: 'badge-warning',
      danger: 'badge-danger',
      info: 'badge-info'
    };

    const sizes: Record<BadgeSize, string> = {
      sm: 'badge-sm',
      md: 'badge-md'
    };

    return `badge-root ${variants[this.variant()]} ${sizes[this.size()]}`;
  }

  dotClasses(): string {
    const variants: Record<BadgeVariant, string> = {
      default: 'badge-dot-default',
      success: 'badge-dot-success',
      warning: 'badge-dot-warning',
      danger: 'badge-dot-danger',
      info: 'badge-dot-info'
    };
    return variants[this.variant()];
  }
}
