import { Injectable, signal } from '@angular/core';
import { EleccionesService } from '../../api/services/elecciones.service';
import { Eleccion } from '../../api/models/eleccion';
import { MensajeService } from '../mensajes/mensaje-service';
import { ManejoMensajesError } from '../mensajes/manejo-mensajes-error';

@Injectable({
  providedIn: 'root',
})
export class EleccionContexto {
  private readonly storageKey = 'eleccion_id';

  private eleccionesDisponibles = signal<Eleccion[]>([]);
  readonly elecciones = this.eleccionesDisponibles.asReadonly();
  private eleccionSeleccionada = signal<Eleccion | null>(null);
  readonly eleccion = this.eleccionSeleccionada.asReadonly();

  private contextoInicializado = signal(false);
  readonly inicializado = this.contextoInicializado.asReadonly();

  constructor(
    private eleccionesService: EleccionesService,
    private swalMensaje: MensajeService,
    private manejoMensajeError: ManejoMensajesError,
  ) {}

  async cargarElecciones(): Promise<void> {
    try {
      const response = await this.eleccionesService.apiEleccionesGet$Json();
      this.eleccionesDisponibles.set(response);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      void this.swalMensaje.error('Error', mensajeError);
      this.eleccionesDisponibles.set([]);
    }
  }

  seleccionar(eleccion: any): void {
    this.eleccionSeleccionada.set(eleccion);
    localStorage.setItem(this.storageKey, eleccion.idEleccion!.toString());
  }

  limpiar(): void {
    this.eleccionSeleccionada.set(null);
    localStorage.removeItem(this.storageKey);
  }

  async cargar(): Promise<boolean> {
    const id = localStorage.getItem(this.storageKey);

    if (!id) {
      this.eleccionSeleccionada.set(null);
      this.contextoInicializado.set(true);
      return true;
    }

    try {
      const eleccion = await this.eleccionesService.apiEleccionesIdGet$Json({
        id: id,
      });
      this.eleccionSeleccionada.set(eleccion);
      return true;

    } catch (error: any) {
      this.limpiar();
      // La sesión expiró: el interceptor se encarga del mensaje y de redirigir al login.
      if (error?.status === 401) {
        return false;
      }
      const mensajeError = this.manejoMensajeError.getMessage(error);
      void this.swalMensaje.error('Error', mensajeError);
      return false;
    } finally {
      this.contextoInicializado.set(true);
    }
  }

}
