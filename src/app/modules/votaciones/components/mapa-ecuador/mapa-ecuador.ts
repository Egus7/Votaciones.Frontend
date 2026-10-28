import { Component, computed, effect, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Provincia } from '../../../../api/models/provincia';
import { Canton } from '../../../../api/models/canton';
import { Parroquia } from '../../../../api/models/parroquia';

// Región dibujada en el mapa (provincia, cantón o parroquia).
export interface RegionMapa {
  codigo: string;
  nombre: string;
  d: string;
  cx: number;
  cy: number;
}

interface CapaMapa {
  viewBox: string;
  items: RegionMapa[];
  // Recuadro de Galápagos (solo en el mapa de provincias).
  recuadro?: { x: number; y: number; w: number; h: number };
}

type NivelMapa = 'provincia' | 'canton' | 'parroquia';

// Mapas generados desde la capa de organización territorial del CONALI (CC BY).
const RUTA_MAPAS = 'mapas/ecuador';

@Component({
  selector: 'app-mapa-ecuador',
  imports: [MatIconModule],
  templateUrl: './mapa-ecuador.html',
  styleUrl: './mapa-ecuador.css',
})
export class MapaEcuador {
  // UBICACIONES REGISTRADAS
  readonly provincias = input<Provincia[]>([]);
  readonly cantones = input<Canton[]>([]);
  readonly parroquias = input<Parroquia[]>([]);

  // SELECCIÓN ACTUAL
  readonly provinciaId = input<string | undefined>();
  readonly cantonId = input<string | undefined>();
  readonly parroquiaId = input<string | undefined>();
  readonly deshabilitado = input(false);

  readonly provinciaSeleccionada = output<string | undefined>();
  readonly cantonSeleccionado = output<string | undefined>();
  readonly parroquiaSeleccionada = output<string | undefined>();

  readonly capa = signal<CapaMapa | null>(null);
  readonly cargandoMapa = signal(false);
  readonly regionHover = signal<RegionMapa | null>(null);

  private readonly cache = new Map<string, CapaMapa>();
  private solicitudActual = 0;

  // UBICACIONES SELECCIONADAS
  readonly provincia = computed(() =>
    this.provincias().find((x) => x.idProvincia === this.provinciaId()),
  );
  readonly canton = computed(() =>
    this.cantonId() ? this.cantones().find((x) => x.idCanton === this.cantonId()) : undefined,
  );

  // Nivel según la capa cargada: parroquias, cantones o provincias.
  readonly nivel = signal<NivelMapa>('provincia');

  readonly titulo = computed(() => {
    switch (this.nivel()) {
      case 'parroquia':
        return 'Seleccione una parroquia';
      case 'canton':
        return 'Seleccione un cantón';
      default:
        return 'Seleccione una provincia';
    }
  });

  constructor() {
    // Cargar el mapa del nivel correspondiente.
    effect(() => {
      void this.actualizarCapa(this.provincia(), this.canton());
    });
  }

  private async actualizarCapa(provincia?: Provincia, canton?: Canton): Promise<void> {
    const solicitud = ++this.solicitudActual;
    this.regionHover.set(null);
    this.cargandoMapa.set(true);

    try {
      let capa = await this.obtenerCapa('provincias.json');
      let nivel: NivelMapa = 'provincia';
      const codigoProvincia = provincia
        ? this.buscarCodigo(capa, provincia.nombreProvincia, provincia.codigoProvincia)
        : undefined;

      if (codigoProvincia) {
        capa = await this.obtenerCapa(`cantones/${codigoProvincia}.json`);
        nivel = 'canton';
        const codigoCanton = canton ? this.buscarCodigo(capa, canton.nombreCanton) : undefined;

        if (codigoCanton) {
          capa = await this.obtenerCapa(`parroquias/${codigoCanton}.json`);
          nivel = 'parroquia';
        }
      }
      // Evitar mostrar una respuesta antigua.
      if (solicitud === this.solicitudActual) {
        this.nivel.set(nivel);
        this.capa.set(capa);
      }
    } catch (error) {
      console.error(error);
      if (solicitud === this.solicitudActual) {
        this.capa.set(null);
      }
    } finally {
      if (solicitud === this.solicitudActual) {
        this.cargandoMapa.set(false);
      }
    }
  }

