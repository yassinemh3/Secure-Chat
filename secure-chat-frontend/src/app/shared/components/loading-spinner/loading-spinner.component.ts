import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Reusable full-page or inline loading spinner.
 *
 * Usage (full-screen overlay):
 *   <app-loading-spinner *ngIf="loading"></app-loading-spinner>
 *
 * Usage (inline, small):
 *   <app-loading-spinner [overlay]="false" [diameter]="24" message=""></app-loading-spinner>
 */
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div [class]="overlay ? 'spinner-overlay' : 'spinner-inline'">
      <mat-spinner [diameter]="diameter" [color]="color"></mat-spinner>
      <p *ngIf="message" class="spinner-message">{{ message }}</p>
    </div>
  `,
  styles: [`
    .spinner-overlay {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, .45);
      backdrop-filter: blur(4px);
      z-index: 9999;
    }
    .spinner-inline {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      gap: .75rem;
    }
    .spinner-message {
      margin: .75rem 0 0;
      color: var(--text-secondary);
      font-size: .9rem;
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() overlay  = true;
  @Input() diameter = 48;
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() message  = 'Loading…';
}
