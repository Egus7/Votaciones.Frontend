import { Injectable } from '@angular/core';
import { Provincia } from '../../api/models/provincia';
import { ZonasService } from '../../api/services/zonas.service';
import { Canton } from '../../api/models/canton';
import { Parroquia } from '../../api/models/parroquia';
import { Zona } from '../../api/models/zona';

@Injectable({
  providedIn: 'root',
})
export class LugarVotacionService {
  constructor(private zonasService: ZonasService) {}

  async provincias(): Promise<Provincia[]> {
    return (await this.zonasService.apiZonasProvinciasGet$Json({})) ?? [];
  }

  async cantones(provinciaId: string): Promise<Canton[]> {
    return (
      (await this.zonasService.apiZonasCantonesGet$Json({
        provinciaId,
      })) ?? []
    );
  }

  async parroquias(cantonId: string): Promise<Parroquia[]> {
    return (
      (await this.zonasService.apiZonasParroquiasGet$Json({
        cantonId,
      })) ?? []
    );
  }

  async zonas(parroquiaId: string): Promise<Zona[]> {
    return (
      (await this.zonasService.apiZonasZonasGet$Json({
        parroquiaId,
      })) ?? []
    );
  }

}
