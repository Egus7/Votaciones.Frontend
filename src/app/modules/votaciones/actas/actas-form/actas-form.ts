import { Component, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatInputModule, MatLabel } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { TipoCandidato } from '../../../../api/models/tipo-candidato';
import { EstadoActa } from '../../../../api/models/estado-acta';
import { Provincia } from '../../../../api/models/provincia';
import { Canton } from '../../../../api/models/canton';
import { Parroquia } from '../../../../api/models/parroquia';
import { Zona } from '../../../../api/models/zona';
import { MesaElectoralDto } from '../../../../api/models/mesa-electoral-dto';
import { ActaEleccion } from '../../../../api/models/acta-eleccion';
import { ActasService } from '../../../../api/services/actas.service';
import { MesasElectoralService } from '../../../../api/services/mesas-electoral.service';
import { EleccionContexto } from '../../../../core/services/eleccion-contexto';
import { ActivatedRoute, Router } from '@angular/router';
import { MensajeService } from '../../../../core/mensajes/mensaje-service';
import { ManejoMensajesError } from '../../../../core/mensajes/manejo-mensajes-error';
import { ActaDto } from '../../../../api/models/acta-dto';
import { Enlace, EnlaceSub } from '../../../../Config';
import { TIPO_CANDIDATO } from '../../../../api/models/tipo-candidato-array';
import { LugarVotacionService } from '../../../../core/services/lugar-votacion-service';
import { ActaDetalle } from '../../../../api/models/acta-detalle';

interface ActaDetalleView extends ActaDetalle {
  numeroLista?: number;
  nombreLista?: string | null;
  nombreCandidato?: string | null;
}
interface ActaEleccionView extends ActaEleccion {
  actaDetalles?: ActaDetalleView[];
}

