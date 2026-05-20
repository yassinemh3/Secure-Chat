import { Pipe, PipeTransform } from '@angular/core';

/**
 * Converts an ISO timestamp to a human-readable relative time string.
 * Examples: "just now", "3 min ago", "2 h ago", "5 days ago"
 */
@Pipe({
  name: 'timeAgo',
  standalone: true,
  pure: false   // re-evaluates on every CD cycle for live updates
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) return '';

    const now  = Date.now();
    const date = new Date(value).getTime();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 30)          return 'just now';
    if (diff < 60)          return `${diff}s ago`;
    if (diff < 3600)        return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400)       return `${Math.floor(diff / 3600)} h ago`;
    if (diff < 604800)      return `${Math.floor(diff / 86400)} days ago`;

    // Older than 7 days — show the date
    return new Date(value).toLocaleDateString(undefined, {
      month: 'short',
      day:   'numeric',
      year:  Math.floor(diff / 31536000) > 0 ? 'numeric' : undefined
    });
  }
}
