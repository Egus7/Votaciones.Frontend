import { Component, OnInit, signal } from '@angular/core';
import { ListaElectoral } from '../../../api/models/lista-electoral';
import { Jurisdiccion } from '../../../api/models/jurisdiccion';
import { ConfigPage, Enlace, EnlaceSub } from '../../../Config';
import { ListasElectoralService } from '../../../api/services/listas-electoral.service';
import { Router } from '@angular/router';
import { MensajeService } from '../../../core/mensajes/mensaje-service';
import { ManejoMensajesError } from '../../../core/mensajes/manejo-mensajes-error';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Paginacion } from '../../../shared/paginacion/paginacion';
import { JURISDICCION } from '../../../api/models/jurisdiccion-array';

@Component({
  selector: 'app-listas-electoral',
  imports: [FormsModule, MatButton, MatIcon, Paginacion],
  templateUrl: './listas-electoral.html',
  styleUrl: './listas-electoral.css',
})
export class ListasElectoral implements OnInit {
  readonly listas = signal<ListaElectoral[]>([]);
  readonly cargando = signal(false);
  // Filtros
  busqueda = '';
  jurisdiccion: Jurisdiccion | undefined = undefined;
  // Paginación
  paginaActual = ConfigPage.page;
  pageSize = ConfigPage.RowPorPagina;
  totalRegistros = 0;
  totalPages = 0;

  constructor(
    private listaElectoralService: ListasElectoralService,
    private router: Router,
    private swalMensaje: MensajeService,
    private manejoMensajeError: ManejoMensajesError,
  ) {}

  async ngOnInit() {
    void this.cargarListasElectoral();
  }

  async cargarListasElectoral(): Promise<void> {
    this.cargando.set(true);

    try {
      const response = await this.listaElectoralService.apiListasElectoralPaginacionGet$Json({
        pagina: this.paginaActual,
        pageSize: this.pageSize,
        buscar: this.busqueda,
        jurisdiccion: this.jurisdiccion,
      });

      this.listas.set(response.items ?? []);
      this.paginaActual = response.pageActual ?? this.paginaActual;
      this.pageSize = response.pageSize ?? this.pageSize;
      this.totalRegistros = response.totalRegistros ?? 0;
      this.totalPages = response.totalPages ?? 0;
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      void this.swalMensaje.error('Error', mensajeError);
      this.listas.set([]);
      this.totalRegistros = 0;
      this.totalPages = 0;
    } finally {
      this.cargando.set(false);
    }
  }

  nuevaLista(): void {
    void this.router.navigate([`${Enlace.Votaciones}/${EnlaceSub.Listas}/new`]);
  }

  editarLista(idLista: string | undefined): void {
    if (!idLista) {
      return;
    }
    void this.router.navigate([`${Enlace.Votaciones}/${EnlaceSub.Listas}/edit`, idLista]);
  }

  buscar(): void {
    this.paginaActual = ConfigPage.page;
    void this.cargarListasElectoral();
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.jurisdiccion = undefined;
    this.buscar();
  }
  cambiarPagina(pagina: number): void {
    this.paginaActual = pagina;
    void this.cargarListasElectoral();
  }

  async cambiarEstadoLista(lista: ListaElectoral): Promise<void> {
    if (!lista.idListaElectoral) {
      return;
    }

    const activar = !lista.activo;
    const confirmado = await this.swalMensaje.confirmar(
      activar ? '¿Activar lista electoral?' : '¿Suspender lista electoral?',
      activar
        ? 'La lista electoral quedará activa y podrá ser utilizada en la elección.'
        : 'La lista electoral quedará suspendida y no podrá ser utilizada.',
    );
    if (!confirmado) {
      return;
    }

    try {
      const response = await this.listaElectoralService.apiListasElectoralCambiarEstadoIdPut({
        id: lista.idListaElectoral,
      });
      // Actualiza inmediatamente la fila en pantalla
      void this.cargarListasElectoral();
      await this.swalMensaje.exito('Éxito', response!);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    }
  }

  protected readonly jurisdicciones = JURISDICCION;
}
