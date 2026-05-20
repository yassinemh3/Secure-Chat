import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { WebSocketService } from '../../../core/services/websocket.service';

function passwordMatchValidator(control: AbstractControl) {
  const password = control.get('password');
  const confirm  = control.get('confirmPassword');
  if (password && confirm && password.value !== confirm.value) {
    confirm.setErrors({ mismatch: true });
  }
  return null;
}

@Component({
  selector: 'app-register',
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
          <h1>Create Account</h1>
          <p class="brand-sub">Join SecureChat today</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <mat-form-field appearance="outline">
            <mat-label>Username</mat-label>
            <input matInput formControlName="username" id="reg-username" autocomplete="username">
            <mat-icon matSuffix>person</mat-icon>
            <mat-error *ngIf="form.get('username')?.hasError('required')">Username is required</mat-error>
            <mat-error *ngIf="form.get('username')?.hasError('pattern')">Only letters, digits, underscores</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" id="reg-email" autocomplete="email">
            <mat-icon matSuffix>email</mat-icon>
            <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
            <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Display Name</mat-label>
            <input matInput formControlName="displayName" id="reg-displayname">
            <mat-icon matSuffix>badge</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput [type]="showPassword ? 'text' : 'password'"
                   formControlName="password" id="reg-password" autocomplete="new-password">
            <button mat-icon-button matSuffix type="button" (click)="showPassword = !showPassword">
              <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="form.get('password')?.hasError('minlength')">At least 8 characters</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Confirm Password</mat-label>
            <input matInput type="password" formControlName="confirmPassword" id="reg-confirm-password">
            <mat-error *ngIf="form.get('confirmPassword')?.hasError('mismatch')">Passwords don't match</mat-error>
          </mat-form-field>

          <button mat-raised-button color="primary" type="submit"
                  [disabled]="form.invalid || loading" id="reg-submit" class="submit-btn">
            <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
            <span *ngIf="!loading">Create Account</span>
          </button>
        </form>

        <p class="auth-footer">
          Already have an account? <a routerLink="/auth/login">Sign in</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: var(--bg-gradient); padding: 1rem; }
    .auth-card { background: var(--surface); border-radius: 16px; padding: 2.5rem; width: 100%;
      max-width: 440px; box-shadow: var(--shadow-xl); }
    .auth-brand { text-align: center; margin-bottom: 1.5rem;
      .brand-icon { font-size: 3rem; width: 3rem; height: 3rem; color: var(--primary); }
      h1 { margin: 0.5rem 0 0.25rem; font-size: 1.8rem; font-weight: 700; }
      .brand-sub { color: var(--text-secondary); margin: 0; font-size: 0.9rem; }
    }
    .auth-form { display: flex; flex-direction: column; gap: 0.75rem; }
    mat-form-field { width: 100%; }
    .submit-btn { width: 100%; height: 48px; font-size: 1rem; }
    .auth-footer { text-align: center; color: var(--text-secondary); margin-top: 1.5rem;
      a { color: var(--primary); text-decoration: none; font-weight: 600; }
    }
  `]
})
export class RegisterComponent {
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
      username:        ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
      email:           ['', [Validators.required, Validators.email]],
      displayName:     [''],
      password:        ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const { username, email, password, displayName } = this.form.value;

    this.authService.register(username, email, password, displayName).subscribe({
      next: () => {
        this.wsService.connect();
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(
          err?.error?.detail || 'Registration failed.',
          'Dismiss', { duration: 4000, panelClass: 'snack-error' }
        );
      }
    });
  }
}
