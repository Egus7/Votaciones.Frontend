import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TIPO_MESA } from '../../../../api/models/tipo-mesa-array';
import { MesaElectoral } from '../../../../api/models/mesa-electoral';
import { MesasElectoralService } from '../../../../api/services/mesas-electoral.service';
import { EleccionContexto } from '../../../../core/services/eleccion-contexto';
import { ActivatedRoute, Router } from '@angular/router';
import { MensajeService } from '../../../../core/mensajes/mensaje-service';
import { ManejoMensajesError } from '../../../../core/mensajes/manejo-mensajes-error';
import { MesaElectoralDto } from '../../../../api/models/mesa-electoral-dto';
import { Enlace, EnlaceSub } from '../../../../Config';
import { Provincia } from '../../../../api/models/provincia';
import { Canton } from '../../../../api/models/canton';
import { Parroquia } from '../../../../api/models/parroquia';
import { Zona } from '../../../../api/models/zona';
import { MatFormField, MatInputModule, MatLabel } from '@angular/material/input';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatOption, MatSelectModule } from '@angular/material/select';
import { MatButton } from '@angular/material/button';
import { LugarVotacionService } from '../../../../core/services/lugar-votacion-service';

@Component({
  selector: 'app-mesas-electoral-form',
  imports: [
    FormsModule,
    MatIconModule,
    MatFormField,
    MatRadioGroup,
    MatRadioButton,
    MatLabel,
    MatSelectModule,
    MatOption,
    MatInputModule,
    MatButton,
  ],
  templateUrl: './mesas-electoral-form.html',
  styleUrl: './mesas-electoral-form.css',
})
export class MesasElectoralForm implements OnInit {
  readonly tiposMesa = TIPO_MESA;
  mesaElectoral: MesaElectoral = {};
  // Catálogos
  provincias: Provincia[] = [];
  cantones: Canton[] = [];
  parroquias: Parroquia[] = [];
  zonas: Zona[] = [];
  // Selección geográfica
  provinciaId: string | undefined;
  cantonId: string | undefined;
  parroquiaId: string | undefined;
  // Valores de ubicación recibidos al editar
  private provinciaNombre = '';
  private cantonNombre = '';
  private parroquiaNombre = '';
  private zonaNombre = '';
  //preview
  codigoMesaPreview = '';
  descripcionMesaPreview = '';
  // Estados
  readonly cargando = signal(false);
  readonly cargandoPreview = signal(false);

  guardando = false;
  //Id obtenido desde la ruta.
  mesaElectoralId: string | null = null;

  modoCreacion: 'individual' | 'lote' = 'individual';
  cantidadFemeninas = 0;
  cantidadMasculinas = 0;

  constructor(
    private mesasService: MesasElectoralService,
    private zonasService: LugarVotacionService,
    private eleccionContexto: EleccionContexto,
    private route: ActivatedRoute,
    private router: Router,
    private swalMensaje: MensajeService,
    private manejoMensajeError: ManejoMensajesError,
  ) {
    this.mesaElectoralId = this.route.snapshot.paramMap.get('id');
  }

  async ngOnInit(): Promise<void> {
    this.cargando.set(true);

    try {
      if (this.esEdicion) {
        await this.cargarMesa();
      } else {
        this.inicializarNuevaMesa();
        await this.cargarProvincias();
      }
    } finally {
      this.cargando.set(false);
    }
  }

  get esEdicion(): boolean {
    return !!this.mesaElectoralId;
  }

  get totalMesas(): number {
    return this.cantidadFemeninas + this.cantidadMasculinas;
  }

  private inicializarNuevaMesa(): void {
    const eleccion = this.eleccionContexto.eleccion();
    this.mesaElectoral = {
      eleccionId: eleccion?.idEleccion,
    };
    this.modoCreacion = 'individual';
    this.cantidadFemeninas = 0;
    this.cantidadMasculinas = 0;
    // Preview inicialmente vacío
    this.limpiarPreview();
  }

  cambioModoCreacion(): void {
    this.limpiarPreview();
    if (this.modoCreacion === 'individual') {
      this.cantidadFemeninas = 0;
      this.cantidadMasculinas = 0;
    } else {
      this.mesaElectoral.tipoMesa = undefined;
    }
  }

  private async cargarMesa(): Promise<void> {
    if (!this.mesaElectoralId) {
      return;
    }
    this.cargando.set(true);

    try {
      const response = await this.mesasService.apiMesasElectoralIdGet$Json({
        id: this.mesaElectoralId,
      });
      this.mesaElectoral = this.mapearDtoAMesa(response);
      // Guardamos los nombres de la ubicación
      this.provinciaNombre = response.provincia ?? '';
      this.cantonNombre = response.canton ?? '';
      this.parroquiaNombre = response.parroquia ?? '';
      this.zonaNombre = response.zona ?? '';
      await this.cargarProvincias();
      // Reconstruye Provincia → Cantón → Parroquia → Zona
      await this.inicializarZonaEdicion();
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    } finally {
      this.cargando.set(false);
    }
  }

  private mapearDtoAMesa(dto: MesaElectoralDto): MesaElectoral {
    const eleccion = this.eleccionContexto.eleccion();
    return {
      idMesaElectoral: dto.idMesaElectoral,
      codigoMesa: dto.codigoMesa ?? undefined,
      tipoMesa: dto.tipoMesa,
      descripcion: dto.descripcion,
      activa: dto.activa,
      eleccionId: eleccion?.idEleccion,
    };
  }

