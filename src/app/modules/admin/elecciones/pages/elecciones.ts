import { Component, OnInit, signal } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatFormField, MatInput, MatLabel, MatSuffix } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MatNativeDateModule,
  MatOption,
  NativeDateAdapter,
} from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { Paginacion } from '../../../../shared/paginacion/paginacion';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Eleccion } from '../../../../api/models/eleccion';
import { TipoEleccion } from '../../../../api/models/tipo-eleccion';
import { ConfigPage, Enlace, EnlaceSub } from '../../../../Config';
import { EleccionesService } from '../../../../api/services/elecciones.service';
import { Router } from '@angular/router';
import { MensajeService } from '../../../../core/mensajes/mensaje-service';
import { ManejoMensajesError } from '../../../../core/mensajes/manejo-mensajes-error';
import { TIPO_ELECCION } from '../../../../api/models/tipo-eleccion-array';
import { DatePipe } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';

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
  selector: 'app-elecciones',
  imports: [
    MatButton,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatInput,
    MatLabel,
    MatOption,
    MatSelect,
    Paginacion,
    ReactiveFormsModule,
    FormsModule,
    DatePipe,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSuffix,
  ],
  templateUrl: './elecciones.html',
  styleUrl: './elecciones.css',
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-EC' },
    { provide: DateAdapter, useClass: AdaptadorFecha },
    { provide: MAT_DATE_FORMATS, useValue: FORMATO_FECHA },
  ],
})
export class Elecciones implements OnInit {
  readonly elecciones = signal<Eleccion[]>([]);
  readonly cargando = signal(false);
  // Filtros
  busqueda = '';
  tipoEleccion: TipoEleccion | undefined = undefined;
  fechaDesde: Date | undefined = undefined;
  fechaHasta: Date | undefined = undefined;

  // Paginación
  paginaActual = ConfigPage.page;
  pageSize = ConfigPage.RowPorPagina;
  totalRegistros = 0;
  totalPages = 0;

  constructor(
    private eleccionesService: EleccionesService,
    private router: Router,
    private swalMensaje: MensajeService,
    private manejoMensajeError: ManejoMensajesError,
  ) {}

  async ngOnInit() {
    void this.cargarElecciones();
  }

  async cargarElecciones(): Promise<void> {
    this.cargando.set(true);

    try {
      const response = await this.eleccionesService.apiEleccionesPaginacionGet$Json({
        pagina: this.paginaActual,
        pageSize: this.pageSize,
        busqueda: this.busqueda,
        fechaInicio: this.formatearFecha(this.fechaDesde!),
        fechaFin: this.formatearFecha(this.fechaHasta!),
        tipoEleccion: this.tipoEleccion!,
      });

      this.elecciones.set(response.items ?? []);
      this.paginaActual = response.pageActual ?? this.paginaActual;
      this.pageSize = response.pageSize ?? this.pageSize;
      this.totalRegistros = response.totalRegistros ?? 0;
      this.totalPages = response.totalPages ?? 0;
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      void this.swalMensaje.error('Error', mensajeError);
      this.elecciones.set([]);
      this.totalRegistros = 0;
      this.totalPages = 0;
    } finally {
      this.cargando.set(false);
    }
  }

  nuevaEleccion(): void {
    void this.router.navigate([`${Enlace.Admin}/${EnlaceSub.Elecciones}/new`]);
  }

  editarEleccion(idEleccion: string | undefined): void {
    if (!idEleccion) {
      return;
    }
    void this.router.navigate([`${Enlace.Admin}/${EnlaceSub.Elecciones}/edit`, idEleccion]);
  }

  buscar(): void {
    if (this.fechaDesde! > this.fechaHasta!) {
      this.swalMensaje.advertencia('Fechas incorrectas',
        'La fecha de inicio no puede ser mayor a la fecha final.');
      return;
    }
    this.paginaActual = ConfigPage.page;
    void this.cargarElecciones();
  }
  limpiarFiltros(): void {
    this.busqueda = '';
    this.fechaDesde = undefined;
    this.fechaHasta = undefined;
    this.tipoEleccion = undefined;
    this.buscar();
  }
  cambiarPagina(pagina: number): void {
    this.paginaActual = pagina;
    void this.cargarElecciones();
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

  protected readonly tiposEleccion = TIPO_ELECCION;
}
