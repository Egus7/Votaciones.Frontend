import { Component, effect, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { MatFormField, MatLabel } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { Paginacion } from '../../../shared/paginacion/paginacion';
import { ActaDto } from '../../../api/models/acta-dto';
import { TipoCandidato } from '../../../api/models/tipo-candidato';
import { EstadoActa } from '../../../api/models/estado-acta';
import { ConfigPage, Enlace, EnlaceSub } from '../../../Config';
import { ActasService } from '../../../api/services/actas.service';
import { MesasElectoralService } from '../../../api/services/mesas-electoral.service';
import { EleccionContexto } from '../../../core/services/eleccion-contexto';
import { MensajeService } from '../../../core/mensajes/mensaje-service';
import { ManejoMensajesError } from '../../../core/mensajes/manejo-mensajes-error';
import { TIPO_CANDIDATO } from '../../../api/models/tipo-candidato-array';
import { ESTADO_ACTA } from '../../../api/models/estado-acta-array';
import { MesaElectoralDto } from '../../../api/models/mesa-electoral-dto';
import { Provincia } from '../../../api/models/provincia';
import { Canton } from '../../../api/models/canton';
import { Parroquia } from '../../../api/models/parroquia';
import { Zona } from '../../../api/models/zona';
import { LugarVotacionService } from '../../../core/services/lugar-votacion-service';

@Component({
  selector: 'app-actas',
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterLink,
    MatFormField,
    MatLabel,
    MatSelectModule,
    FormsModule,
    Paginacion,
  ],
  templateUrl: './actas.html',
  styleUrl: './actas.css',
})
export class Actas {
  // Datos
  readonly actas = signal<ActaDto[]>([]);
  readonly provincias = signal<Provincia[]>([]);
  readonly cantones = signal<Canton[]>([]);
  readonly parroquias = signal<Parroquia[]>([]);
  readonly zonas = signal<Zona[]>([]);
  readonly mesas = signal<MesaElectoralDto[]>([]);
  readonly cargando = signal(false);
  // Filtros
  provinciaId: string | undefined = undefined;
  cantonId: string | undefined = undefined;
  parroquiaId: string | undefined = undefined;
  zonaId: string | undefined = undefined;
  mesaId: string | undefined = undefined;
  // filtros tipos
  tipoCandidato: TipoCandidato | undefined = undefined;
  estadoActa: EstadoActa | undefined = undefined;
  // Paginación
  paginaActual = ConfigPage.page;
  pageSize = ConfigPage.RowPorPagina;
  totalRegistros = 0;
  totalPages = 0;

  constructor(
    private actasService: ActasService,
    private zonasService: LugarVotacionService,
    private mesasService: MesasElectoralService,
    private eleccionContexto: EleccionContexto,
    private router: Router,
    private swalMensaje: MensajeService,
    private manejoMensajeError: ManejoMensajesError,
  ) {
    effect(() => {
      const eleccion = this.eleccionContexto.eleccion();

      if (!eleccion?.idEleccion) {
        this.actas.set([]);
        return;
      }

      this.paginaActual = ConfigPage.page;

      void this.cargarActas(eleccion.idEleccion);
      void this.cargarProvincias();
    });
  }

