import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { EleccionContexto } from '../../../../core/services/eleccion-contexto';
import { RouterLink } from '@angular/router';
import { Enlace, EnlaceSub, Permisos } from '../../../../Config';
import { MatButtonModule } from '@angular/material/button';
import { PermisosService } from '../../../../core/services/permisos-service';

@Component({
  selector: 'app-inicio',
  imports: [MatIconModule, RouterLink, MatButtonModule],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio implements OnInit {
  constructor(
    private eleccionContexto: EleccionContexto,
    private permisosService: PermisosService,
  ) {}

  get eleccion() {
    return this.eleccionContexto.eleccion;
  }

  async ngOnInit(): Promise<void> {
    try {
      await this.permisosService.cargar();
    } catch {
      // Sin permisos no se muestra ninguna opción
    }
  }

  tienePermiso(permiso: string): boolean {
    return this.permisosService.tienePermiso(permiso);
  }

  protected readonly EnlaceSub = EnlaceSub;
  protected readonly Enlace = Enlace;
  protected readonly Permisos = Permisos;
}
