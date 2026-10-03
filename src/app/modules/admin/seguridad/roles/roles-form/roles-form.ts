import { Component, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { RolDto } from '../../../../../api/models/rol-dto';
import { Enlace, EnlaceSub, Permisos } from '../../../../../Config';
import { ActivatedRoute, Router } from '@angular/router';
import { MensajeService } from '../../../../../core/mensajes/mensaje-service';
import { ManejoMensajesError } from '../../../../../core/mensajes/manejo-mensajes-error';
import { RolesService } from '../../../../../api/services/roles.service';

interface Permiso {
  codigo: string;
  nombre: string;
}
interface ModuloPermiso {
  codigo: string;
  nombre: string;
  permisos: Permiso[];
}

@Component({
  selector: 'app-roles-form',
  imports: [MatIconModule, FormsModule],
  templateUrl: './roles-form.html',
  styleUrl: './roles-form.css',
})
export class RolesForm {
  // Datos del formulario
  rol: RolDto = {};

  readonly cargando = signal(false);
  readonly guardando = signal(false);
  // Identificador de la ruta
  rolId: string | null = null;

  modulosAbiertos = new Set<string>();
  // Permisos seleccionados
  permisosSeleccionados = new Set<string>();
  // Catálogo de permisos
  readonly modulosPermisos: ModuloPermiso[] = [
    //Elecciones
    {
      codigo: 'elecciones',
      nombre: 'Elecciones',
      permisos: [
        { codigo: Permisos.ELECCIONES_VIEW, nombre: 'Consultar' },
        { codigo: Permisos.ELECCIONES_CREATE, nombre: 'Crear' },
        { codigo: Permisos.ELECCIONES_EDIT, nombre: 'Editar' },
      ],
    },
    //Listas
    {
      codigo: 'listas',
      nombre: 'Listas electorales',
      permisos: [
        { codigo: Permisos.LISTAS_VIEW, nombre: 'Consultar' },
        { codigo: Permisos.LISTAS_CREATE, nombre: 'Crear' },
        { codigo: Permisos.LISTAS_EDIT, nombre: 'Editar' },
      ],
    },
    //Candidatos
    {
      codigo: 'candidatos',
      nombre: 'Candidatos',
      permisos: [
        { codigo: Permisos.CANDIDATOS_VIEW, nombre: 'Consultar' },
        { codigo: Permisos.CANDIDATOS_CREATE, nombre: 'Crear' },
        { codigo: Permisos.CANDIDATOS_EDIT, nombre: 'Editar' },
      ],
    },
    //Mesas
    {
      codigo: 'mesas',
      nombre: 'Mesas',
      permisos: [
        { codigo: Permisos.MESAS_VIEW, nombre: 'Consultar' },
        { codigo: Permisos.MESAS_CREATE, nombre: 'Crear' },
        { codigo: Permisos.MESAS_EDIT, nombre: 'Editar' },
      ],
    },
    //Actas
    {
      codigo: 'actas',
      nombre: 'Actas',
      permisos: [
        { codigo: Permisos.ACTAS_VIEW, nombre: 'Consultar' },
        { codigo: Permisos.ACTAS_REGISTRAR, nombre: 'Registrar' },
        { codigo: Permisos.ACTAS_EDITAR, nombre: 'Editar' },
        { codigo: Permisos.ACTAS_VALIDAR, nombre: 'Validar' },
      ],
    },
    //Resultados
    {
      codigo: 'resultados',
      nombre: 'Resultados',
      permisos: [{ codigo: Permisos.RESULTADOS_VIEW, nombre: 'Consultar' }],
    },
    //Usuarios
    {
      codigo: 'usuarios',
      nombre: 'Usuarios',
      permisos: [
        { codigo: Permisos.USUARIOS_VIEW, nombre: 'Consultar' },
        { codigo: Permisos.USUARIOS_CREATE, nombre: 'Crear' },
        { codigo: Permisos.USUARIOS_EDIT, nombre: 'Editar' },
      ],
    },
    //Roles
    {
      codigo: 'roles',
      nombre: 'Roles',
      permisos: [
        { codigo: Permisos.ROLES_VIEW, nombre: 'Consultar' },
        { codigo: Permisos.ROLES_CREATE, nombre: 'Crear' },
        { codigo: Permisos.ROLES_EDIT, nombre: 'Editar' },
      ],
    },
    //Bitacora
    {
      codigo: 'bitacora',
      nombre: 'Bitácora',
      permisos: [{ codigo: Permisos.BITACORA_VIEW, nombre: 'Consultar' }],
    },
  ];

  constructor(
    private rolesService: RolesService,
    private route: ActivatedRoute,
    private router: Router,
    private swalMensaje: MensajeService,
    private manejoMensajeError: ManejoMensajesError,
  ) {
    this.rolId = this.route.snapshot.paramMap.get('id');
  }

  async ngOnInit(): Promise<void> {
    this.cargando.set(true);

    try {
      if (this.esEdicion) {
        await this.cargarRol();
      } else {
        this.inicializarNuevoRol();
      }
    } finally {
      this.cargando.set(false);
    }
  }

  get esEdicion(): boolean {
    return !!this.rolId;
  }
  get esRolAdministrador(): boolean {
    return this.rol?.nombreRol?.trim().toLowerCase() === 'administrador';
  }

  private inicializarNuevoRol(): void {
    this.rol = {};
    this.permisosSeleccionados.clear();
    this.guardando.set(false);
  }

  private async cargarRol(): Promise<void> {
    if (!this.rolId) {
      return;
    }
    this.cargando.set(true);

    try {
      this.rol = await this.rolesService.apiRolesIdGet$Json({
        id: this.rolId,
      });
      // Cargar permisos del rol
      this.permisosSeleccionados.clear();
      if (this.rol.permisos?.length) {
        this.rol.permisos.forEach((permiso) => {
          this.permisosSeleccionados.add(permiso);
        });
      }
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    } finally {
      this.cargando.set(false);
    }
  }

  // Permisos
  tienePermiso(codigo: string): boolean {
    return this.permisosSeleccionados.has(codigo);
  }
  cambiarPermiso(codigo: string, seleccionado: boolean): void {
    if (this.esRolAdministrador) {
      return;
    }
    if (seleccionado) {
      this.permisosSeleccionados.add(codigo);
    } else {
      this.permisosSeleccionados.delete(codigo);
    }
  }
  moduloCompleto(modulo: ModuloPermiso): boolean {
    return modulo.permisos.every((permiso) => this.permisosSeleccionados.has(permiso.codigo));
  }
  cambiarPermisosModulo(modulo: ModuloPermiso, seleccionado: boolean): void {
    if (this.esRolAdministrador) {
      return;
    }
    for (const permiso of modulo.permisos) {
      if (seleccionado) {
        this.permisosSeleccionados.add(permiso.codigo);
      } else {
        this.permisosSeleccionados.delete(permiso.codigo);
      }
    }
  }
  cambiarTodosLosPermisos(seleccionado: boolean): void {
    if (this.esRolAdministrador) {
      return;
    }
    for (const modulo of this.modulosPermisos) {
      for (const permiso of modulo.permisos) {
        if (seleccionado) {
          this.permisosSeleccionados.add(permiso.codigo);
        } else {
          this.permisosSeleccionados.delete(permiso.codigo);
        }
      }
    }
  }
  cantidadPermisosSeleccionados(modulo: ModuloPermiso): number {
    return modulo.permisos.filter((permiso) => this.tienePermiso(permiso.codigo)).length;
  }
  // Acordeón de módulos
  toggleModulo(codigo: string): void {
    if (this.modulosAbiertos.has(codigo)) {
      this.modulosAbiertos.delete(codigo);
    } else {
      this.modulosAbiertos.add(codigo);
    }
  }
  moduloAbierto(codigo: string): boolean {
    return this.modulosAbiertos.has(codigo);
  }

  // Guardar
  guardarFormulario(): void {
    if (this.guardando()) {
      return;
    }

    if (!this.rol.nombreRol?.trim()) {
      void this.swalMensaje.advertencia('Nombre requerido', 'Debe ingresar el nombre del rol.');
      return;
    }

    if (!this.rol.descripcionRol?.trim()) {
      void this.swalMensaje.advertencia(
        'Descripción requerida',
        'Debe ingresar la descripción del rol.',
      );
      return;
    }

    /* El rol Administrador es un rol protegido. No permitimos modificar sus permisos desde el frontend.*/
    if (this.esRolAdministrador) {
      this.cambiarTodosLosPermisos(true);
    }
    // Convertir los permisos seleccionados para enviar.
    this.rol.permisos = Array.from(this.permisosSeleccionados);

    void this.guardarRol();
  }

  private async guardarRol() {
    this.guardando.set(true);

    try {
      let response;
      if (this.esEdicion && this.rolId) {
        response = await this.rolesService.apiRolesIdPut({
          id: this.rolId,
          body: this.rol,
        });
        await this.swalMensaje.exito('Éxito', response!);
      } else {
        await this.rolesService.apiRolesPost$Json({
          body: this.rol,
        });
        void this.swalMensaje.exito('Éxito', 'Rol registrado correctamente!.');
      }
      // regresar al list
      void this.router.navigate([`${Enlace.Admin}/${EnlaceSub.Seguridad}/${EnlaceSub.Roles}`]);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    } finally {
      this.guardando.set(false);
    }
  }

  cancelarFormulario(): void {
    void this.router.navigate([`${Enlace.Admin}/${EnlaceSub.Seguridad}/${EnlaceSub.Roles}`]);
  }
}
