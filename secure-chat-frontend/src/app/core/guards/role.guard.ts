import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Role-based route guard.
 * Usage in routes:
 *   canActivate: [roleGuard('ADMIN')]
 */
export const roleGuard = (requiredRole: 'USER' | 'ADMIN'): CanActivateFn => {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    const user = auth.currentUser();

    if (!user) {
      return router.createUrlTree(['/auth/login']);
    }

    if (user.role === requiredRole || user.role === 'ADMIN') {
      return true;
    }

    // Authenticated but wrong role — send back to chat
    return router.createUrlTree(['/chat']);
  };
};
