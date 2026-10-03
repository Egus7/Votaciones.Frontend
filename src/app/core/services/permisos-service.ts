import { Injectable, signal } from '@angular/core';
import { UsuariosService } from '../../api/services/usuarios.service';

@Injectable({
  providedIn: 'root',
})
export class PermisosService {
  private permisosDisponibles = signal<string[]>([]);

  constructor(private usuariosService: UsuariosService) {}

  async cargar(): Promise<void> {
    try {
      const permisos = await this.usuariosService.apiUsuariosPermisosGet$Json();
      this.permisosDisponibles.set(permisos ?? []);
    } catch (e) {
      this.permisosDisponibles.set([]);
      throw e;
    }
  }

  tienePermiso(permiso: string): boolean {
    return this.permisosDisponibles().includes(permiso);
  }

  limpiar(): void {
    this.permisosDisponibles.set([]);
  }
}
