import { Component, effect, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EleccionContexto } from '../../../core/services/eleccion-contexto';
import { CandidatoDto } from '../../../api/models/candidato-dto';
import { CandidatosService } from '../../../api/services/candidatos.service';
import { ConfigPage, Enlace, EnlaceSub } from '../../../Config';
import { TipoCandidato } from '../../../api/models/tipo-candidato';
import { FormsModule } from '@angular/forms';
import { ListaElectoral } from '../../../api/models/lista-electoral';
import { ListasElectoralService } from '../../../api/services/listas-electoral.service';
import { Paginacion } from '../../../shared/paginacion/paginacion';
import { TIPO_CANDIDATO } from '../../../api/models/tipo-candidato-array';
import { Router, RouterLink } from '@angular/router';
import { MensajeService } from '../../../core/mensajes/mensaje-service';
import { ManejoMensajesError } from '../../../core/mensajes/manejo-mensajes-error';

@Component({
  selector: 'app-candidatos',
  imports: [MatButtonModule, MatIconModule, FormsModule, Paginacion, RouterLink],
  templateUrl: './candidatos.html',
  styleUrl: './candidatos.css',
})
export class Candidatos {
  readonly candidatos = signal<CandidatoDto[]>([]);
  readonly listas = signal<ListaElectoral[]>([]);
  readonly cargando = signal(false);

  // Filtros
  busqueda = '';
  tipoCandidato: TipoCandidato | undefined = undefined;
  listaElectoralId = '';
  // Paginación
  paginaActual = ConfigPage.page;
  pageSize = ConfigPage.RowPorPagina;
  totalRegistros = 0;
  totalPages = 0;

  constructor(
    private candidatosService: CandidatosService,
    private listaElectoralService: ListasElectoralService,
    private eleccionContexto: EleccionContexto,
    private router: Router,
    private swalMensaje: MensajeService,
    private manejoMensajeError: ManejoMensajesError,
  ) {
    effect(() => {
      const eleccion = this.eleccionContexto.eleccion();
      if (!eleccion?.idEleccion) {
        this.candidatos.set([]);
        return;
      }
      this.paginaActual = ConfigPage.page;
      void this.cargarCandidatos(eleccion.idEleccion);
      void this.cargarListas();
    });
  }

  async cargarCandidatos(eleccionId: string): Promise<void> {
    this.cargando.set(true);

    try {
      const response = await this.candidatosService.apiCandidatosPaginacionGet$Json({
        eleccionId: eleccionId,
        pagina: this.paginaActual,
        pageSize: this.pageSize,
        busqueda: this.busqueda!,
        tipoCandidato: this.tipoCandidato!,
        listaElectoralId: this.listaElectoralId!,
      });

      this.candidatos.set(response.items ?? []);
      this.paginaActual = response.pageActual ?? this.paginaActual;
      this.pageSize = response.pageSize ?? this.pageSize;
      this.totalRegistros = response.totalRegistros ?? 0;
      this.totalPages = response.totalPages ?? 0;
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      void this.swalMensaje.error('Error', mensajeError);
      this.candidatos.set([]);
      this.totalRegistros = 0;
      this.totalPages = 0;
    } finally {
      this.cargando.set(false);
    }
  }

  async cargarListas(): Promise<void> {
    try {
      const response = await this.listaElectoralService.apiListasElectoralPaginacionGet$Json({});
      this.listas.set(response.items ?? []);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      void this.swalMensaje.error('Error', mensajeError);
      this.listas.set([]);
    }
  }

  nuevoCandidato(): void {
    void this.router.navigate([`${Enlace.Votaciones}/${EnlaceSub.Candidatos}/new`]);
  }

  editarCandidato(idCandidato: string | undefined): void {
    if (!idCandidato) {
      return;
    }
    void this.router.navigate([`${Enlace.Votaciones}/${EnlaceSub.Candidatos}/edit`, idCandidato]);
  }

  buscar(): void {
    this.paginaActual = ConfigPage.page;
    const eleccion = this.eleccionContexto.eleccion();
    if (!eleccion?.idEleccion) {
      this.candidatos.set([]);
      return;
    }
    void this.cargarCandidatos(eleccion.idEleccion);
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.tipoCandidato = undefined;
    this.listaElectoralId = '';

    this.buscar();
  }

  cambiarPagina(pagina: number): void {
    this.paginaActual = pagina;
    const eleccion = this.eleccionContexto.eleccion();

    if (!eleccion?.idEleccion) {
      return;
    }
    void this.cargarCandidatos(eleccion.idEleccion);
  }

  async cambiarEstadoCandidato(candidato: CandidatoDto): Promise<void> {
    if (!candidato.idCandidato) {
      return;
    }

    const activar = !candidato.activo;
    const confirmado = await this.swalMensaje.confirmar(
      activar ? '¿Activar candidato?' : '¿Desactivar candidato?',
      activar
        ? 'El candidato quedará activo y podrá ser utilizado en la elección.'
        : 'El candidato quedará inactivo y no podrá ser utilizado.',
    );
    if (!confirmado) {
      return;
    }

    try {
      const response = await this.candidatosService.apiCandidatosCambiarEstadoIdPut({
        id: candidato.idCandidato,
      });
      // Actualiza inmediatamente la fila en pantalla
      this.candidatos.update((lista) =>
        lista.map((x) => (x.idCandidato === candidato.idCandidato ? { ...x, activo: activar } : x)),
      );
      await this.swalMensaje.exito('Éxito', response!);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    }
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

  protected readonly tiposCandidato = TIPO_CANDIDATO;
  protected readonly Enlace = Enlace;
  protected readonly EnlaceSub = EnlaceSub;
}