  private async obtenerCapa(archivo: string): Promise<CapaMapa> {
    const enCache = this.cache.get(archivo);
    if (enCache) {
      return enCache;
    }
    const response = await fetch(`${RUTA_MAPAS}/${archivo}`);
    if (!response.ok) {
      throw new Error(`No se pudo cargar el mapa ${archivo}`);
    }
    const capa = (await response.json()) as CapaMapa;
    this.cache.set(archivo, capa);
    return capa;
  }

  // RELACIÓN ENTRE EL MAPA Y LAS UBICACIONES REGISTRADAS
  private normalizar(nombre: string | null | undefined): string {
    return (nombre ?? '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .toLowerCase()
      .trim();
  }

  // Código DPA de la región: por nombre o, si no coincide, por el código registrado.
  private buscarCodigo(
    capa: CapaMapa,
    nombre: string | null | undefined,
    codigo?: string | null,
  ): string | undefined {
    const region =
      capa.items.find((x) => this.normalizar(x.nombre) === this.normalizar(nombre)) ??
      capa.items.find((x) => !!codigo && x.codigo === codigo.trim().padStart(2, '0'));
    return region?.codigo;
  }

  // Id registrado que corresponde a la región del mapa.
  obtenerId(region: RegionMapa): string | undefined {
    const nombre = this.normalizar(region.nombre);

    switch (this.nivel()) {
      case 'provincia':
        return (
          this.provincias().find((x) => this.normalizar(x.nombreProvincia) === nombre) ??
          this.provincias().find((x) => x.codigoProvincia?.trim().padStart(2, '0') === region.codigo)
        )?.idProvincia;
      case 'canton':
        return this.cantones().find((x) => this.normalizar(x.nombreCanton) === nombre)?.idCanton;
      default:
        return this.parroquias().find((x) => this.normalizar(x.nombreParroquia) === nombre)
          ?.idParroquia;
    }
  }

  // Nombre a mostrar: el registrado, o el del mapa si no existe.
  obtenerNombre(region: RegionMapa): string {
    const id = this.obtenerId(region);
    switch (this.nivel()) {
      case 'provincia':
        return this.provincias().find((x) => x.idProvincia === id)?.nombreProvincia ?? region.nombre;
      case 'canton':
        return this.cantones().find((x) => x.idCanton === id)?.nombreCanton ?? region.nombre;
      default:
        return this.parroquias().find((x) => x.idParroquia === id)?.nombreParroquia ?? region.nombre;
    }
  }

  esSeleccionada(region: RegionMapa): boolean {
    const id = this.obtenerId(region);
    return !!id && this.nivel() === 'parroquia' && id === this.parroquiaId();
  }

  // SELECCIÓN DESDE EL MAPA
  seleccionar(region: RegionMapa): void {
    const id = this.obtenerId(region);
    if (!id || this.deshabilitado() || this.cargandoMapa()) {
      return;
    }

    switch (this.nivel()) {
      case 'provincia':
        this.provinciaSeleccionada.emit(id);
        break;
      case 'canton':
        this.cantonSeleccionado.emit(id);
        break;
      default:
        // Un segundo clic quita la parroquia seleccionada.
        this.parroquiaSeleccionada.emit(id === this.parroquiaId() ? undefined : id);
    }
  }

  // NAVEGACIÓN HACIA NIVELES SUPERIORES
  irANacional(): void {
    if (!this.deshabilitado()) {
      this.provinciaSeleccionada.emit(undefined);
    }
  }

  irAProvincia(): void {
    if (!this.deshabilitado()) {
      this.cantonSeleccionado.emit(undefined);
    }
  }

  // Posición en porcentaje para el tooltip.
  posicion(region: RegionMapa): { x: number; y: number } {
    const [, , ancho, alto] = (this.capa()?.viewBox ?? '0 0 1 1').split(' ').map(Number);
    return {
      x: (region.cx / ancho) * 100,
      y: (region.cy / alto) * 100,
    };
  }

  // Proporción del contenedor según el mapa.
  proporcion(): number {
    const [, , ancho, alto] = (this.capa()?.viewBox ?? '0 0 4 3').split(' ').map(Number);
    return ancho / alto;
  }
}
