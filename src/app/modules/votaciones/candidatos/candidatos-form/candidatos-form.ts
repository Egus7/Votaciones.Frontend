import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Candidato } from '../../../../api/models/candidato';
import { ListaCandidato } from '../../../../api/models/lista-candidato';
import { TIPO_CANDIDATO } from '../../../../api/models/tipo-candidato-array';
import { TipoCandidato } from '../../../../api/models/tipo-candidato';
import { Modal } from '../../../../shared/modals/modal/modal';
import { ListaElectoralModal } from '../../../../shared/modals/lista-electoral-modal/lista-electoral-modal';
import { ListaElectoral } from '../../../../api/models/lista-electoral';
import { CandidatosService } from '../../../../api/services/candidatos.service';
import { EleccionContexto } from '../../../../core/services/eleccion-contexto';
import { CandidatoDto } from '../../../../api/models/candidato-dto';
import { ListaCandidatoDto } from '../../../../api/models/lista-candidato-dto';
import { ActivatedRoute, Router } from '@angular/router';
import { Enlace, EnlaceSub } from '../../../../Config';
import { MensajeService } from '../../../../core/mensajes/mensaje-service';
import { ManejoMensajesError } from '../../../../core/mensajes/manejo-mensajes-error';

@Component({
  selector: 'app-candidatos-form',
  imports: [FormsModule, MatButtonModule, MatIconModule, Modal, ListaElectoralModal],
  templateUrl: './candidatos-form.html',
  styleUrl: './candidatos-form.css',
})
export class CandidatosForm implements OnInit {
  @ViewChild(ListaElectoralModal) selectorListas?: ListaElectoralModal;

  readonly tiposCandidato = TIPO_CANDIDATO;
  candidato: Candidato = {};
  listasSeleccionadasInfo: ListaElectoral[] = [];
  mostrarModalListas = false;

  readonly cargando = signal(false);
  guardando = false;
  //ID del candidato obtenido desde la ruta.
  candidatoId: string | null = null;

  constructor(
    private candidatosService: CandidatosService,
    private eleccionContexto: EleccionContexto,
    private route: ActivatedRoute,
    private router: Router,
    private swalMensaje: MensajeService,
    private manejoMensajeError: ManejoMensajesError,
  ) {
    this.candidatoId = this.route.snapshot.paramMap.get('id');
  }

  async ngOnInit() {
    this.cargando.set(true);

    try {
      if (this.esEdicion) {
        await this.cargarCandidato();
      } else {
        this.inicializarNuevoCandidato();
      }
    } finally {
      this.cargando.set(false);
    }
  }

