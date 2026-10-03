import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { JURISDICCION } from '../../../../api/models/jurisdiccion-array';
import { ListaElectoral } from '../../../../api/models/lista-electoral';
import { ListasElectoralService } from '../../../../api/services/listas-electoral.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MensajeService } from '../../../../core/mensajes/mensaje-service';
import { ManejoMensajesError } from '../../../../core/mensajes/manejo-mensajes-error';
import { Enlace, EnlaceSub } from '../../../../Config';

@Component({
  selector: 'app-listas-electoral-form',
  imports: [FormsModule, MatIconModule],
  templateUrl: './listas-electoral-form.html',
  styleUrl: './listas-electoral-form.css',
})
export class ListasElectoralForm implements OnInit {
  readonly jurisdicciones = JURISDICCION;
  listaElectoral: ListaElectoral = {};

  readonly cargando = signal(false);
  guardando = false;
  //id obtenido desde la ruta.
  listaElectoralId: string | null = null;

  constructor(
    private listasElectoralService: ListasElectoralService,
    private route: ActivatedRoute,
    private router: Router,
    private swalMensaje: MensajeService,
    private manejoMensajeError: ManejoMensajesError,
  ) {
    this.listaElectoralId = this.route.snapshot.paramMap.get('id');
  }

  async ngOnInit() {
    this.cargando.set(true);

    try {
      if (this.esEdicion) {
        await this.cargarLista();
      } else {
        this.inicializarNuevaLista()
      }
    } finally {
      this.cargando.set(false);
    }
  }

  get esEdicion(): boolean {
    return !!this.listaElectoralId;
  }

  private inicializarNuevaLista(): void {
    this.listaElectoral = {};
  }

  private async cargarLista(): Promise<void> {
    if (!this.listaElectoralId) {
      return;
    }
    this.cargando.set(true);

    try {
      this.listaElectoral = await this.listasElectoralService.apiListasElectoralIdGet$Json({
        id: this.listaElectoralId,
      });

    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    } finally {
      this.cargando.set(false);
    }
  }

  guardarFormulario(): void {
    if (this.guardando) {
      return;
    }

    if (!this.listaElectoral.nombreLista) {
      void this.swalMensaje.advertencia(
        'Datos incompletos', 'Debe ingresar el nombre de la lista.'
      );
      return;
    }
    if (!this.listaElectoral.numeroLista) {
      void this.swalMensaje.advertencia(
        'Datos incompletos', 'Debe ingresar el numero de la lista.',
      );
      return;
    }
    if (!this.listaElectoral.siglas) {
      void this.swalMensaje.advertencia(
        'Datos incompletos', 'Debe ingresar las siglas de la lista.',
      );
      return;
    }
    if (!this.listaElectoral.jurisdiccion) {
      void this.swalMensaje.advertencia(
        'Datos incompletos', 'Debe seleccionar la jurisdiccion de la lista.',
      );
      return;
    }
    void this.guardarCandidato();
  }

  private async guardarCandidato(): Promise<void> {
    this.guardando = true;

    try {
      let response;
      if (this.esEdicion && this.listaElectoralId) {
        response = await this.listasElectoralService.apiListasElectoralIdPut({
          id: this.listaElectoralId,
          body: this.listaElectoral,
        });
        await this.swalMensaje.exito('Éxito', response!);
      } else {
        await this.listasElectoralService.apiListasElectoralPost$Json({
          body: this.listaElectoral,
        });
        void this.swalMensaje.exito('Éxito', 'Lista electoral registrada correctamente!.');
      }
      // regresar al list
      void this.router.navigate([`${Enlace.Votaciones}/${EnlaceSub.Listas}`]);

    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError)

    } finally {
      this.guardando = false;
    }
  }

  cancelarFormulario(): void {
    void this.router.navigate([`${Enlace.Votaciones}/${EnlaceSub.Listas}`]);
  }


}
