import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AdmUsuario } from '../../../../../api/models/adm-usuario';
import { UsuariosService } from '../../../../../api/services/usuarios.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MensajeService } from '../../../../../core/mensajes/mensaje-service';
import { ManejoMensajesError } from '../../../../../core/mensajes/manejo-mensajes-error';
import { UsuarioDto } from '../../../../../api/models/usuario-dto';
import { RolDto } from '../../../../../api/models/rol-dto';
import { RolesModal } from '../../../../../shared/modals/roles-modal/roles-modal';
import { Modal } from '../../../../../shared/modals/modal/modal';
import { Enlace, EnlaceSub } from '../../../../../Config';
import { MatFormField, MatInputModule, MatLabel } from '@angular/material/input';

@Component({
  selector: 'app-usuarios-form',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    Modal,
    RolesModal,
    MatFormField,
    MatLabel,
    MatInputModule,
  ],
  templateUrl: './usuarios-form.html',
  styleUrl: './usuarios-form.css',
})
export class UsuariosForm implements OnInit {
  usuario: AdmUsuario = {};

  readonly cargando = signal(false);
  mostrarPassword = signal(false);
  guardando = false;

  //id obtenido desde la ruta.
  usuarioId: string | null = null;
  //modal
  mostrarModalRol = false;
  rolSeleccionadoInfo: RolDto | null = null;

  @ViewChild(RolesModal) selectorRol?: RolesModal;

  constructor(
    private usuariosService: UsuariosService,
    private route: ActivatedRoute,
    private router: Router,
    private swalMensaje: MensajeService,
    private manejoMensajeError: ManejoMensajesError,
  ) {
    this.usuarioId = this.route.snapshot.paramMap.get('id');
  }

  async ngOnInit() {
    this.cargando.set(true);

    try {
      if (this.esEdicion) {
        await this.cargarUsuario();
      } else {
        this.inicializarNuevoUsuario();
      }
    } finally {
      this.cargando.set(false);
    }
  }

  get esEdicion(): boolean {
    return !!this.usuarioId;
  }

  private inicializarNuevoUsuario(): void {
    this.usuario = {};

    this.guardando = false;
    this.mostrarModalRol = false;
    this.rolSeleccionadoInfo = null;
  }

  private async cargarUsuario(): Promise<void> {
    if (!this.usuarioId) {
      return;
    }
    this.cargando.set(true);

    try {
      const response = await this.usuariosService.apiUsuariosIdGet$Json({
        id: this.usuarioId,
      });
      this.usuario = this.mapearDtoAUsuario(response);
      // Cargar el rol actual del usuario
      if (response.rolId && response.nombreRol) {
        this.rolSeleccionadoInfo = {
          idRol: response.rolId,
          nombreRol: response.nombreRol,
        };
      } else {
        this.rolSeleccionadoInfo = null;
      }
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    } finally {
      this.cargando.set(false);
    }
  }

  private mapearDtoAUsuario(dto: UsuarioDto): AdmUsuario {
    return {
      idUsuario: dto.idUsuario,
      nombreUsuario: dto.nombreUsuario ?? undefined,
      emailUsuario: dto.emailUsuario,
      rolId: dto.rolId,
      estado: dto.estado,
    };
  }

  abrirModalRol(): void {
    this.mostrarModalRol = true;
  }
  cerrarModalRol(): void {
    this.mostrarModalRol = false;
  }
  confirmarRol(): void {
    const rol = this.selectorRol?.obtenerSeleccionado() ?? null;

    if (!rol) {
      void this.swalMensaje.advertencia(
        'Rol requerido',
        'Debe seleccionar un rol para el usuario.',
      );
      return;
    }
    this.rolSeleccionadoInfo = rol;
    this.usuario.rolId = rol.idRol;
    this.cerrarModalRol();
  }
  // Guardar
  guardarFormulario(): void {
    if (this.guardando) {
      return;
    }

    if (!this.usuario.nombreUsuario) {
      void this.swalMensaje.advertencia(
        'Datos incompletos',
        'Debe ingresar el nombre del usuario.',
      );
      return;
    }
    if (!this.usuario.emailUsuario) {
      void this.swalMensaje.advertencia(
        'Datos incompletos',
        'Debe ingresar el correo electronico.',
      );
      return;
    }
    if (!this.usuario.password && !this.esEdicion) {
      void this.swalMensaje.advertencia(
        'Datos incompletos',
        'Debe ingresar la contraseña del usuario.',
      );
      return;
    }
    if (!this.usuario.rolId) {
      void this.swalMensaje.advertencia(
        'Datos incompletos',
        'Debe seleccionar el rol del usuario.',
      );
      return;
    }
    void this.guardarUsuario();
  }

  private async guardarUsuario() {
    this.guardando = true;

    try {
      let response;
      if (this.esEdicion && this.usuarioId) {
        response = await this.usuariosService.apiUsuariosIdPut({
          id: this.usuarioId,
          body: this.usuario,
        });
        await this.swalMensaje.exito('Éxito', response!);
      } else {
        await this.usuariosService.apiUsuariosPost$Json({
          body: this.usuario,
        });
        void this.swalMensaje.exito('Éxito', 'Usuario registrado correctamente!.');
      }
      // regresar al list
      void this.router.navigate([`${Enlace.Admin}/${EnlaceSub.Seguridad}/${EnlaceSub.Usuarios}`]);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    } finally {
      this.guardando = false;
    }
  }

  cancelarFormulario(): void {
    void this.router.navigate([`${Enlace.Admin}/${EnlaceSub.Seguridad}/${EnlaceSub.Usuarios}`]);
  }
}
