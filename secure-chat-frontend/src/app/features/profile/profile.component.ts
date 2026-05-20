import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { User } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="profile-container">
      <mat-card class="profile-card">
        <mat-card-header>
          <div class="profile-avatar" mat-card-avatar>
            <span>{{ user?.displayName?.slice(0,2)?.toUpperCase() || '??' }}</span>
          </div>
          <mat-card-title>{{ user?.displayName }}</mat-card-title>
          <mat-card-subtitle>&#64;{{ user?.username }} · {{ user?.role }}</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="save()" class="profile-form">
            <mat-form-field appearance="outline">
              <mat-label>Display Name</mat-label>
              <input matInput formControlName="displayName" id="profile-display-name">
              <mat-icon matSuffix>badge</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Avatar URL</mat-label>
              <input matInput formControlName="avatarUrl" id="profile-avatar-url" type="url">
              <mat-icon matSuffix>image</mat-icon>
            </mat-form-field>

            <div class="read-only-field">
              <mat-icon>email</mat-icon>
              <span>{{ user?.email }}</span>
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions align="end">
          <button mat-button [routerLink]="['/chat']" id="btn-back-to-chat">
            <mat-icon>arrow_back</mat-icon> Back
          </button>
          <button mat-raised-button color="primary" (click)="save()"
                  [disabled]="saving || form.pristine" id="btn-save-profile">
            <mat-spinner *ngIf="saving" diameter="18"></mat-spinner>
            <span *ngIf="!saving">Save Changes</span>
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .profile-container { display: flex; justify-content: center; padding: 2rem; min-height: 100vh;
      background: var(--bg); align-items: flex-start; padding-top: 5rem; }
    .profile-card { width: 100%; max-width: 480px; }
    .profile-avatar { width: 56px; height: 56px; border-radius: 50%; background: var(--primary);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 1.2rem; font-weight: 700; }
    .profile-form { display: flex; flex-direction: column; gap: 1rem; margin-top: 1.5rem; }
    mat-form-field { width: 100%; }
    .read-only-field { display: flex; align-items: center; gap: .5rem; color: var(--text-secondary);
      font-size: .9rem; padding: .5rem 0; }
  `]
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  form: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({ displayName: [''], avatarUrl: [''] });
  }

  ngOnInit(): void {
    this.user = this.authService.currentUser();
    if (this.user) {
      this.form.patchValue({ displayName: this.user.displayName, avatarUrl: this.user.avatarUrl || '' });
    }
  }

  save(): void {
    this.saving = true;
    const { displayName, avatarUrl } = this.form.value;
    this.userService.updateProfile(displayName, avatarUrl).subscribe({
      next: (u) => {
        this.user = u;
        this.saving = false;
        this.form.markAsPristine();
        this.snackBar.open('Profile updated!', 'Close', { duration: 3000 });
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Failed to update profile', 'Dismiss', { duration: 4000, panelClass: 'snack-error' });
      }
    });
  }
}
