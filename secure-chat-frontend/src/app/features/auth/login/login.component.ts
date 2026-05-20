import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { WebSocketService } from '../../../core/services/websocket.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-brand">
          <mat-icon class="brand-icon">lock</mat-icon>
          <h1>SecureChat</h1>
          <p class="brand-sub">End-to-end secure messaging</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" id="login-email" autocomplete="email">
            <mat-icon matSuffix>email</mat-icon>
            <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
            <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email address</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput [type]="showPassword ? 'text' : 'password'"
                   formControlName="password" id="login-password" autocomplete="current-password">
            <button mat-icon-button matSuffix type="button" (click)="showPassword = !showPassword">
              <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="form.get('password')?.hasError('required')">Password is required</mat-error>
          </mat-form-field>

          <button mat-raised-button color="primary" type="submit"
                  [disabled]="form.invalid || loading" id="login-submit" class="submit-btn">
            <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
            <span *ngIf="!loading">Sign In</span>
          </button>
        </form>

        <p class="auth-footer">
          Don't have an account? <a routerLink="/auth/register">Create one</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-gradient);
      padding: 1rem;
    }
    .auth-card {
      background: var(--surface);
      border-radius: 16px;
      padding: 2.5rem;
      width: 100%;
      max-width: 420px;
      box-shadow: var(--shadow-xl);
    }
    .auth-brand {
      text-align: center;
      margin-bottom: 2rem;
      .brand-icon { font-size: 3rem; width: 3rem; height: 3rem; color: var(--primary); }
      h1 { margin: 0.5rem 0 0.25rem; font-size: 1.8rem; font-weight: 700; }
      .brand-sub { color: var(--text-secondary); margin: 0; font-size: 0.9rem; }
    }
    .auth-form { display: flex; flex-direction: column; gap: 1rem; }
    mat-form-field { width: 100%; }
    .submit-btn { width: 100%; height: 48px; font-size: 1rem; letter-spacing: 0.5px; }
    .auth-footer { text-align: center; color: var(--text-secondary); margin-top: 1.5rem;
      a { color: var(--primary); text-decoration: none; font-weight: 600; }
    }
    mat-spinner { margin: 0 auto; }
  `]
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private wsService: WebSocketService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const { email, password } = this.form.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.wsService.connect();
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(
          err?.error?.detail || 'Login failed. Check your credentials.',
          'Dismiss', { duration: 4000, panelClass: 'snack-error' }
        );
      }
    });
  }
}
