import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { EleccionContexto } from '../../core/services/eleccion-contexto';
import { MatMenuModule } from '@angular/material/menu';
import { AuthCoreServiceCore } from '../../core/auth/auth-core.service';
import { MatDivider } from '@angular/material/list';
import { Eleccion } from '../../api/models/eleccion';

@Component({
  selector: 'app-navbar',
  imports: [MatIconModule, MatButtonModule, MatMenuModule, MatDivider],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {

  constructor(
    private eleccionContexto: EleccionContexto,
    private authService: AuthCoreServiceCore,
  ) {}

  get eleccion() {
    return this.eleccionContexto.eleccion;
  }
  get elecciones() {
    return this.eleccionContexto.elecciones;
  }

  seleccionarEleccion(eleccion: Eleccion): void {
    this.eleccionContexto.seleccionar(eleccion);
  }

  get usuario() {
    return this.authService.getUsuario();
  }

  logout(): void {
    this.authService.logout();
    this.eleccionContexto.limpiar();
  }

}
