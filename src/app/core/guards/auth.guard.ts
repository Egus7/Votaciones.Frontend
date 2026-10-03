import { AuthCoreServiceCore } from '../auth/auth-core.service';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { EstadoSesion } from '../../Config';

export const AuthGuard: CanActivateFn = () => {

  const authService = inject(AuthCoreServiceCore);
  const router = inject(Router);

  const estado = authService.getEstadoSesion();

  switch (estado) {
    case EstadoSesion.Autenticado:
      return true;

    case EstadoSesion.Expirado:
      authService.clearSession();
      return router.createUrlTree(['/login']);

    case EstadoSesion.Invalido:
      authService.clearSession();
      return router.createUrlTree(['/login']);

    case EstadoSesion.NoAutenticado:
    default:
      return router.createUrlTree(['/login']);
  }
};
