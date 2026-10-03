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

}
