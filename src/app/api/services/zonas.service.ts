import { Injectable } from '@angular/core';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { Canton } from '../models/canton';
import { Parroquia } from '../models/parroquia';
import { Provincia } from '../models/provincia';
import { Zona } from '../models/zona';

@Injectable({ providedIn: 'root' })
export class ZonasService {
  constructor(private supabase: SupabaseService) {}

  apiZonasProvinciasGet$Json(_params?: object): Promise<Array<Provincia>> {
    return this.supabase.rpc('zonas_provincias');
  }

  apiZonasCantonesGet$Json(params?: { provinciaId?: string }): Promise<Array<Canton>> {
    return this.supabase.rpc('zonas_cantones', { p_provincia_id: params?.provinciaId });
  }

  apiZonasParroquiasGet$Json(params?: { cantonId?: string }): Promise<Array<Parroquia>> {
    return this.supabase.rpc('zonas_parroquias', { p_canton_id: params?.cantonId });
  }

  apiZonasZonasGet$Json(params?: { parroquiaId?: string }): Promise<Array<Zona>> {
    return this.supabase.rpc('zonas_zonas', { p_parroquia_id: params?.parroquiaId });
  }
}
