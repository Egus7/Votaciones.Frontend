import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthCoreServiceCore } from '../auth/auth-core.service';
import { EstadoSesion } from '../../Config';

export const RedirectGuard: CanActivateFn = () => {

  const authService = inject(AuthCoreServiceCore);
  const router = inject(Router);

  const estado = authService.getEstadoSesion();

  if (estado === EstadoSesion.Autenticado) {
    return router.createUrlTree(['/home']);
  }
  return true;
};
