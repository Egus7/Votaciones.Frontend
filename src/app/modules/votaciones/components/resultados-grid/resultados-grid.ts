import { Component, OnDestroy, OnInit, Signal, signal } from '@angular/core';
import { TipoCandidato } from '../../../../api/models/tipo-candidato';
import { Enlace, EnlaceSub } from '../../../../Config';
import { ResultadoEleccionDto } from '../../../../api/models/resultado-eleccion-dto';
import { Provincia } from '../../../../api/models/provincia';
import { Canton } from '../../../../api/models/canton';
import { Parroquia } from '../../../../api/models/parroquia';
import { Zona } from '../../../../api/models/zona';
import { TipoResultado } from '../../../../api/models/tipo-resultado';
import { ResultadosService } from '../../../../api/services/resultados.service';
import { LugarVotacionService } from '../../../../core/services/lugar-votacion-service';
import { EleccionContexto } from '../../../../core/services/eleccion-contexto';
import { Router } from '@angular/router';
import { MensajeService } from '../../../../core/mensajes/mensaje-service';
import { ManejoMensajesError } from '../../../../core/mensajes/manejo-mensajes-error';
import { DignidadResultado } from '../../pages/resultados/resultados';
import { MatFormField, MatLabel } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  ResultadosActualizadosEvent,
  ResultadosSignalrService,
} from '../../../../core/services/resultados-signalr.service';

@Component({
  selector: 'app-resultados-grid',
  imports: [
    MatFormField,
    MatLabel,
    MatSelectModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    DecimalPipe,
  ],
  templateUrl: './resultados-grid.html',
  styleUrl: './resultados-grid.css',
})
export class ResultadosGrid implements OnInit, OnDestroy {
  readonly cargando = signal(false);
  readonly resultado = signal<ResultadoEleccionDto | null>(null);
  //signalR notificacion
  private actualizacionPendiente = false;
  private suscripcionResultados?: Subscription;
  // TIPOS DE CANDIDATO SEGÚN LA ELECCIÓN
  readonly tiposCandidato: Signal<TipoCandidato[]>;

  readonly provincias = signal<Provincia[]>([]);
  readonly cantones = signal<Canton[]>([]);
  readonly parroquias = signal<Parroquia[]>([]);
  readonly zonas = signal<Zona[]>([]);

  // FILTROS
  eleccionId: string | undefined;
  tipoCandidato: TipoCandidato | undefined;
  tipoResultado: TipoResultado = 'Preliminar';

  provinciaId: string | undefined;
  cantonId: string | undefined;
  parroquiaId: string | undefined;
  zonaId: string | undefined;

  constructor(
    private resultadosService: ResultadosService,
    private lugarVotacionService: LugarVotacionService,
    private eleccionContexto: EleccionContexto,
    private resultadosSignalr: ResultadosSignalrService,
    private router: Router,
    private swalMensaje: MensajeService,
    private manejoMensajeError: ManejoMensajesError,
  ) {
    this.tiposCandidato = this.eleccionContexto.tiposCandidato;
  }

  async ngOnInit(): Promise<void> {
    const eleccion = this.eleccionContexto.eleccion();

    if (!eleccion?.idEleccion) {
      await this.swalMensaje.error('Error', 'No se encontró la elección actual.');
      this.regresar();
      return;
    }
    this.eleccionId = eleccion.idEleccion;
    // La dignidad es opcional.
    const state = history.state as {
      dignidad?: DignidadResultado;
    };
    this.tipoCandidato = state?.dignidad?.tipoCandidato;

    this.suscripcionResultados = this.resultadosSignalr.resultadosActualizados$.subscribe(
      (evento) => {
        void this.procesarResultadosActualizados(evento);
      },
    );

    if (this.tipoCandidato) {
      await this.unirseAGrupoResultados();
    }

    this.cargando.set(true);

    try {
      await this.cargarProvincias();
    } catch (error) {
      await this.mostrarError(error);
    } finally {
      this.cargando.set(false);
    }
  }

