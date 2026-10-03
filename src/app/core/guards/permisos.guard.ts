import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { PermisosService } from '../services/permisos-service';
import { MensajeService } from '../mensajes/mensaje-service';
import { ManejoMensajesError } from '../mensajes/manejo-mensajes-error';

export const PermisosGuard: CanActivateFn = async (route) => {

  const permisosService = inject(PermisosService);
  const swalMensaje = inject(MensajeService);
  const manejoMensaje = inject(ManejoMensajesError);
  const router = inject(Router);

  const permiso = route.data['permiso'] as string;

  if (!permiso) {
    return router.createUrlTree(['/home']);
  }

  try {
    await permisosService.cargar();
    if (permisosService.tienePermiso(permiso)) {
      return true;
    }
    const titulo = 'Acceso denegado';
    await swalMensaje.informacion(titulo, 'No tiene permisos para acceder a este módulo.');
    return router.createUrlTree(['/home']);

  } catch(error :any) {
    const mensajeError = manejoMensaje.getMessage(error);
    await swalMensaje.error('Error', mensajeError);
    return router.createUrlTree(['/home']);
  }

}
