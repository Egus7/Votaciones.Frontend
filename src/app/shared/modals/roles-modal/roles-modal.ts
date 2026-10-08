import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { Paginacion } from '../../paginacion/paginacion';
import { RolDto } from '../../../api/models/rol-dto';
import { ConfigPage } from '../../../Config';
import { RolesService } from '../../../api/services/roles.service';
import { MensajeService } from '../../../core/mensajes/mensaje-service';
import { ManejoMensajesError } from '../../../core/mensajes/manejo-mensajes-error';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField, MatInputModule, MatLabel } from '@angular/material/input';
import { MatRadioButton } from '@angular/material/radio';

@Component({
  selector: 'app-roles-modal',
  imports: [
    FormsModule,
    MatIcon,
    Paginacion,
    MatButtonModule,
    MatFormField,
    MatLabel,
    MatInputModule,
    MatRadioButton,
  ],
  templateUrl: './roles-modal.html',
  styleUrl: './roles-modal.css',
})
export class RolesModal implements OnInit {
  // Rol que ya tiene seleccionado el usuario, si estamos editando
  @Input() rolSeleccionado: RolDto | null = null;

  roles: RolDto[] = [];

  busqueda = '';

  paginaActual = ConfigPage.page;
  pageSize = ConfigPage.RowPorPagina;
  totalRegistros = 0;
  totalPages = 0;

  readonly cargando = signal(false);

  constructor(
    private rolService: RolesService,
    private swalMensaje: MensajeService,
    private manejoMensajeError: ManejoMensajesError,
  ) {}

  async ngOnInit() {
    await this.cargarRoles();
  }

  async cargarRoles(): Promise<void> {
    this.cargando.set(true);

    try {
      const response = await this.rolService.apiRolesPaginacionGet$Json({
        pagina: this.paginaActual,
        pageSize: this.pageSize,
        buscar: this.busqueda,
      });

      this.roles = response.items ?? [];
      this.paginaActual = response.pageActual ?? this.paginaActual;
      this.pageSize = response.pageSize ?? this.pageSize;
      this.totalRegistros = response.totalRegistros ?? 0;
      this.totalPages = response.totalPages ?? 0;
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      void this.swalMensaje.error('Error', mensajeError);
      this.roles = [];
      this.totalRegistros = 0;
      this.totalPages = 0;
    } finally {
      this.cargando.set(false);
    }
  }

  buscar(): void {
    this.paginaActual = ConfigPage.page;
    void this.cargarRoles();
  }
  limpiarBusqueda(): void {
    this.busqueda = '';
    this.paginaActual = ConfigPage.page;

    void this.cargarRoles();
  }
  cambiarPagina(pagina: number): void {
    this.paginaActual = pagina;

    void this.cargarRoles();
  }

  seleccionar(rol: RolDto): void {
    if (!rol.idRol) {
      return;
    }

    this.rolSeleccionado = rol;
  }

  estaSeleccionado(idRol: string | undefined): boolean {
    if (!idRol) {
      return false;
    }

    return this.rolSeleccionado?.idRol === idRol;
  }

  obtenerSeleccionado(): RolDto | null {
    return this.rolSeleccionado;
  }
}
