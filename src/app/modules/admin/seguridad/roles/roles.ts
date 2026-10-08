import { Component, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Paginacion } from '../../../../shared/paginacion/paginacion';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RolDto } from '../../../../api/models/rol-dto';
import { ConfigPage, Enlace, EnlaceSub } from '../../../../Config';
import { RolesService } from '../../../../api/services/roles.service';
import { Router } from '@angular/router';
import { MensajeService } from '../../../../core/mensajes/mensaje-service';
import { ManejoMensajesError } from '../../../../core/mensajes/manejo-mensajes-error';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';

@Component({
  selector: 'app-roles',
  imports: [
    MatButtonModule,
    MatIconModule,
    Paginacion,
    ReactiveFormsModule,
    FormsModule,
    MatFormField,
    MatLabel,
    MatInput,
  ],
  templateUrl: './roles.html',
  styleUrl: './roles.css',
})
export class Roles implements OnInit {
  readonly roles = signal<RolDto[]>([]);
  readonly cargando = signal(false);
  // Filtros
  busqueda = '';
  // Paginación
  paginaActual = ConfigPage.page;
  pageSize = ConfigPage.RowPorPagina;
  totalRegistros = 0;
  totalPages = 0;

  constructor(
    private rolesService: RolesService,
    private router: Router,
    private swalMensaje: MensajeService,
    private manejoMensajeError: ManejoMensajesError,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargarRoles();
  }

  async cargarRoles(): Promise<void> {
    this.cargando.set(true);

    try {
      const response = await this.rolesService.apiRolesPaginacionGet$Json({
        pagina: this.paginaActual,
        pageSize: this.pageSize,
        buscar: this.busqueda,
      });

      this.roles.set(response.items ?? []);
      this.paginaActual = response.pageActual ?? this.paginaActual;
      this.pageSize = response.pageSize ?? this.pageSize;
      this.totalRegistros = response.totalRegistros ?? 0;
      this.totalPages = response.totalPages ?? 0;
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
      this.roles.set([]);
      this.totalRegistros = 0;
      this.totalPages = 0;
    } finally {
      this.cargando.set(false);
    }
  }

  nuevoRol(): void {
    void this.router.navigate([`${Enlace.Admin}/${EnlaceSub.Seguridad}/${EnlaceSub.Roles}/new`]);
  }

  editarRol(idRol: string | undefined): void {
    if (!idRol) {
      return;
    }

    void this.router.navigate([
      `${Enlace.Admin}/${EnlaceSub.Seguridad}/${EnlaceSub.Roles}/edit`,
      idRol,
    ]);
  }

  buscar(): void {
    this.paginaActual = ConfigPage.page;
    void this.cargarRoles();
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.buscar();
  }

  cambiarPagina(pagina: number): void {
    this.paginaActual = pagina;
    void this.cargarRoles();
  }

  async cambiarEstadoRol(rol: RolDto): Promise<void> {
    if (!rol.idRol) {
      return;
    }

    const activar = !rol.activo;
    const confirmado = await this.swalMensaje.confirmar(
      activar ? '¿Activar rol?' : '¿Desactivar rol?',
      activar
        ? 'El rol quedará activo y podrá ser utilizado.'
        : 'El rol quedará inactivo y no podrá ser utilizado.',
    );
    if (!confirmado) {
      return;
    }

    try {
      const response = await this.rolesService.apiRolesCambiarEstadoIdPut({
        id: rol.idRol,
      });
      void this.cargarRoles();
      await this.swalMensaje.exito('Éxito', response!);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    }
  }
}