@Component({
  selector: 'app-actas-form',
  imports: [
    MatIconModule,
    FormsModule,
    MatFormField,
    MatLabel,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './actas-form.html',
  styleUrl: './actas-form.css',
})
export class ActasForm implements OnInit {
  // MODO DEL FORMULARIO
  modo: 'crear' | 'ver' | 'editar' | 'validar' = 'crear';
  actaId: string | null = null;

  readonly cargando = signal(false);
  guardando = false;

  // INFORMACIÓN DEL ACTA
  eleccionId: string | undefined;
  // Ubicacion
  provinciaId: string | undefined;
  cantonId: string | undefined;
  parroquiaId: string | undefined;
  zonaId: string | undefined;
  mesaId: string | undefined;
  descripcionMesa: string | undefined;
  // Nombres para reconstruir la ubicación al editar/ver
  private provinciaNombre = '';
  private cantonNombre = '';
  private parroquiaNombre = '';
  private zonaNombre = '';
  private codigoMesa = '';
  // CATÁLOGOS
  readonly provincias = signal<Provincia[]>([]);
  readonly cantones = signal<Canton[]>([]);
  readonly parroquias = signal<Parroquia[]>([]);
  readonly zonas = signal<Zona[]>([]);
  readonly mesas = signal<MesaElectoralDto[]>([]);
  // ACTA
  acta: ActaEleccionView = {};

  constructor(
    private actasService: ActasService,
    private zonasService: LugarVotacionService,
    private mesasService: MesasElectoralService,
    private eleccionContexto: EleccionContexto,
    private route: ActivatedRoute,
    private router: Router,
    private swalMensaje: MensajeService,
    private manejoMensajeError: ManejoMensajesError,
  ) {
    this.actaId = this.route.snapshot.paramMap.get('id');
    this.determinarModo();
  }

  async ngOnInit(): Promise<void> {
    const eleccion = this.eleccionContexto.eleccion();
    if (!eleccion?.idEleccion) {
      void this.swalMensaje.error('Error', 'No se encontró la elección actual.');
      this.regresar();
      return;
    }

    this.eleccionId = eleccion.idEleccion;
    this.cargando.set(true);
    try {
      if (this.actaId) {
        await this.cargarActa();
      } else {
        this.acta = {
          eleccionId: eleccion?.idEleccion,
          votosNulos: 0,
          votosBlancos: 0,
          actaDetalles: [],
        }
        this.descripcionMesa = '';
        await this.cargarProvincias();
      }
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    } finally {
      this.cargando.set(false);
    }
  }
  // DETERMINAR MODO
  private determinarModo(): void {
    const url = this.router.url;
    if (url.includes('/new')) {
      this.modo = 'crear';
      return;
    }
    if (url.includes('/edit')) {
      this.modo = 'editar';
      return;
    }
    if (url.includes('/validate')) {
      this.modo = 'validar';
      return;
    }
    if (url.includes('/view')) {
      this.modo = 'ver';
      return;
    }
    this.modo = this.actaId ? 'ver' : 'crear';
  }
  // ESTADOS DEL FORMULARIO
  get esSoloLectura(): boolean {
    return this.modo === 'ver' || this.modo === 'validar';
  }
  get esEdicion(): boolean {
    return this.modo === 'editar';
  }

  // PROVINCIAS
  private async cargarProvincias(): Promise<void> {
    try {
      const response = await this.zonasService.provincias();
      this.provincias.set(response)
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
      this.provincias.set([]);
    }
  }

  // CAMBIO DE PROVINCIA
  async cambioProvincia(): Promise<void> {
    this.cantonId = undefined;
    this.parroquiaId = undefined;
    this.zonaId = undefined;
    this.mesaId = undefined;
    this.descripcionMesa = '';

    this.cantones.set([]);
    this.parroquias.set([]);
    this.zonas.set([]);
    this.mesas.set([]);

    if (!this.provinciaId) {
      return;
    }

    try {
      const response = await this.zonasService.cantones(this.provinciaId);
      this.cantones.set(response);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
      this.cantones.set([]);
    }
  }
  // CAMBIO DE CANTÓN
  async cambioCanton(): Promise<void> {
    this.parroquiaId = undefined;
    this.zonaId = undefined;
    this.mesaId = undefined;
    this.descripcionMesa = '';

    this.parroquias.set([]);
    this.zonas.set([]);
    this.mesas.set([]);

    if (!this.cantonId) {
      return;
    }

    try {
      const response = await this.zonasService.parroquias(this.cantonId);
      this.parroquias.set(response);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
      this.parroquias.set([]);
    }
  }
  // CAMBIO DE PARROQUIA
  async cambioParroquia(): Promise<void> {
    this.zonaId = undefined;
    this.mesaId = undefined;
    this.descripcionMesa = '';

    this.zonas.set([]);
    this.mesas.set([]);

    if (!this.parroquiaId) {
      return;
    }

    try {
      const response = await this.zonasService.zonas(this.parroquiaId);
      this.zonas.set(response);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
      this.zonas.set([]);
    }
  }
  // CAMBIO DE ZONA
  async cambioZona(): Promise<void> {
    this.mesaId = undefined;
    this.acta.tipoCandidato = undefined;
    this.descripcionMesa = '';
    this.mesas.set([]);
    this.acta.actaDetalles = [];

    if (!this.zonaId || !this.eleccionId) {
      return;
    }
  }
  cambioMesa(): void {
    this.descripcionMesa = '';
    if (!this.mesaId) {
      return;
    }
    const mesa = this.mesas().find((x) => x.idMesaElectoral === this.mesaId);
    if (!mesa) {
      return;
    }
    this.descripcionMesa = mesa.descripcion ?? '';
    // ID que se enviará al backend
    this.acta.mesaElectoralId = mesa.idMesaElectoral;
  }
  //cambioTipoCandidato
  async cambioTipoCandidato() {
    if (this.actaId) {
      return;
    }
    this.acta.actaDetalles = [];

    if (!this.acta.tipoCandidato) {
      return;
    }

    try {
      const response = await this.mesasService.apiMesasElectoralDisponiblePorZonaGet$Json({
        eleccionId: this.eleccionId,
        zonaId: this.zonaId,
        tipoCandidato: this.acta.tipoCandidato!,
      });
      this.mesas.set(response ?? []);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
      this.mesas.set([]);
    }

    await this.cargarListasCandidatos();
  }

  // NUEVO ACTA - CARGA LOS CANDIDATOS O LISTAS
  private async cargarListasCandidatos(): Promise<void> {
    if (!this.eleccionId || !this.acta.tipoCandidato || !this.provinciaId ||
        !this.cantonId ||  !this.parroquiaId) {
      return;
    }

    try {
      const tipo = this.acta.tipoCandidato;

      const response =
        await this.actasService.apiActasCandidatosListasRegistroGet$Json({
          eleccionId: this.eleccionId,
          tipoCandidato: tipo,
          provinciaId: this.provinciaId,
          cantonId: this.cantonId,
          parroquiaId: this.parroquiaId,
        });
      this.acta.actaDetalles = response ?? [];

    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
      this.acta.actaDetalles = [];
    }
  }

  // CARGAR ACTA
  private async cargarActa(): Promise<void> {
    if (!this.actaId) {
      return;
    }
    this.cargando.set(true);

    try {
      const response = await this.actasService.apiActasIdGet$Json({
        id: this.actaId,
      });
      this.acta = this.mapearDtoToActa(response!) ?? [];
      // Guardar nombres de ubicación
      this.provinciaNombre = response.provincia ?? '';
      this.cantonNombre = response.canton ?? '';
      this.parroquiaNombre = response.parroquia ?? '';
      this.zonaNombre = response.zona ?? '';
      this.codigoMesa = response.codigoMesa ?? '';
      // Reconstruir la ubicación
      await this.cargarProvincias();
      await this.cargarUbicacionActa();
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    } finally {
      this.cargando.set(false);
    }
  }
  // MAPEAR ACTA
  private mapearDtoToActa(dto: ActaDto): ActaEleccionView {
    const eleccion = this.eleccionContexto.eleccion();
    return {
      idActa: dto.idActa,
      eleccionId: eleccion?.idEleccion,
      mesaElectoralId: this.mesaId,
      fechaRegistro: dto.fechaRegistro,
      votosBlancos: dto.votosBlancos,
      votosNulos: dto.votosNulos,
      totalVotos: dto.totalVotos,
      estado: dto.estado,
      tipoCandidato: dto.tipoCandidato,
      actaDetalles:
        dto.actasDetalle?.map((actaDetalle) => ({
          candidatoId: actaDetalle.candidatoId!,
          listaElectoralId: actaDetalle.listaElectoralId!,
          votos: actaDetalle.votos!,
          // Solo información para la UI
          numeroLista: actaDetalle.numeroLista!,
          nombreLista: actaDetalle.nombreLista!,
          nombreCandidato: actaDetalle.nombreCandidato!,
        })) ?? [],
    };
  }

  // CARGAR GEOGRAFÍA DEL ACTA
  private async cargarUbicacionActa(): Promise<void> {
    if (!this.actaId || !this.provinciaNombre) {
      return;
    }
    try {
      // =================== Provincia =================================
      const provincia = this.provincias().find((x) => x.nombreProvincia === this.provinciaNombre);
      if (!provincia?.idProvincia) {
        return;
      }
      this.provinciaId = provincia.idProvincia;
      // =================== Cantones =================================
      this.cantones.set(await this.zonasService.cantones(this.provinciaId));
      const canton = this.cantones().find((x) => x.nombreCanton === this.cantonNombre);
      if (!canton?.idCanton) {
        return;
      }
      this.cantonId = canton.idCanton;
      // =================== Parroquias =================================
      this.parroquias.set(await this.zonasService.parroquias(this.cantonId));
      const parroquia = this.parroquias().find((x) => x.nombreParroquia === this.parroquiaNombre);
      if (!parroquia?.idParroquia) {
        return;
      }
      this.parroquiaId = parroquia.idParroquia;
      // =================== Zonas =================================
      this.zonas.set(await this.zonasService.zonas(this.parroquiaId));
      const zona = this.zonas().find((x) => x.nombreZona === this.zonaNombre);
      if (!zona?.idZona) {
        return;
      }
      this.zonaId = zona.idZona;
      // =================== Mesas =================================
      if (!this.eleccionId) {
        return;
      }
      this.mesas.set(
        await this.mesasService.apiMesasElectoralZonaGet$Json({
          eleccionId: this.eleccionId,
          zonaId: this.zonaId,
        }),
      );
      // BUSCAR LA MESA POR CÓDIGO
      const mesa = this.mesas().find((x) => x.codigoMesa === this.codigoMesa);
      if (!mesa?.idMesaElectoral) {
        return;
      }
      this.mesaId = mesa.idMesaElectoral;
      // Actualizar el objeto que se enviará al backend
      this.acta.mesaElectoralId = mesa.idMesaElectoral;
      this.descripcionMesa = mesa.descripcion ?? '';

    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    }
  }

  // TOTAL DE VOTOS
  get totalVotos(): number {
    const votosDetalle =
      this.acta.actaDetalles?.reduce((total, detalle) => total + (detalle.votos ?? 0), 0) ?? 0;
    return votosDetalle + (this.acta.votosBlancos ?? 0) + (this.acta.votosNulos ?? 0);
  }

  // GUARDAR FORMULARIO
  guardarFormulario(): void {
    if (this.guardando) {
      return;
    }
    // En modo ver no se guarda nada.
    if (this.modo === 'ver') {
      return;
    }
    // En modo validar ejecutamos la validación.
    if (this.modo === 'validar') {
      void this.validarActa();
      return;
    }
    // ELECCIÓN
    if (!this.eleccionId) {
      void this.swalMensaje.advertencia('Datos incompletos', 'No se encontró la elección actual.');
      return;
    }
    // UBICACIÓN
    if (!this.provinciaId || !this.cantonId || !this.parroquiaId || !this.zonaId || !this.mesaId) {
      void this.swalMensaje.advertencia(
        'Datos incompletos',
        'Debe seleccionar la zona y la mesa electoral.',
      );
      return;
    }
    // TIPO DE CANDIDATO
    if (!this.acta.tipoCandidato) {
      void this.swalMensaje.advertencia(
        'Datos incompletos', 'Debe seleccionar el tipo de candidato para la acta.',);
      return;
    }
    //VOTOS NULOS Y BLANCOS
    if (this.acta.votosBlancos! < 0 || this.acta.votosNulos! < 0) {
      void this.swalMensaje.advertencia('Datos inválidos',
        'El voto en blanco o nulo no pueden ser negativos');
      return;
    }
    // DETALLES
    if (!this.acta.actaDetalles || this.acta.actaDetalles.length === 0) {
      void this.swalMensaje.advertencia(
        'Datos incompletos', 'No existen resultados para registrar.',);
      return;
    }
    // VOTOS NEGATIVOS
    const votosInvalidos = this.acta.actaDetalles.some(
      (detalle) => (detalle.votos ?? 0) < 0);
    if (votosInvalidos) {
      void this.swalMensaje.advertencia('Datos inválidos',
        'Los votos no pueden ser negativos.');
      return;
    }
    // AL MENOS UN CANDIDATO O LISTA DEBE TENER VOTOS
    const existeVoto = this.acta.actaDetalles.some(
      (detalle) => (detalle.votos ?? 0) > 0
    );
    if (!existeVoto) {
      void this.swalMensaje.advertencia('Datos inválidos',
        'Debe registrar al menos un voto para un candidato o lista.');
      return;
    }
    void this.guardarActa();
  }

  // GUARDAR / ACTUALIZAR ACTA
  private async guardarActa(): Promise<void> {
    this.guardando = true;

    try {
      let response;

      if (this.modo === 'editar' && this.actaId) {
        response = await this.actasService.apiActasIdPut({
          id: this.actaId,
          body: this.acta,
        });
        await this.swalMensaje.exito('Éxito', response!);
        await this.router.navigate([`${Enlace.Votaciones}/${EnlaceSub.Actas}/view`, this.actaId!,
        ]);
      } else {
        response = await this.actasService.apiActasPost$Json({
          body: this.acta,
        });
        await this.swalMensaje.exito('Éxito', 'Acta registrada correctamente.');
        await this.router.navigate([`${Enlace.Votaciones}/${EnlaceSub.Actas}/view`, response?.idActa!]);
      }
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    } finally {
      this.guardando = false;
    }
  }
  // VALIDAR ACTA
  private async validarActa(): Promise<void> {
    if (!this.actaId) {
      return;
    }
    this.guardando = true;

    try {
      const response = await this.actasService.apiActasCambiarEstadoIdPut({
        id: this.actaId,
        nuevoEstado: this.acta.estado!,
      });
      await this.swalMensaje.exito('Éxito', response!);
      await this.router.navigate([`${Enlace.Votaciones}/${EnlaceSub.Actas}`]);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    } finally {
      this.guardando = false;
    }
  }

  // REGRESAR
  regresar(): void {
    void this.router.navigate([`${Enlace.Votaciones}/${EnlaceSub.Actas}`]);
  }
  cancelarFormulario(): void {
    this.regresar();
  }
  // TEXTOS
  nombreTipoCandidato(tipo: TipoCandidato): string {
    switch (tipo) {
      case 'ConcejalUrbano':
        return 'Concejal urbano';
      case 'ConcejalRural':
        return 'Concejal rural';
      default:
        return tipo;
    }
  }
  nombreEstadoActa(estado: EstadoActa | undefined): string {
    switch (estado) {
      case 'Registrada':
        return 'Registrada';
      case 'EnRevision':
        return 'En revisión';
      case 'ConInconsistencia':
        return 'Con inconsistencia';
      case 'Validada':
        return 'Validada';
      case 'Anulada':
        return 'Anulada';
      default:
        return estado ?? '—';
    }
  }

  protected readonly tiposCandidato = TIPO_CANDIDATO;
}

