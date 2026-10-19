import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Telas que só administradores veem (usuários, log de atividades). Editores voltam pro dashboard. */
export const adminApenasGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.ehAdmin ? true : inject(Router).createUrlTree(['/admin/dashboard']);
};
