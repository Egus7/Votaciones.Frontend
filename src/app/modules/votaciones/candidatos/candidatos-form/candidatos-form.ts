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
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { LugarVotacionService } from '../../../../core/services/lugar-votacion-service';
import { Provincia } from '../../../../api/models/provincia';
import { Canton } from '../../../../api/models/canton';
import { Parroquia } from '../../../../api/models/parroquia';

@Component({
  selector: 'app-candidatos-form',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatLabel,
    MatFormField,
    MatInput,
    MatOption,
    Modal,
    ListaElectoralModal,
    MatSelect,
  ],
  templateUrl: './candidatos-form.html',
  styleUrl: './candidatos-form.css',
})
export class CandidatosForm implements OnInit {
  @ViewChild(ListaElectoralModal) selectorListas?: ListaElectoralModal;

  readonly tiposCandidato = TIPO_CANDIDATO;
  candidato: Candidato = {};
  listasSeleccionadasInfo: ListaElectoral[] = [];
  //catalogo ubicacion
  readonly provincias = signal<Provincia[]>([]);
  readonly cantones = signal<Canton[]>([]);
  readonly parroquias = signal<Parroquia[]>([]);
  //bolean
  mostrarModalListas = false;
  readonly cargando = signal(false);
  guardando = false;
  //ID del candidato obtenido desde la ruta.
  candidatoId: string | null = null;
  //Zona
  provinciaId: string | undefined;
  cantonId: string | undefined;
  parroquiaId: string | undefined;
  //mostrarNombreZona
  private provinciaNombre = '';
  private cantonNombre = '';
  private parroquiaNombre = '';

  constructor(
    private candidatosService: CandidatosService,
    private eleccionContexto: EleccionContexto,
    private zonasService: LugarVotacionService,
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
    void this.cargarProvincias();
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
      // Guardar nombres de ubicación
      this.provinciaNombre = response.provincia ?? '';
      this.cantonNombre = response.canton ?? '';
      this.parroquiaNombre = response.parroquia ?? '';
      this.listasSeleccionadasInfo = this.mapearListasSeleccionadas(response.listasCandidato);
      //cargar
      await this.cargarProvincias();
      await this.cargarUbicacion();
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
      provinciaId: this.provinciaId,
      cantonId: this.cantonId,
      parroquiaId: this.parroquiaId,
      //list
      listaCandidatos:
        dto.listasCandidato?.map((lista) => ({
          listaElectoralId: lista.listaElectoralId,
          candidatoId: dto.idCandidato,
          listaPrincipal: lista.esPrincipal,
        })) ?? [],
    };
  }
  // CARGAR PROVINCIAS
  private async cargarProvincias(): Promise<void> {
    try {
      const response = await this.zonasService.provincias();
      this.provincias.set(response);
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

    this.cantones.set([]);
    this.parroquias.set([]);

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
    this.parroquias.set([]);

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

  // CARGAR GEOGRAFÍA DEL ACTA
  private async cargarUbicacion(): Promise<void> {
    if (!this.candidatoId || !this.provinciaNombre) {
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
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    }
  }

  async cambioTipoCandidato(): Promise<void> {
    switch (this.candidato.tipoCandidato) {
      case 'Presidente':
        this.provinciaId = undefined;
        this.cantonId = undefined;
        this.parroquiaId = undefined;
        break;
      case 'Prefecto':
        this.cantonId = undefined;
        this.parroquiaId = undefined;
        break;
      case 'Alcalde':
      case 'ConcejalUrbano':
        this.parroquiaId = undefined;
        break;
      case 'ConcejalRural':
        // No se limpia nada
        break;
      default:
        this.provinciaId = undefined;
        this.cantonId = undefined;
        this.parroquiaId = undefined;
        break;
    }
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
        'Datos incompletos',
        'Debe ingresar el nombre del candidato.',
      );
      return;
    }
    if (!this.candidato.tipoCandidato) {
      void this.swalMensaje.advertencia(
        'Datos incompletos',
        'Debe seleccionar el tipo de candidato.',
      );
      return;
    }
    if (!this.candidato.eleccionId) {
      void this.swalMensaje.advertencia('Datos incompletos', 'No se encontró la elección actual.');
      return;
    }
    //zona
    if (this.mostrarProvincia() && !this.provinciaId) {
      void this.swalMensaje.advertencia(
        'Datos incompletos',
        'Debe seleccionar la provincia al que pertenece el candidato.',
      );
      return;
    }
    if (this.mostrarCanton() && !this.cantonId) {
      void this.swalMensaje.advertencia(
        'Datos incompletos',
        'Debe seleccionar el cantón al que pertenece el candidato.',
      );
      return;
    }
    if (this.mostrarParroquia() && !this.parroquiaId) {
      void this.swalMensaje.advertencia(
        'Datos incompletos',
        'Debe seleccionar la parroquia a la que pertenece el candidato.',
      );
      return;
    }

    if (this.listasSeleccionadas.length === 0) {
      void this.swalMensaje.advertencia(
        'Datos incompletos',
        'Debe seleccionar al menos una lista electoral.',
      );
      return;
    }
    void this.guardarCandidato();
  }

  private async guardarCandidato(): Promise<void> {
    this.guardando = true;

    try {
      let response;
      // Sincronizar ubicación con el modelo
      this.candidato.provinciaId = this.mostrarProvincia() ? this.provinciaId : undefined;
      this.candidato.cantonId = this.mostrarCanton() ? this.cantonId : undefined;
      this.candidato.parroquiaId = this.mostrarParroquia() ? this.parroquiaId : undefined;
      //GUARDAR/EDITAR
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
      await this.swalMensaje.error('Error', mensajeError);
    } finally {
      this.guardando = false;
    }
  }

  cancelarFormulario(): void {
    void this.router.navigate([`${Enlace.Votaciones}/${EnlaceSub.Candidatos}`]);
  }

  mostrarProvincia(): boolean {
    return ['Prefecto', 'Alcalde', 'ConcejalUrbano', 'ConcejalRural'].includes(
      this.candidato.tipoCandidato ?? '',
    );
  }
  mostrarCanton(): boolean {
    return ['Alcalde', 'ConcejalUrbano', 'ConcejalRural'].includes(
      this.candidato.tipoCandidato ?? '',
    );
  }
  mostrarParroquia(): boolean {
    return this.candidato.tipoCandidato === 'ConcejalRural';
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
    // si solo queda una lista establecer como principal
    if (this.listasSeleccionadasInfo.length === 1) {
      const listaRestante = this.listasSeleccionadasInfo[0];
      this.establecerPrincipal(listaRestante.idListaElectoral!);
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
}
