import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ConfigPage, Tablas } from '../../../../Config';
import { MensajeService } from '../../../../core/mensajes/mensaje-service';
import { ManejoMensajesError } from '../../../../core/mensajes/manejo-mensajes-error';
import { DatePipe } from '@angular/common';
import { Paginacion } from '../../../../shared/paginacion/paginacion';
import { BitacoraService } from '../../../../api/services/bitacora.service';
import { UsuariosService } from '../../../../api/services/usuarios.service';
import { UsuarioDto } from '../../../../api/models/usuario-dto';
import { BitacoraDto } from '../../../../api/models/bitacora-dto';
import { MatDialog } from '@angular/material/dialog';
import { BitacoraDetalle } from './bitacora-detalle/bitacora-detalle';
import { MatFormField, MatInputModule, MatLabel } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatDatepickerModule, } from '@angular/material/datepicker';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MatNativeDateModule,
  NativeDateAdapter,
} from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';

export class AdaptadorFecha extends NativeDateAdapter {
  override format(date: Date, displayFormat: Object): string {
    if (!date || isNaN(date.getTime())) {
      return '';
    }

    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const anio = date.getFullYear();

    return `${dia}/${mes}/${anio}`;
  }
}

export const FORMATO_FECHA = {
  parse: {
    dateInput: 'dd/MM/yyyy',
  },
  display: {
    dateInput: 'dd/MM/yyyy',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'dd/MM/yyyy',
    monthYearA11yLabel: 'MMMM yyyy',
  },
};

@Component({
  selector: 'app-bitacora',
  imports: [
    FormsModule,
    MatIconModule,
    DatePipe,
    Paginacion,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './bitacora.html',
  styleUrl: './bitacora.css',
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-EC' },
    { provide: DateAdapter, useClass: AdaptadorFecha },
    { provide: MAT_DATE_FORMATS, useValue: FORMATO_FECHA },
  ],
})
export class Bitacora implements OnInit {
  // LISTADO
  readonly bitacoras = signal<BitacoraDto[]>([]);
  readonly usuarios = signal<UsuarioDto[]>([]);
  readonly cargando = signal(false);

  // FILTROS
  fechaDesde: Date | undefined = undefined;
  fechaHasta: Date | undefined = undefined;
  usuarioId: string | undefined = undefined;
  accion: string | undefined = undefined;
  modulo: string | undefined = undefined;

  readonly acciones = [
    { valor: 'INSERT', nombre: 'Crear' },
    { valor: 'UPDATE', nombre: 'Modificar' },
  ];

  readonly modulos = [
    { valor: Tablas.Eleccion, nombre: 'Elecciones' },
    { valor: Tablas.ListaElectoral, nombre: 'Listas electorales' },
    { valor: Tablas.Candidato, nombre: 'Candidatos' },
    { valor: Tablas.MesaElectoral, nombre: 'Mesas electorales' },
    { valor: Tablas.Actas, nombre: 'Actas' },
    { valor: Tablas.Usuario, nombre: 'Usuarios' },
    { valor: Tablas.Rol, nombre: 'Roles' },
  ];

  // PAGINACIÓN
  paginaActual = ConfigPage.page;
  pageSize = ConfigPage.RowPorPagina;
  totalRegistros = 0;
  totalPages = 0;

  constructor(
    private dialog: MatDialog,
    private bitacoraService: BitacoraService,
    private usuariosService: UsuariosService,
    private swalMensaje: MensajeService,
    private manejoMensajeError: ManejoMensajesError,
  ) {}

  async ngOnInit() {
    await this.cargarBitacora();
    await this.cargarUsuarios();
  }

  private async cargarBitacora(): Promise<void> {
    this.cargando.set(true);

    try {
      const response = await this.bitacoraService.apiBitacoraPaginacionGet$Json({
        pagina: this.paginaActual,
        pageSize: this.pageSize,
        fechaDesde: this.formatearFecha(this.fechaDesde!),
        fechaHasta: this.formatearFecha(this.fechaHasta!),
        usuarioId: this.usuarioId!,
        accion: this.accion!,
        tabla: this.modulo!,
      });

      this.bitacoras.set(response.items ?? []);
      this.paginaActual = response.pageActual ?? this.paginaActual;
      this.pageSize = response.pageSize ?? this.pageSize;
      this.totalRegistros = response.totalRegistros ?? 0;
      this.totalPages = response.totalPages ?? 0;
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      void this.swalMensaje.error('Error', mensajeError);
      this.bitacoras.set([]);
      this.totalRegistros = 0;
      this.totalPages = 0;
    } finally {
      this.cargando.set(false);
    }
  }

  async cargarUsuarios(): Promise<void> {
    try {
      const response = await this.usuariosService.apiUsuariosPaginacionGet$Json({});
      this.usuarios.set(response.items ?? []);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      void this.swalMensaje.error('Error', mensajeError);
      this.usuarios.set([]);
    }
  }

  buscar(): void {
    if (this.fechaDesde! > this.fechaHasta!) {
      this.swalMensaje.advertencia('Fechas incorrectas', 'La fecha de inicio no puede ser mayor a la fecha final');
      return;
    }
    this.paginaActual = ConfigPage.page;
    void this.cargarBitacora();
  }

  limpiarFiltros(): void {
    this.fechaDesde = undefined;
    this.fechaHasta = undefined;
    this.usuarioId = undefined;
    this.accion = undefined;
    this.modulo = undefined;
    this.buscar();
  }

  cambiarPagina(pagina: number): void {
    this.paginaActual = pagina;
    void this.cargarBitacora();
  }

  obtenerNombreModulo(tabla: string | undefined): string {
    const modulo = this.modulos.find((item) => item.valor === tabla);

    return modulo?.nombre ?? tabla ?? '—';
  }

  verDetalle(item: BitacoraDto): void {
    this.dialog.open(BitacoraDetalle, {
      data: item,
      width: '1150px',
      maxWidth: '96vw',
      maxHeight: '85vh',
      panelClass: 'axis-dialog-bitacora',
      autoFocus: false,
    });
  }

  private formatearFecha(fecha: Date | null): string | undefined {
    if (!fecha) {
      return undefined;
    }

    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();

    return `${anio}-${mes}-${dia}`;
  }
}
