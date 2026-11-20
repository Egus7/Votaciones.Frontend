import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class MensajeService {
  async exito(titulo: string, texto?: string): Promise<void> {
    await Swal.fire({
      icon: 'success',
      title: titulo,
      text: texto,
      confirmButtonText: 'Aceptar',
    });
  }
  async error(titulo: string, texto?: string): Promise<void> {
    await Swal.fire({
      icon: 'error',
      title: titulo,
      text: texto,
      confirmButtonText: 'Aceptar',
    });
  }

  async advertencia(titulo: string, texto?: string): Promise<void> {
    await Swal.fire({
      icon: 'warning',
      title: titulo,
      text: texto,
      confirmButtonText: 'Aceptar',
    });
  }
  async informacion(titulo: string, texto?: string): Promise<void> {
    await Swal.fire({
      icon: 'info',
      title: titulo,
      text: texto,
      confirmButtonText: 'Aceptar',
    });
  }
  async confirmar(titulo: string, texto?: string): Promise<boolean> {
    const resultado = await Swal.fire({
      icon: 'warning',
      iconColor: '#f6da58',
      title: titulo,
      text: texto,
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      confirmButtonColor: '#1565c0',
      cancelButtonText: 'Cancelar',
      cancelButtonColor: '#f44336',
      reverseButtons: true,
    });
    return resultado.isConfirmed;
  }

  // Confirmación de una acción irreversible que exige la contraseña del usuario.
  // Devuelve la contraseña ingresada o null si se canceló.
  async confirmarConPassword(titulo: string, texto: string): Promise<string | null> {
    const resultado = await Swal.fire({
      icon: 'warning',
      title: titulo,
      html: `<p style="margin:0 0 .5rem">${texto}</p>
             <p style="margin:0;font-weight:600;color:#c62828">Esta acción es irreversible.</p>`,
      input: 'password',
      inputLabel: 'Ingrese su contraseña para confirmar',
      inputPlaceholder: 'Contraseña',
      inputAttributes: { autocomplete: 'current-password' },
      inputValidator: (valor) => (!valor?.trim() ? 'Debe ingresar su contraseña.' : null),
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      confirmButtonColor: '#c62828',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true,
    });
    return resultado.isConfirmed ? (resultado.value as string) : null;
  }

}
