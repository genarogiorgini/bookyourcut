import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Blocks admin routes unless a Supabase session is present. */
export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;

  const slug = route.parent?.paramMap.get('slug') ?? route.paramMap.get('slug') ?? '';
  return router.createUrlTree([slug, 'admin', 'login']);
};
