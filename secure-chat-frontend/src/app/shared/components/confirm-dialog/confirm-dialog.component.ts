import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title:       string;
  message:     string;
  confirmText?: string;
  cancelText?:  string;
  dangerous?:   boolean;   // if true, confirm button is styled as warn/red
}

/**
 * Generic confirmation dialog.
 *
 * Usage:
 *   const ref = this.dialog.open(ConfirmDialogComponent, {
 *     width: '380px',
 *     data: { title: 'Delete room', message: 'Are you sure?', dangerous: true }
 *   });
 *   ref.afterClosed().subscribe(confirmed => { if (confirmed) ... });
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-container">
      <div class="dialog-icon" [class.danger]="data.dangerous">
        <mat-icon>{{ data.dangerous ? 'warning_amber' : 'help_outline' }}</mat-icon>
      </div>
      <h2 mat-dialog-title class="dialog-title">{{ data.title }}</h2>
      <mat-dialog-content>
        <p class="dialog-message">{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button [mat-dialog-close]="false" id="btn-cancel">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button mat-raised-button
                [color]="data.dangerous ? 'warn' : 'primary'"
                [mat-dialog-close]="true"
                id="btn-confirm">
          {{ data.confirmText || 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container { padding: 1rem; text-align: center; }
    .dialog-icon {
      width: 56px; height: 56px; border-radius: 50%;
      background: var(--primary-light); color: var(--primary);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto .75rem;
      mat-icon { font-size: 1.75rem; width: 1.75rem; height: 1.75rem; }
      &.danger { background: rgba(244,67,54,.12); color: #f44336; }
    }
    .dialog-title { font-size: 1.25rem; font-weight: 700; margin: 0 0 .5rem; }
    .dialog-message { color: var(--text-secondary); margin: 0; line-height: 1.6; }
    .dialog-actions { gap: .5rem; padding-top: 1rem; }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
