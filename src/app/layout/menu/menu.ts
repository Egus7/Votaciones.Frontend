import { Component, input, OnInit, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AuthCoreServiceCore } from '../../core/auth/auth-core.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Enlace, EnlaceSub, Permisos } from '../../Config';
import { MatIconButton } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PermisosService } from '../../core/services/permisos-service';

@Component({
  selector: 'app-menu',
  imports: [MatIconModule, RouterLink, RouterLinkActive, MatIconButton, MatTooltipModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu implements OnInit {
  constructor(
    private authService: AuthCoreServiceCore,
    private router: Router,
    private permisosService: PermisosService,
  ) {}

  abierto = input(true);
  menuToggle = output<void>();

  async ngOnInit(): Promise<void> {
    // Las opciones del menú se muestran según los permisos del rol del usuario
    try {
      await this.permisosService.cargar();
    } catch {
      // Sin permisos cargados el menú solo muestra Inicio; el guard informa el error al navegar
    }
  }

  tienePermiso(permiso: string): boolean {
    return this.permisosService.tienePermiso(permiso);
  }

  logout() {
    this.permisosService.limpiar();
    this.authService.logout();
  }

  protected readonly Enlace = Enlace;
  protected readonly EnlaceSub = EnlaceSub;
  protected readonly Permisos = Permisos;
}
