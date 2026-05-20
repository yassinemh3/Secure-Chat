import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Global HTTP error interceptor.
 * Handles 401, 403, 404, 422, and 5xx responses centrally.
 * 401s that are NOT the refresh endpoint trigger a logout.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar    = inject(MatSnackBar);
  const router      = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Don't intercept the refresh call — the JWT interceptor handles that
      if (req.url.includes('/auth/refresh')) {
        return throwError(() => err);
      }

      switch (err.status) {
        case 401:
          // Token already invalid (JWT interceptor refresh failed) — force logout
          if (authService.isAuthenticated()) {
            authService.logout();
          }
          break;

        case 403:
          snackBar.open('You do not have permission to perform this action.', 'Dismiss', {
            duration: 4000,
            panelClass: 'snack-error'
          });
          break;

        case 404:
          // Usually handled by the component; only show generic toast for non-GET
          if (req.method !== 'GET') {
            snackBar.open('Resource not found.', 'Dismiss', { duration: 3000 });
          }
          break;

        case 422:
        case 400: {
          const detail = err.error?.detail || err.error?.message || 'Validation error.';
          snackBar.open(detail, 'Dismiss', { duration: 4000, panelClass: 'snack-error' });
          break;
        }

        case 0:
          snackBar.open('Cannot reach the server. Check your connection.', 'Dismiss', {
            duration: 5000,
            panelClass: 'snack-error'
          });
          break;

        default:
          if (err.status >= 500) {
            snackBar.open('A server error occurred. Please try again later.', 'Dismiss', {
              duration: 5000,
              panelClass: 'snack-error'
            });
          }
      }

      return throwError(() => err);
    })
  );
};
