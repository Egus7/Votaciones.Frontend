import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Paginacion } from '../../../../shared/paginacion/paginacion';
import { UsuarioDto } from '../../../../api/models/usuario-dto';
import { ConfigPage, Enlace, EnlaceSub } from '../../../../Config';
import { UsuariosService } from '../../../../api/services/usuarios.service';
import { Router } from '@angular/router';
import { MensajeService } from '../../../../core/mensajes/mensaje-service';
import { ManejoMensajesError } from '../../../../core/mensajes/manejo-mensajes-error';

@Component({
  selector: 'app-usuarios',
  imports: [FormsModule, MatButtonModule, MatIconModule, Paginacion],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  readonly usuarios = signal<UsuarioDto[]>([]);
  readonly cargando = signal(false);
  // Filtros
  busqueda = '';
  // Paginación
  paginaActual = ConfigPage.page;
  pageSize = ConfigPage.RowPorPagina;
  totalRegistros = 0;
  totalPages = 0;

  constructor(
    private usuariosService: UsuariosService,
    private router: Router,
    private swalMensaje: MensajeService,
    private manejoMensajeError: ManejoMensajesError,
  ) {}

  async ngOnInit() {
    await this.cargarUsuarios();
  }

  async cargarUsuarios(): Promise<void> {
    this.cargando.set(true);

    try {
      const response = await this.usuariosService.apiUsuariosPaginacionGet$Json({
        pagina: this.paginaActual,
        pageSize: this.pageSize,
        buscar: this.busqueda,
      });

      this.usuarios.set(response.items ?? []);
      this.paginaActual = response.pageActual ?? this.paginaActual;
      this.pageSize = response.pageSize ?? this.pageSize;
      this.totalRegistros = response.totalRegistros ?? 0;
      this.totalPages = response.totalPages ?? 0;
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      void this.swalMensaje.error('Error', mensajeError);
      this.usuarios.set([]);
      this.totalRegistros = 0;
      this.totalPages = 0;
    } finally {
      this.cargando.set(false);
    }
  }

  nuevoUsuario(): void {
    void this.router.navigate([`${Enlace.Admin}/${EnlaceSub.Seguridad}/${EnlaceSub.Usuarios}/new`]);
  }

  editarUsuario(idUsuario: string | undefined): void {
    if (!idUsuario) {
      return;
    }
    void this.router.navigate([
      `${Enlace.Admin}/${EnlaceSub.Seguridad}/${EnlaceSub.Usuarios}/edit`,
      idUsuario,
    ]);
  }

  buscar(): void {
    this.paginaActual = ConfigPage.page;
    void this.cargarUsuarios();
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.buscar();
  }
  cambiarPagina(pagina: number): void {
    this.paginaActual = pagina;
    void this.cargarUsuarios();
  }

  async cambiarEstadoUsuario(usuario: UsuarioDto): Promise<void> {
    if (!usuario.idUsuario) {
      return;
    }

    const activar = !usuario.estado;
    const confirmado = await this.swalMensaje.confirmar(
      activar ? '¿Activar usuario?' : '¿Desactivar usuario?',
      activar
        ? 'El usuario quedará activo y podrá ser utilizado'
        : 'El usuario quedará inactivo y no podrá ser utilizado',
    );
    if (!confirmado) {
      return;
    }

    try {
      const response = await this.usuariosService.apiUsuariosCambiarEstadoIdPut({
        id: usuario.idUsuario,
      });
      // Actualiza inmediatamente la fila en pantalla
      void this.cargarUsuarios();
      await this.swalMensaje.exito('Éxito', response!);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    }
  }

}
