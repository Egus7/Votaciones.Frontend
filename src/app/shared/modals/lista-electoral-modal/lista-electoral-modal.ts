import { Component, Input, OnInit, signal } from '@angular/core';
import { ListaElectoral } from '../../../api/models/lista-electoral';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ListasElectoralService } from '../../../api/services/listas-electoral.service';
import { ConfigPage } from '../../../Config';
import { Paginacion } from '../../paginacion/paginacion';
import { MensajeService } from '../../../core/mensajes/mensaje-service';
import { ManejoMensajesError } from '../../../core/mensajes/manejo-mensajes-error';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatCheckbox } from '@angular/material/checkbox';

@Component({
  selector: 'app-lista-electoral-modal',
  imports: [
    MatIconModule,
    FormsModule,
    Paginacion,
    MatButton,
    MatFormField,
    MatLabel,
    MatInput,
    MatCheckbox,
  ],
  templateUrl: './lista-electoral-modal.html',
  styleUrl: './lista-electoral-modal.css',
})
export class ListaElectoralModal implements OnInit {
  @Input() listasSeleccionadas: ListaElectoral[] = [];

  listas: ListaElectoral[] = [];

  busqueda = '';
  seleccionadas = new Map<string, ListaElectoral>();

  paginaActual = ConfigPage.page;
  pageSize = ConfigPage.RowPorPagina;
  totalRegistros = 0;
  totalPages = 0;

  readonly cargando = signal(false);

  constructor(
    private listaElectoralService: ListasElectoralService,
    private swalMensaje: MensajeService,
    private manejoMensajeError: ManejoMensajesError,
  ) {}

  ngOnInit() {
    this.inicializarSeleccionadas();
    void this.cargarListas();
  }

  private inicializarSeleccionadas(): void {
    this.seleccionadas.clear();

    for (const lista of this.listasSeleccionadas) {
      if (lista.idListaElectoral) {
        this.seleccionadas.set(lista.idListaElectoral, lista);
      }
    }
  }

  private sincronizarSeleccionadasConPagina(): void {
    for (const lista of this.listas) {
      const id = lista.idListaElectoral;

      if (id && this.seleccionadas.has(id)) {
        this.seleccionadas.set(id, lista);
      }
    }
  }

  async cargarListas() {
    this.cargando.set(true);

    try {
      const response = await this.listaElectoralService.apiListasElectoralPaginacionGet$Json({
        pagina: this.paginaActual,
        pageSize: this.pageSize,
        buscar: this.busqueda,
      });

      this.listas = response.items ?? [];
      this.paginaActual = response.pageActual ?? this.paginaActual;
      this.pageSize = response.pageSize ?? this.pageSize;
      this.totalRegistros = response.totalRegistros ?? 0;
      this.totalPages = response.totalPages ?? 0;
      this.sincronizarSeleccionadasConPagina();
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      void this.swalMensaje.error('Error', mensajeError);
      this.listas = [];
      this.totalRegistros = 0;
      this.totalPages = 0;
    } finally {
      this.cargando.set(false);
    }
  }

  buscar(): void {
    this.paginaActual = ConfigPage.page;
    void this.cargarListas();
  }
  limpiarBusqueda(): void {
    this.busqueda = '';
    this.paginaActual = ConfigPage.page;
    void this.cargarListas();
  }
  cambiarPagina(pagina: number): void {
    this.paginaActual = pagina;
    void this.cargarListas();
  }

  seleccionar(lista: ListaElectoral): void {
    const id = lista.idListaElectoral;
    if (!id) {
      return;
    }

    if (this.seleccionadas.has(id)) {
      this.seleccionadas.delete(id);
    } else {
      this.seleccionadas.set(id, lista);
    }
  }
  estaSeleccionada(id: string | undefined): boolean {
    if (!id) {
      return false;
    }
    return this.seleccionadas.has(id);
  }
  obtenerSeleccionadas(): ListaElectoral[] {
    return Array.from(this.seleccionadas.values());
  }
}