  get esEdicion(): boolean {
    return !!this.candidatoId;
  }
  get listasSeleccionadas(): ListaCandidato[] {
    return this.candidato.listaCandidatos ?? [];
  }
  private inicializarNuevoCandidato(): void {
    const eleccion = this.eleccionContexto.eleccion();
    this.candidato = {
      eleccionId: eleccion?.idEleccion,
      listaCandidatos: [],
    };
    this.candidatoId = null;
    this.mostrarModalListas = false;
  }
  private async cargarCandidato(): Promise<void> {
    if (!this.candidatoId) {
      return;
    }
    this.cargando.set(true);

    try {
      const response = await this.candidatosService.apiCandidatosIdGet$Json({
        id: this.candidatoId,
      });

      this.candidato = this.mapearDtoACandidato(response);
      this.listasSeleccionadasInfo = this.mapearListasSeleccionadas(response.listasCandidato);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);

    } finally {
      this.cargando.set(false);
    }
  }

  private mapearDtoACandidato(dto: CandidatoDto): Candidato {
    const eleccion = this.eleccionContexto.eleccion();
    return {
      idCandidato: dto.idCandidato,
      nombreCandidato: dto.nombreCandidato ?? undefined,
      tipoCandidato: dto.tipoCandidato,
      orden: dto.orden,
      activo: dto.activo,
      eleccionId: eleccion?.idEleccion,
      listaCandidatos:
        dto.listasCandidato?.map((lista) => ({
          listaElectoralId: lista.listaElectoralId,
          candidatoId: dto.idCandidato,
          listaPrincipal: lista.esPrincipal,
        })) ?? [],
    };
  }

  private mapearListasSeleccionadas(
    listas: ListaCandidatoDto[] | null | undefined,
  ): ListaElectoral[] {
    if (!listas) {
      return [];
    }

    return listas
      .filter((lista) => !!lista.listaElectoralId)
      .map((lista) => ({
        idListaElectoral: lista.listaElectoralId,
        numeroLista: lista.numeroLista,
        nombreLista: lista.nombreLista ?? undefined,
      }));
  }

  guardarFormulario(): void {
    if (this.guardando) {
      return;
    }

    if (!this.candidato.nombreCandidato?.trim()) {
      void this.swalMensaje.advertencia(
        'Datos incompletos', 'Debe ingresar el nombre del candidato.'
      );
      return;
    }
    if (!this.candidato.tipoCandidato) {
      void this.swalMensaje.advertencia(
        'Datos incompletos', 'Debe seleccionar el tipo de candidato.',
      );
      return;
    }
    if (!this.candidato.eleccionId) {
      void this.swalMensaje.advertencia(
        'Datos incompletos', 'No se encontró la elección actual.'
      );
      return;
    }
    if (this.listasSeleccionadas.length === 0) {
      void this.swalMensaje.advertencia(
        'Datos incompletos', 'Debe seleccionar al menos una lista electoral.',
      );
      return;
    }
    void this.guardarCandidato();
  }

  private async guardarCandidato(): Promise<void> {
    this.guardando = true;

    try {
      let response;
      if (this.esEdicion && this.candidatoId) {
        response = await this.candidatosService.apiCandidatosIdPut({
          id: this.candidatoId,
          body: this.candidato,
        });
        await this.swalMensaje.exito('Éxito', response!);
      } else {
        await this.candidatosService.apiCandidatosPost$Json({
          body: this.candidato,
        });
        void this.swalMensaje.exito('Éxito', 'Candidato registrado correctamente!.');
      }
      // regresar al list
      void this.router.navigate([`${Enlace.Votaciones}/${EnlaceSub.Candidatos}`]);

    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError)

    } finally {
      this.guardando = false;
    }
  }

  cancelarFormulario(): void {
    void this.router.navigate([`${Enlace.Votaciones}/${EnlaceSub.Candidatos}`]);
  }
  abrirModalListas(): void {
    this.mostrarModalListas = true;
  }

  cerrarModalListas(): void {
    this.mostrarModalListas = false;
  }
  confirmarListas(): void {
    const listas = this.selectorListas?.obtenerSeleccionadas() ?? [];
    // validar que haya listas seleccionadas
    if (listas.length <= 0) {
      alert('Debe seleccionar una lista');
      return;
    }
    // Guardamos la información completa para mostrarla en pantalla
    this.listasSeleccionadasInfo = listas;
    // Guardamos los datos para la bdd
    this.candidato.listaCandidatos = listas.map((listaElectoral) => ({
      listaElectoralId: listaElectoral.idListaElectoral,
      candidatoId: this.candidato.idCandidato,
      listaPrincipal: false,
    }));

    // Si solo existe una lista, automáticamente es principal.
    if (this.candidato.listaCandidatos!.length === 1) {
      this.candidato.listaCandidatos![0].listaPrincipal = true;
    }

    this.cerrarModalListas();
  }
  esListaPrincipal(listaElectoralId: string | undefined): boolean {
    if (!listaElectoralId) {
      return false;
    }

    return (
      this.candidato.listaCandidatos?.some(
        (lista) => lista.listaElectoralId === listaElectoralId && lista.listaPrincipal === true,
      ) ?? false
    );
  }
  establecerPrincipal(listaElectoralId: string): void {
    this.candidato.listaCandidatos =
      this.candidato.listaCandidatos?.map((lista) => ({
        ...lista,
        listaPrincipal: lista.listaElectoralId === listaElectoralId,
      })) ?? [];
  }
  quitarLista(listaElectoralId: string): void {
    this.candidato.listaCandidatos =
      this.candidato.listaCandidatos?.filter(
        (lista) => lista.listaElectoralId !== listaElectoralId,
      ) ?? [];
    // Quitar de la información visual
    this.listasSeleccionadasInfo = this.listasSeleccionadasInfo.filter(
      (lista) => lista.idListaElectoral !== listaElectoralId,
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
}
