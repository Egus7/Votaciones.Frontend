import { Component, effect, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Paginacion } from '../../../shared/paginacion/paginacion';
import { MatButtonModule } from '@angular/material/button';
import { MesaElectoralDto } from '../../../api/models/mesa-electoral-dto';
import { TipoMesa } from '../../../api/models/tipo-mesa';
import { ConfigPage, Enlace, EnlaceSub } from '../../../Config';
import { FormsModule } from '@angular/forms';
import { MesasElectoralService } from '../../../api/services/mesas-electoral.service';
import { EleccionContexto } from '../../../core/services/eleccion-contexto';
import { Router, RouterLink } from '@angular/router';
import { MensajeService } from '../../../core/mensajes/mensaje-service';
import { ManejoMensajesError } from '../../../core/mensajes/manejo-mensajes-error';
import { MatFormField, MatInputModule, MatLabel } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-mesas-electoral',
  imports: [
    FormsModule,
    MatIconModule,
    MatButtonModule,
    Paginacion,
    RouterLink,
    MatFormField,
    MatLabel,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './mesas-electoral.html',
  styleUrl: './mesas-electoral.css',
})
export class MesasElectoral {
  readonly mesas = signal<MesaElectoralDto[]>([]);
  readonly cargando = signal(false);
  // Filtros
  busqueda = '';
  tipoMesa: TipoMesa | undefined = undefined;
  activa = '';
  // Paginación
  paginaActual = ConfigPage.page;
  pageSize = ConfigPage.RowPorPagina;
  totalRegistros = 0;
  totalPages = 0;

  constructor(
    private mesasService: MesasElectoralService,
    private eleccionContexto: EleccionContexto,
    private router: Router,
    private swalMensaje: MensajeService,
    private manejoMensajeError: ManejoMensajesError,
  ) {
    effect(() => {
      const eleccion = this.eleccionContexto.eleccion();
      if (!eleccion?.idEleccion) {
        this.mesas.set([]);
        return;
      }
      this.paginaActual = ConfigPage.page;
      void this.cargarMesas(eleccion.idEleccion);
    });
  }

  async cargarMesas(eleccionId: string): Promise<void> {
    this.cargando.set(true);

    try {
      const response = await this.mesasService.apiMesasElectoralPaginacionGet$Json({
        eleccionId: eleccionId,
        pagina: this.paginaActual,
        pageSize: this.pageSize,
        busqueda: this.busqueda!,
        tipoMesa: this.tipoMesa,
      });

      this.mesas.set(response.items ?? []);
      this.paginaActual = response.pageActual ?? this.paginaActual;
      this.pageSize = response.pageSize ?? this.pageSize;
      this.totalRegistros = response.totalRegistros ?? 0;
      this.totalPages = response.totalPages ?? 0;
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      void this.swalMensaje.error('Error', mensajeError);
      this.mesas.set([]);
      this.totalRegistros = 0;
      this.totalPages = 0;
    } finally {
      this.cargando.set(false);
    }
  }

  nuevaMesa(): void {
    void this.router.navigate([`${Enlace.Votaciones}/${EnlaceSub.Mesas}/new`]);
  }

  editarMesa(idMesa: string | undefined): void {
    if (!idMesa) {
      return;
    }
    void this.router.navigate([`${Enlace.Votaciones}/${EnlaceSub.Mesas}/edit`, idMesa]);
  }

  buscar(): void {
    this.paginaActual = ConfigPage.page;
    const eleccion = this.eleccionContexto.eleccion();
    if (!eleccion?.idEleccion) {
      this.mesas.set([]);
      return;
    }
    void this.cargarMesas(eleccion.idEleccion);
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.tipoMesa = undefined;

    this.buscar();
  }

  cambiarPagina(pagina: number): void {
    this.paginaActual = pagina;
    const eleccion = this.eleccionContexto.eleccion();

    if (!eleccion?.idEleccion) {
      return;
    }
    void this.cargarMesas(eleccion.idEleccion);
  }

  async cambiarEstadoMesa(mesa: MesaElectoralDto): Promise<void> {
    if (!mesa.idMesaElectoral) {
      return;
    }

    const activar = !mesa.activa;
    const confirmado = await this.swalMensaje.confirmar(
      activar ? '¿Activar mesa?' : '¿Cerrar mesa?',
      activar
        ? 'La mesa electoral quedará activa y podrá ser utilizado en la elección.'
        : 'La mesa electoral quedará cerrada y no podrá ser utilizada.',
    );
    if (!confirmado) {
      return;
    }

    try {
      const response = await this.mesasService.apiMesasElectoralCambiarEstadoIdPut({
        id: mesa.idMesaElectoral,
      });
      // Actualiza inmediatamente la fila en pantalla
      this.mesas.update((lista) =>
        lista.map((x) =>
          x.idMesaElectoral === mesa.idMesaElectoral ? { ...x, activa: activar } : x,
        ),
      );
      await this.swalMensaje.exito('Éxito', response!);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    }
  }
}
