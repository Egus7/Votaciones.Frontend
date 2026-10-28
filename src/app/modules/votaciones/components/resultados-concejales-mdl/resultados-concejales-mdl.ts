import { Component, Inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { TipoCandidato } from '../../../../api/models/tipo-candidato';
import { TipoResultado } from '../../../../api/models/tipo-resultado';
import { AsignacionConcejalesDto } from '../../../../api/models/asignacion-concejales-dto';
import { ResultadosService } from '../../../../api/services/resultados.service';
import { MensajeService } from '../../../../core/mensajes/mensaje-service';
import { ManejoMensajesError } from '../../../../core/mensajes/manejo-mensajes-error';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Modal } from '../../../../shared/modals/modal/modal';

// Datos que recibe el modal
export interface ResultadosConcejalesData {
  eleccionId: string;
  cantonId: string;
  tipoCandidato: TipoCandidato;
  tipoResultado: TipoResultado;
}

@Component({
  selector: 'app-resultados-concejales-mdl',
  imports: [MatIconModule, MatButtonModule, DecimalPipe, MatProgressSpinnerModule, Modal],
  templateUrl: './resultados-concejales-mdl.html',
  styleUrl: './resultados-concejales-mdl.css',
})
export class ResultadosConcejalesMdl implements OnInit {
  asignacion: AsignacionConcejalesDto | null = null;

  readonly cargando = signal(false);
  readonly descargandoExcel = signal(false);

  listaExpandidaId: string | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: ResultadosConcejalesData,
    private dialogRef: MatDialogRef<ResultadosConcejalesMdl>,
    private resultadoService: ResultadosService,
    private swalMensaje: MensajeService,
    private manejoMensajeError: ManejoMensajesError,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargarAsignacion();
  }

  // CARGAR ASIGNACIÓN DE ESCAÑOS
  async cargarAsignacion(): Promise<void> {
    if (
      !this.data.eleccionId || !this.data.cantonId ||
      !this.data.tipoCandidato || !this.data.tipoResultado) {
      await this.swalMensaje.advertencia('Datos incompletos',
        'Debe seleccionar la elección, el cantón y los tipos de resultado.',);
      return;
    }

    this.cargando.set(true);
    try {
      this.asignacion = await this.resultadoService.apiResultadosAsignacionEscanosGet$Json({
        eleccionId: this.data.eleccionId,
        cantonId: this.data.cantonId,
        tipoCandidato: this.data.tipoCandidato,
        tipoResultado: this.data.tipoResultado,
      });

    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
      this.asignacion = null;
    } finally {
      this.cargando.set(false);
    }
  }

  // ABRIR O CERRAR CANDIDATOS DE UNA LISTA
  alternarCandidatos(listaId: string): void {
    this.listaExpandidaId = this.listaExpandidaId === listaId ? null : listaId;
  }
  // DESCARGAR EXCEL
  async descargarExcel(): Promise<void> {
    if (this.descargandoExcel()) {
      return;
    }

    if (!this.data.eleccionId || !this.data.cantonId) {
      await this.swalMensaje.advertencia(
        'Datos incompletos',
        'No se encontró la elección o el cantón seleccionado.',
      );
      return;
    }

    this.descargandoExcel.set(true);
    try {
      const archivo = await this.resultadoService.apiResultadosAsignacionConcejalesExcelGet({
        eleccionId: this.data.eleccionId,
        cantonId: this.data.cantonId,
        tipoCandidato: this.data.tipoCandidato,
        tipoResultado: this.data.tipoResultado,
      });

      if (!(archivo instanceof Blob) || archivo.size === 0) {
        await this.swalMensaje.error('Error', 'No se pudo descargar el archivo.');
        return;
      }

      const url = URL.createObjectURL(archivo);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = 'Asignacion_Concejales.xlsx';
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    } finally {
      this.descargandoExcel.set(false);
    }
  }

  cerrarMdl(): void {
    this.dialogRef.close();
  }
}
