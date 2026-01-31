import { Pipe, PipeTransform } from '@angular/core';

/**
 * Relative Date Pipe - Formats dates as relative time (e.g., "2 hours ago")
 */
@Pipe({
  name: 'relativeDate'
})
export class RelativeDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) {
      return '-';
    }

    const date = typeof value === 'string' ? new Date(value) : value;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    // Future dates
    if (diffMs < 0) {
      const futureDays = Math.abs(diffDays);
      if (futureDays === 0) return 'Today';
      if (futureDays === 1) return 'Tomorrow';
      if (futureDays < 7) return `In ${futureDays} days`;
      if (futureDays < 30) return `In ${Math.ceil(futureDays / 7)} weeks`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Past dates
    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
