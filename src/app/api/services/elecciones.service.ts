import { Injectable } from '@angular/core';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { Eleccion } from '../models/eleccion';
import { EleccionPaginacionDto } from '../models/eleccion-paginacion-dto';
import { TipoEleccion } from '../models/tipo-eleccion';

@Injectable({ providedIn: 'root' })
export class EleccionesService {
  constructor(private supabase: SupabaseService) {}

  apiEleccionesPaginacionGet$Json(params?: {
    pagina?: number;
    pageSize?: number;
    busqueda?: string;
    fechaInicio?: string;
    fechaFin?: string;
    tipoEleccion?: TipoEleccion;
  }): Promise<EleccionPaginacionDto> {
    return this.supabase.rpc('elecciones_paginacion', {
      p_pagina: params?.pagina,
      p_page_size: params?.pageSize,
      p_busqueda: params?.busqueda,
      p_fecha_inicio: params?.fechaInicio,
      p_fecha_fin: params?.fechaFin,
      p_tipo_eleccion: params?.tipoEleccion,
    });
  }

  apiEleccionesGet$Json(): Promise<Array<Eleccion>> {
    return this.supabase.rpc('elecciones_listar');
  }

  apiEleccionesIdGet$Json(params: { id: string }): Promise<Eleccion> {
    return this.supabase.rpc('elecciones_obtener', { p_id: params.id });
  }

  apiEleccionesPost$Json(params?: { body?: Eleccion }): Promise<Eleccion> {
    return this.supabase.rpc('elecciones_crear', { p_body: params?.body ?? {} });
  }

  async apiEleccionesIdPut(params: { id: string; body?: Eleccion }): Promise<void> {
    await this.supabase.rpc('elecciones_actualizar', { p_id: params.id, p_body: params.body ?? {} });
  }
}
