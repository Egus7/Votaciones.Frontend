import { Component, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
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
import { TIPO_ELECCION } from '../../../../api/models/tipo-eleccion-array';
import { Eleccion } from '../../../../api/models/eleccion';
import { EleccionesService } from '../../../../api/services/elecciones.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MensajeService } from '../../../../core/mensajes/mensaje-service';
import { ManejoMensajesError } from '../../../../core/mensajes/manejo-mensajes-error';
import { Enlace, EnlaceSub } from '../../../../Config';
import { ESTADO_ELECCION } from '../../../../api/models/estado-eleccion-array';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { METODO_ASIGNACION_ESCANOS } from '../../../../api/models/metodo-asignacion-escanos-array';

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
  selector: 'app-elecciones-form',
  imports: [
    FormsModule,
    MatButton,
    MatFormField,
    MatIcon,
    MatInput,
    MatLabel,
    MatOption,
    MatSelect,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSuffix,
  ],
  templateUrl: './elecciones-form.html',
  styleUrl: './elecciones-form.css',
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-EC' },
    { provide: DateAdapter, useClass: AdaptadorFecha },
    { provide: MAT_DATE_FORMATS, useValue: FORMATO_FECHA },
  ],
})
export class EleccionesForm implements OnInit {
  readonly tiposEleccion = TIPO_ELECCION;
  readonly estadosEleccion = ESTADO_ELECCION;
  readonly metodosEscanos = METODO_ASIGNACION_ESCANOS;
  eleccion: Eleccion = {};

  readonly cargando = signal(false);
  guardando = signal(false);
  //id obtenido desde la ruta.
  eleccionId: string | null = null;

  constructor(
    private eleccionesService: EleccionesService,
    private route: ActivatedRoute,
    private router: Router,
    private swalMensaje: MensajeService,
    private manejoMensajeError: ManejoMensajesError,
  ) {
    this.eleccionId = this.route.snapshot.paramMap.get('id');
  }

  async ngOnInit() {
    this.cargando.set(true);

    try {
      if (this.esEdicion) {
        await this.cargarEleccion();
      } else {
        this.inicializarNuevaLista();
      }
    } finally {
      this.cargando.set(false);
    }
  }

  get esEdicion(): boolean {
    return !!this.eleccionId;
  }

  private inicializarNuevaLista(): void {
    this.eleccion = {};
  }

  private async cargarEleccion(): Promise<void> {
    if (!this.eleccionId) {
      return;
    }
    this.cargando.set(true);

    try {
      this.eleccion = await this.eleccionesService.apiEleccionesIdGet$Json({
        id: this.eleccionId,
      });
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    } finally {
      this.cargando.set(false);
    }
  }

  guardarFormulario(): void {
    if (this.guardando()) {
      return;
    }

    if (!this.eleccion.nombreEleccion) {
      void this.swalMensaje.advertencia(
        'Datos incompletos',
        'Debe ingresar el nombre de la elección.',
      );
      return;
    }
    if (!this.eleccion.fechaEleccion) {
      void this.swalMensaje.advertencia(
        'Datos incompletos',
        'Debe ingresar la fecha de la elección.',
      );
      return;
    }
    if (!this.eleccion.tipoEleccion) {
      void this.swalMensaje.advertencia('Datos incompletos', 'Debe ingresar el tipo de elección.');
      return;
    }
    if (!this.eleccion.estado && this.esEdicion) {
      void this.swalMensaje.advertencia(
        'Datos incompletos',
        'Debe seleccionar un estado de la elección.',
      );
      return;
    }
    void this.guardarEleccion();
  }

  private async guardarEleccion(): Promise<void> {
    this.guardando.set(true);

    try {
      let response;
      if (this.esEdicion && this.eleccion) {
        response = await this.eleccionesService.apiEleccionesIdPut({
          id: this.eleccionId!,
          body: this.eleccion,
        });
        await this.swalMensaje.exito('Éxito', response!);
      } else {
        await this.eleccionesService.apiEleccionesPost$Json({
          body: this.eleccion,
        });
        void this.swalMensaje.exito('Éxito', 'Elección registrada correctamente!.');
      }
      // regresar al list
      void this.router.navigate([`${Enlace.Admin}/${EnlaceSub.Elecciones}`]);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    } finally {
      this.guardando.set(false);
    }
  }

  cancelarFormulario(): void {
    void this.router.navigate([`${Enlace.Admin}/${EnlaceSub.Elecciones}`]);
  }
}