  // UNIRSE AL GRUPO DE LA ELECCIÓN Y DIGNIDAD
  private async unirseAGrupoResultados(): Promise<void> {
    if (!this.eleccionId || !this.tipoCandidato) {
      return;
    }

    try {
      await this.resultadosSignalr.unirseAResultados(this.eleccionId, this.tipoCandidato);
    } catch (error) {
      // SignalR es complementario: no impedir la consulta normal.
      console.error('No se pudo conectar a las notificaciones de resultados.', error);
    }
  }

  // PROCESAR NOTIFICACIÓN RECIBIDA
  private async procesarResultadosActualizados(evento: ResultadosActualizadosEvent): Promise<void> {
    if (!this.eleccionId || !this.tipoCandidato || !this.resultado()) {
      return;
    }
    // Validar elección y dignidad.
    if (
      evento.eleccionId.toLowerCase() !== this.eleccionId.toLowerCase() ||
      evento.tipoCandidato !== this.tipoCandidato
    ) {
      return;
    }
    // Comprobar si la ubicación notificada afecta el filtro actual.
    if (!this.coincideUbicacion(evento)) {
      return;
    }
    // Si hay una consulta en curso, dejar pendiente la actualización.
    if (this.cargando()) {
      this.actualizacionPendiente = true;
      return;
    }
    // Actualizar los resultados con los filtros que el usuario mantiene.
    await this.consultarResultados();
  }

  // COMPROBAR SI LA NOTIFICACIÓN AFECTA AL ÁMBITO CONSULTADO
  private coincideUbicacion(evento: ResultadosActualizadosEvent): boolean {
    if (this.zonaId) {
      return evento.zonaId === this.zonaId;
    }
    if (this.parroquiaId) {
      return evento.parroquiaId === this.parroquiaId;
    }
    if (this.cantonId) {
      return evento.cantonId === this.cantonId;
    }
    if (this.provinciaId) {
      return evento.provinciaId === this.provinciaId;
    }
    // se consultan los resultados nacionales.
    return true;
  }
  // LIBERAR SUSCRIPCIÓN
  ngOnDestroy(): void {
    this.suscripcionResultados?.unsubscribe();

    void this.resultadosSignalr.salirDeResultados().catch((error) => {
      console.error('Error al salir del grupo de resultados.', error);
    });
  }

  /** CONSULTAR PARA EL COMPONENT RESULTADOS**/
  // CARGAR PROVINCIAS
  private async cargarProvincias(): Promise<void> {
    try {
      const response = await this.lugarVotacionService.provincias();
      this.provincias.set(response);
    } catch (error) {
      await this.mostrarError(error);
      this.provincias.set([]);
    }
  }
  // CAMBIO DE DIGNIDAD
  async cambioTipoCandidato() {
    this.provinciaId = undefined;
    this.cantonId = undefined;
    this.parroquiaId = undefined;
    this.zonaId = undefined;

    this.cantones.set([]);
    this.parroquias.set([]);
    this.zonas.set([]);
    this.resultado.set(null);

    if (!this.tipoCandidato) {
      await this.resultadosSignalr.salirDeResultados();
      return;
    }

    await this.unirseAGrupoResultados();
  }
  // CAMBIO DE TIPO DE RESULTADO
  cambioTipoResultado(): void {
    this.resultado.set(null);
  }

  // CAMBIO DE PROVINCIA
  async cambioProvincia(): Promise<void> {
    this.cantonId = undefined;
    this.parroquiaId = undefined;
    this.zonaId = undefined;

    this.cantones.set([]);
    this.parroquias.set([]);
    this.zonas.set([]);
    this.resultado.set(null);

    if (!this.provinciaId) {
      return;
    }

    try {
      const response = await this.lugarVotacionService.cantones(this.provinciaId);
      this.cantones.set(response);
    } catch (error) {
      await this.mostrarError(error);
      this.cantones.set([]);
    }
  }
  // CAMBIO DE CANTÓN
  async cambioCanton(): Promise<void> {
    this.parroquiaId = undefined;
    this.zonaId = undefined;

    this.parroquias.set([]);
    this.zonas.set([]);
    this.resultado.set(null);

    if (!this.cantonId) {
      return;
    }

    try {
      const response = await this.lugarVotacionService.parroquias(this.cantonId);
      this.parroquias.set(response);
    } catch (error) {
      await this.mostrarError(error);
      this.parroquias.set([]);
    }
  }