  // Cargar actas
  async cargarActas(eleccionId: string): Promise<void> {
    this.cargando.set(true);

    try {
      const response = await this.actasService.apiActasPaginacionGet$Json({
        eleccionId: eleccionId,
        pagina: this.paginaActual,
        pageSize: this.pageSize,
        provinciaId: this.provinciaId,
        cantonId: this.cantonId,
        parroquiaId: this.parroquiaId,
        zonaId: this.zonaId,
        mesaId: this.mesaId!,
        tipoCandidato: this.tipoCandidato!,
        estadoActa: this.estadoActa!,
      });

      this.actas.set(response.items ?? []);
      this.paginaActual = response.pageActual ?? this.paginaActual;
      this.pageSize = response.pageSize ?? this.pageSize;
      this.totalRegistros = response.totalRegistros ?? 0;
      this.totalPages = response.totalPages ?? 0;
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      void this.swalMensaje.error('Error', mensajeError);
      this.actas.set([]);
      this.totalRegistros = 0;
      this.totalPages = 0;
    } finally {
      this.cargando.set(false);
    }
  }
  // PROVINCIAS
  async cargarProvincias(): Promise<void> {
    try {
      const response = await this.zonasService.provincias();
      this.provincias.set(response ?? []);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      void this.swalMensaje.error('Error', mensajeError);
      this.provincias.set([]);
    }
  }
  // CAMBIO DE PROVINCIA
  async cambioProvincia(): Promise<void> {
    // Limpiar niveles inferiores
    this.cantonId = undefined;
    this.parroquiaId = undefined;
    this.zonaId = undefined;
    this.mesaId = undefined;

    this.cantones.set([]);
    this.parroquias.set([]);
    this.zonas.set([]);
    this.mesas.set([]);

    if (!this.provinciaId) {
      return;
    }

    try {
      const response = await this.zonasService.cantones(this.provinciaId);
      this.cantones.set(response ?? []);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      void this.swalMensaje.error('Error', mensajeError);
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

    if (!this.cantonId) {
      return;
    }

    try {
      const response = await this.zonasService.parroquias(this.cantonId);
      this.parroquias.set(response ?? []);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      void this.swalMensaje.error('Error', mensajeError);
      this.parroquias.set([]);
    }
  }
  // CAMBIO DE PARROQUIA
  async cambioParroquia(): Promise<void> {
    this.zonaId = undefined;
    this.mesaId = undefined;

    this.zonas.set([]);
    this.mesas.set([]);

    if (!this.parroquiaId) {
      return;
    }

    try {
      const response = await this.zonasService.zonas(this.parroquiaId);

      this.zonas.set(response ?? []);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      void this.swalMensaje.error('Error', mensajeError);
      this.zonas.set([]);
    }
  }
  // CAMBIO DE ZONA
  async cambioZona(): Promise<void> {
    this.mesaId = undefined;
    this.mesas.set([]);

    if (!this.zonaId) {
      return;
    }

    const eleccion = this.eleccionContexto.eleccion();
    if (!eleccion?.idEleccion) {
      return;
    }

    try {
      const response = await this.mesasService.apiMesasElectoralZonaGet$Json({
        eleccionId: eleccion.idEleccion,
        zonaId: this.zonaId,
      });

      this.mesas.set(response ?? []);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      void this.swalMensaje.error('Error', mensajeError);
      this.mesas.set([]);
    }
  }

  //Acciones
  nuevaActa(): void {
    void this.router.navigate([`${Enlace.Votaciones}/${EnlaceSub.Actas}/new`]);
  }
  verActa(idActa: string | undefined): void {
    if (!idActa) {
      return;
    }
    void this.router.navigate([`${Enlace.Votaciones}/${EnlaceSub.Actas}/view`, idActa]);
  }
  editarActa(idActa: string | undefined): void {
    if (!idActa) {
      return;
    }

    void this.router.navigate([`${Enlace.Votaciones}/${EnlaceSub.Actas}/edit`, idActa]);
  }
  // Validar
  validarActa(idActa: string | undefined): void {
    if (!idActa) {
      return;
    }
    void this.router.navigate([`${Enlace.Votaciones}/${EnlaceSub.Actas}/validate`, idActa]);
  }
  // Filtros
  buscar(): void {
    this.paginaActual = ConfigPage.page;
    const eleccion = this.eleccionContexto.eleccion();
    if (!eleccion?.idEleccion) {
      this.actas.set([]);
      return;
    }
    void this.cargarActas(eleccion.idEleccion);
  }

  limpiarFiltros(): void {
    this.provinciaId = undefined;
    this.cantonId = undefined;
    this.parroquiaId = undefined;
    this.zonaId = undefined;
    this.mesaId = undefined;
    this.tipoCandidato = undefined;
    this.estadoActa = undefined;

    this.buscar();
  }

  cambiarPagina(pagina: number): void {
    this.paginaActual = pagina;

    const eleccion = this.eleccionContexto.eleccion();
    if (!eleccion?.idEleccion) {
      return;
    }
    void this.cargarActas(eleccion.idEleccion);
  }
  // Permisos de acciones según estado
  puedeEditar(acta: ActaDto): boolean {
    return (
      acta.estado === 'Registrada' ||
      acta.estado === 'EnRevision' ||
      acta.estado === 'ConInconsistencia'
    );
  }

  puedeValidar(acta: ActaDto): boolean {
    return (
      acta.estado === 'Registrada' ||
      acta.estado === 'EnRevision' ||
      acta.estado === 'ConInconsistencia'
    );
  }

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

  nombreEstadoActa(estado: EstadoActa): string {
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
        return estado;
    }
  }

  protected readonly tiposCandidato = TIPO_CANDIDATO;
  protected readonly estadosActa = ESTADO_ACTA;
}