  private async cargarProvincias(): Promise<void> {
    try {
      this.provincias = await this.zonasService.provincias();
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    }
  }
  async cargarCantones(): Promise<void> {
    this.cantones = [];
    this.parroquias = [];
    this.zonas = [];

    this.cantonId = undefined;
    this.parroquiaId = undefined;
    this.mesaElectoral.zonaId = undefined;
    this.limpiarPreview();

    if (!this.provinciaId) {
      return;
    }

    try {
      this.cantones = await this.zonasService.cantones(this.provinciaId);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    }
  }

  async cargarParroquias(): Promise<void> {
    this.parroquias = [];
    this.zonas = [];

    this.parroquiaId = undefined;
    this.mesaElectoral.zonaId = undefined;
    this.limpiarPreview();

    if (!this.cantonId) {
      return;
    }

    try {
      this.parroquias = await this.zonasService.parroquias(this.cantonId);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    }
  }

  async cargarZonas(): Promise<void> {
    this.zonas = [];

    this.mesaElectoral.zonaId = undefined;
    this.limpiarPreview();

    if (!this.parroquiaId) {
      return;
    }

    try {
      this.zonas = await this.zonasService.zonas(this.parroquiaId);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    }
  }

  // Inicializar zona al editar
  private async inicializarZonaEdicion(): Promise<void> {
    if (!this.esEdicion || !this.provinciaNombre) return;

    //Provincia
    const provincia = this.provincias.find((x) =>
      x.nombreProvincia === this.provinciaNombre);

    if (!provincia?.idProvincia) {
      return;
    }
    this.provinciaId = provincia.idProvincia;

    // Cantones
    this.cantones = await this.zonasService.cantones(this.provinciaId);
    const canton = this.cantones.find((x) =>
      x.nombreCanton === this.cantonNombre);

    if (!canton?.idCanton) {
      return;
    }
    this.cantonId = canton.idCanton;

    // Parroquias
    this.parroquias = await this.zonasService.parroquias(this.cantonId);
    const parroquia = this.parroquias.find((x) => x.nombreParroquia === this.parroquiaNombre);

    if (!parroquia?.idParroquia) {
      return;
    }
    this.parroquiaId = parroquia.idParroquia;

    // Zonas
    this.zonas = await this.zonasService.zonas(this.parroquiaId);
    const zona = this.zonas.find((x) => x.nombreZona === this.zonaNombre);
    if (!zona?.idZona) {
      return;
    }
    this.mesaElectoral.zonaId = zona.idZona;

    //await this.actualizarPreview();
  }

  async actualizarPreview(): Promise<void> {
    const eleccion = this.eleccionContexto.eleccion();

    if (
      !eleccion?.idEleccion || !this.mesaElectoral.zonaId ||
      this.mesaElectoral.tipoMesa === undefined || this.mesaElectoral.tipoMesa === null
    ) {
      this.limpiarPreview();
      return;
    }

    this.cargandoPreview.set(true);

    try {
      const response = await this.mesasService.apiMesasElectoralCodigoMesaGet({
        eleccionId: eleccion.idEleccion,
        zonaId: this.mesaElectoral.zonaId,
        tipoMesa: this.mesaElectoral.tipoMesa,
      });
      const preview = JSON.parse(response ?? '');
      this.codigoMesaPreview = preview.codigoMesa ?? '';
      this.descripcionMesaPreview = preview.descripcion ?? '';
    } catch (error) {
      this.limpiarPreview();
      const mensaje = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensaje);
    } finally {
      this.cargandoPreview.set(false);
    }
  }
  private limpiarPreview(): void {
    this.codigoMesaPreview = '';
    this.descripcionMesaPreview = '';
  }

  guardarFormulario(): void {
    if (this.guardando) {
      return;
    }

    if (!this.mesaElectoral.zonaId) {
      void this.swalMensaje.advertencia(
        'Datos incompletos',
        'Debe seleccionar la zona de la mesa.',
      );
      return;
    }

    if (this.esEdicion || this.modoCreacion === 'individual') {
      if (!this.mesaElectoral.tipoMesa) {
        void this.swalMensaje.advertencia('Datos incompletos', 'Debe seleccionar el tipo de mesa.');
        return;
      }
    } else {
      if (this.cantidadFemeninas === 0 && this.cantidadMasculinas === 0) {
        void this.swalMensaje.advertencia('Datos incompletos', 'Debe ingresar al menos una mesa.');
        return;
      }
    }

    void this.guardarMesa();
  }

  private async guardarMesa(): Promise<void> {
    this.guardando = true;

    try {
      let response;
      if (this.esEdicion && this.mesaElectoralId) {
        response = await this.mesasService.apiMesasElectoralIdPut({
          id: this.mesaElectoralId,
          body: this.mesaElectoral,
        });
        await this.swalMensaje.exito('Éxito', response!);
      } else if (this.modoCreacion === 'individual') {
        await this.mesasService.apiMesasElectoralPost$Json({
          body: this.mesaElectoral,
        });
        await this.swalMensaje.exito('Éxito', 'Mesa electoral registrada correctamente.');
      } else {
        await this.mesasService.apiMesasElectoralLotePost$Json({
          eleccionId: this.mesaElectoral.eleccionId,
          zonaId: this.mesaElectoral.zonaId,
          cantidadMasculinas: this.cantidadMasculinas,
          cantidadFemeninas: this.cantidadFemeninas,
        });
        await this.swalMensaje.exito(
          'Éxito',
          `Se registraron ${this.totalMesas} mesas electorales correctamente!.`,
        );
      }
      // regresar al list
      await this.router.navigate([`${Enlace.Votaciones}/${EnlaceSub.Mesas}`]);
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      await this.swalMensaje.error('Error', mensajeError);
    } finally {
      this.guardando = false;
    }
  }

  cancelarFormulario(): void {
    void this.router.navigate([`${Enlace.Votaciones}/${EnlaceSub.Mesas}`]);
  }
}