  // CAMBIO DE PARROQUIA
  async cambioParroquia(): Promise<void> {
    this.zonaId = undefined;
    this.zonas.set([]);
    this.resultado.set(null);

    if (!this.parroquiaId) {
      return;
    }

    try {
      const response = await this.lugarVotacionService.zonas(this.parroquiaId);
      this.zonas.set(response);
    } catch (error) {
      await this.mostrarError(error);
      this.zonas.set([]);
    }
  }
  // CAMBIO DE ZONA
  cambioZona(): void {
    this.resultado.set(null);
  }

  // CONSULTAR RESULTADOS
  async consultarResultados(): Promise<void> {
    if (!this.eleccionId) {
      await this.swalMensaje.advertencia('Datos incompletos', 'No se encontró la elección actual.');
      return;
    }
    //validar filtros
    if (!(await this.validarFiltros())) {
      return;
    }
    if (this.cargando()) {
      return;
    }
    this.cargando.set(true);
    this.resultado.set(null);

    try {
      const parametros = {
        eleccionId: this.eleccionId,
        tipoCandidato: this.tipoCandidato,
        tipoResultado: this.tipoResultado,
      };

      let response: ResultadoEleccionDto;

      // Consultar según la ubicación más específica seleccionada.
      if (this.zonaId) {
        response = await this.resultadosService.apiResultadosEleccionZonaGet$Json({
          ...parametros,
          zonaId: this.zonaId,
        });
      } else if (this.parroquiaId) {
        response = await this.resultadosService.apiResultadosEleccionParroquiaGet$Json({
          ...parametros,
          parroquiaId: this.parroquiaId,
        });
      } else if (this.cantonId) {
        response = await this.resultadosService.apiResultadosEleccionCantonGet$Json({
          ...parametros,
          cantonId: this.cantonId,
        });
      } else {
        response = await this.resultadosService.apiResultadosEleccionGet$Json({
          ...parametros,
        });
      }
      this.resultado.set(response);

    } catch (error) {
      await this.mostrarError(error);
    } finally {
      this.cargando.set(false);
      if (this.actualizacionPendiente) {
        this.actualizacionPendiente = false;
        void this.consultarResultados();
      }
    }
  }

  // VALIDAR UBICACIÓN SEGÚN LA DIGNIDAD
  private async validarFiltros(): Promise<boolean> {
    if (!this.tipoCandidato) {
      await this.swalMensaje.advertencia('Datos incompletos', 'Debe seleccionar una dignidad.');
      return false;
    }

    // Presidente: permite consultar a nivel nacional.
    if (this.tipoCandidato === 'Presidente') {
      return true;
    }

    // Las demás dignidades requieren al menos una provincia.
    if (!this.provinciaId) {
      await this.swalMensaje.informacion('Información', 'Debe seleccionar una provincia.');
      return false;
    }

    // Prefecto: puede consultar por provincia o por un ámbito inferior.
    if (this.tipoCandidato === 'Prefecto') {
      return true;
    }
    // Alcalde y concejales requieren cantón como mínimo.
    if (!this.cantonId) {
      await this.swalMensaje.informacion('Información', 'Debe seleccionar un cantón.');
      return false;
    }

    return true;
  }

  // MANEJO DE ERRORES
  private async mostrarError(error: unknown): Promise<void> {
    const mensajeError = this.manejoMensajeError.getMessage(error);
    await this.swalMensaje.error('Error', mensajeError);
  }
  // REGRESAR
  regresar(): void {
    void this.router.navigate([`${Enlace.Votaciones}/${EnlaceSub.Resultados}`]);
  }
}
