import { Component, computed, OnDestroy, OnInit, Signal, signal } from '@angular/core';
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
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, Plugin } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { MesasElectoralService } from '../../../../api/services/mesas-electoral.service';
import { MesaElectoralDto } from '../../../../api/models/mesa-electoral-dto';

// Registrar las etiquetas de los gráficos una sola vez.
Chart.register(ChartDataLabels);

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
    BaseChartDirective,
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
  readonly mesas = signal(<MesaElectoralDto[]>[]);

  // FILTROS
  eleccionId: string | undefined;
  tipoCandidato: TipoCandidato | undefined;
  tipoResultado: TipoResultado = 'Preliminar';

  provinciaId: string | undefined;
  cantonId: string | undefined;
  parroquiaId: string | undefined;
  zonaId: string | undefined;
  mesaId: string | undefined;

  // PORCENTAJE DE ACTAS VALIDADAS
  porcentajeActasValidadas = computed(() => {
    const datos = this.resultado();
    const total = datos?.totalMesas ?? 0;
    const validadas = datos?.mesasValidadas ?? 0;

    if (total <= 0) {
      return 0;
    }
    return Math.min(100, (validadas / total) * 100);
  });
  // GRÁFICO DE BARRAS: VOTOS POR CANDIDATO/LISTA
  readonly graficoVotosData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const items = this.resultado()?.resultados ?? [];

    return {
      labels: items.map((item) => this.obtenerNombreGrafico(item)),
      datasets: [
        {
          label: 'Votos',
          data: items.map((item) => Number(item.votos ?? 0)),
          backgroundColor: '#2478f3',
          hoverBackgroundColor: '#175ed1',
          borderRadius: 5,
          borderSkipped: false,
          maxBarThickness: 36,
        },
      ],
    };
  });

  graficoVotosOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    // Espacio para los nombres a la izquierda de las barras.
    onResize: (chart) => {
      const ancho = chart.width;
      const paddingIzquierdo = ancho < 400 ? 105 : ancho < 600 ? 125 : ancho < 900 ? 145 : 170;

      chart.options.layout = {
        ...chart.options.layout,
        padding: {
          left: paddingIzquierdo,
          right: 16,
        },
      };
    },
    plugins: {
      legend: {
        display: false,
      },
      datalabels: {
        anchor: 'end',
        align: 'end',
        offset: 4,
        clamp: true,
        color: '#334155',
        font: {
          size: 14,
          weight: 'bold',
        },
        formatter: (_valor, contexto) => {
          const item = this.resultado()?.resultados?.[contexto.dataIndex];
          return `${(item?.votos ?? 0).toFixed(0)}`;
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const item = this.resultado()?.resultados?.[context.dataIndex];
            const votos = Number(context.raw ?? 0).toLocaleString('es-EC');
            const porcentaje = (item?.porcentaje ?? 0).toFixed(2);

            return `${votos} votos (${porcentaje}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        beginAtZero: true,
        grace: '12%',
        ticks: {
          precision: 0,
        },
      },
      y: {
        ticks: {
          display: false,
        },
        border: {
          display: false,
        },
      },
    },
  };
  //plugins
  readonly graficoVotosPlugins: Plugin<'bar'>[] = [
    {
      id: 'etiquetasCandidatoLista',
      afterDraw: (chart) => {
        const items = this.resultado()?.resultados ?? [];
        const escalaY = chart.scales['y'];

        if (!escalaY || !items.length) {
          return;
        }
        const ctx = chart.ctx;
        const anchoTexto =
          chart.width < 400 ? 90 : chart.width < 600 ? 110 : chart.width < 900 ? 130 : 150;
        // Espacio reservado a la izquierda del gráfico.
        const x = Math.max(8, chart.chartArea.left - anchoTexto - 10);
        ctx.save();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        items.forEach((item, index) => {
          const y = escalaY.getPixelForValue(index);
          const nombre = this.obtenerNombreGrafico(item);
          const subtitulo = this.obtenerSubtituloGrafico(item);
          // Nombre del candidato o de la lista.
          ctx.fillStyle = '#1e293b';
          ctx.font = '600 12px Inter, sans-serif';

          ctx.fillText(this.truncarTexto(ctx, nombre, anchoTexto), x, subtitulo ? y - 6 : y);

          // Número y nombre de la lista electoral.
          if (subtitulo) {
            ctx.fillStyle = '#64748b';
            ctx.font = '10px Inter, sans-serif';

            ctx.fillText(this.truncarTexto(ctx, subtitulo, anchoTexto), x, y + 9);
          }
        });
        ctx.restore();
      },
    },
  ];

  // GRÁFICO DE DONA: DISTRIBUCIÓN DE VOTOS
  readonly graficoPorcentajeData = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const items = this.resultado()?.resultados ?? [];

    return {
      labels: items.map((item) => this.obtenerNombreGrafico(item)),
      datasets: [
        {
          data: items.map((item) => Number(item.votos ?? 0)),
          backgroundColor: [
            '#2478f3',
            '#0d9488',
            '#f59e0b',
            '#8b5cf6',
            '#e11d48',
            '#64748b',
            '#65a30d',
            '#0891b2',
            '#d946ef',
            '#ea580c',
          ],
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverOffset: 6,
        },
      ],
    };
  });

  readonly graficoPorcentajeOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          boxWidth: 8,
        },
      },
      datalabels: {
        color: '#ffffff',
        font: {
          weight: 'bold',
          size: 11,
        },
        formatter: (valor, contexto) => {
          const valores = contexto.dataset.data as number[];
          const total = valores.reduce((suma, actual) => suma + Number(actual ?? 0), 0);
          const votos = Number(valor ?? 0);
          // No mostrar porcentajes si no hay votos.
          if (total <= 0 || votos <= 0) {
            return '';
          }
          return `${((votos / total) * 100).toFixed(2)}%`;
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const valores = context.dataset.data as number[];
            const total = valores.reduce((suma, valor) => suma + Number(valor ?? 0), 0);
            const votos = Number(context.raw ?? 0);
            const porcentaje = total > 0 ? (votos / total) * 100 : 0;
            return ` ${votos.toLocaleString('es-EC')} votos (${porcentaje.toFixed(2)}%)`;
          },
        },
      },
    },
  };

  constructor(
    private resultadosService: ResultadosService,
    private lugarVotacionService: LugarVotacionService,
    private eleccionContexto: EleccionContexto,
    private mesasService: MesasElectoralService,
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

  // SIGNALR
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
    if (!this.eleccionId || !this.tipoCandidato) {
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
    // Sí hay una consulta en curso, dejar pendiente la actualización.
    if (this.cargando()) {
      this.actualizacionPendiente = true;
      return;
    }
    // No consultar automáticamente si todavía no se ha realizado una consulta inicial.
    if (!this.resultado()) {
      return;
    }
    // Actualizar los resultados con los filtros seleccionados.
    await this.consultarResultados();
  }

  // COMPROBAR SI LA NOTIFICACIÓN AFECTA AL ÁMBITO CONSULTADO
  private coincideUbicacion(evento: ResultadosActualizadosEvent): boolean {
    if (this.mesaId) {
      return evento.mesaId === this.mesaId;
    }
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
      //Seleccionar Pichincha por defecto
      if (this.tipoCandidato != 'Presidente') {
        const pichincha = response.find(
          (x) => x.nombreProvincia!.trim().toLowerCase() === 'pichincha',
        );
        this.provinciaId = pichincha?.idProvincia;
        //No llama al método si no se encontro la provincia
        if (this.provinciaId) {
          await this.cambioProvincia();
        }
      }
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
    this.mesaId = undefined;

    this.cantones.set([]);
    this.parroquias.set([]);
    this.zonas.set([]);
    this.mesas.set([]);
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
    this.mesaId = undefined;

    this.cantones.set([]);
    this.parroquias.set([]);
    this.zonas.set([]);
    this.mesas.set([]);
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
    this.mesaId = undefined;

    this.parroquias.set([]);
    this.zonas.set([]);
    this.mesas.set([]);
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
    this.mesaId = undefined;

    this.zonas.set([]);
    this.mesas.set([]);
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
  async cambioZona(): Promise<void> {
    this.mesaId = undefined;

    this.mesas.set([]);
    this.resultado.set(null);

    if (!this.zonaId) {
      return;
    }

    try {
      const response = await this.mesasService.apiMesasElectoralZonaGet$Json({
        eleccionId: this.eleccionId,
        zonaId: this.zonaId,
      });
      this.mesas.set(response);
    } catch (error) {
      await this.mostrarError(error);
      this.mesas.set([]);
    }
  }

  cambioMesa() {
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
      if (this.mesaId) {
        response = await this.resultadosService.apiResultadosEleccionMesaGet$Json({
          ...parametros,
          mesaId: this.mesaId,
        });
      } else if (this.zonaId) {
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
      } else if (this.provinciaId) {
        response = await this.resultadosService.apiResultadosEleccionProvinciaGet$Json({
          ...parametros,
          provinciaId: this.provinciaId,
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
  // ETIQUETAS DE GRÁFICOS
  obtenerNombreGrafico(item: NonNullable<ResultadoEleccionDto['resultados']>[number]): string {
    if (this.tipoCandidato === 'Alcalde' || this.tipoCandidato === 'Prefecto') {
      return item.candidato ?? 'Sin identificación';
    }

    return item.lista ?? 'Sin identificación';
  }

  // SUBTÍTULO CON LA LISTA ELECTORAL
  obtenerSubtituloGrafico(item: NonNullable<ResultadoEleccionDto['resultados']>[number]): string {
    if (this.tipoCandidato !== 'Alcalde' && this.tipoCandidato !== 'Prefecto') {
      return '';
    }

    return item.lista ?? '';
  }

  private truncarTexto(ctx: CanvasRenderingContext2D, texto: string, anchoMaximo: number): string {
    if (ctx.measureText(texto).width <= anchoMaximo) {
      return texto;
    }

    let textoCorto = texto;
    while (textoCorto.length > 0 && ctx.measureText(`${textoCorto}…`).width > anchoMaximo) {
      textoCorto = textoCorto.slice(0, -1);
    }
    return `${textoCorto}…`;
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
