import { Injectable } from '@angular/core';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { Jurisdiccion } from '../models/jurisdiccion';
import { ListaElectoral } from '../models/lista-electoral';
import { ListaElectoralPaginacionDto } from '../models/lista-electoral-paginacion-dto';

@Injectable({ providedIn: 'root' })
export class ListasElectoralService {
  constructor(private supabase: SupabaseService) {}

  apiListasElectoralPaginacionGet$Json(params?: {
    pagina?: number;
    pageSize?: number;
    buscar?: string;
    jurisdiccion?: Jurisdiccion;
  }): Promise<ListaElectoralPaginacionDto> {
    return this.supabase.rpc('listas_paginacion', {
      p_pagina: params?.pagina,
      p_page_size: params?.pageSize,
      p_buscar: params?.buscar,
      p_jurisdiccion: params?.jurisdiccion,
    });
  }

  apiListasElectoralIdGet$Json(params: { id: string }): Promise<ListaElectoral> {
    return this.supabase.rpc('listas_obtener', { p_id: params.id });
  }

  apiListasElectoralPost$Json(params?: { body?: ListaElectoral }): Promise<ListaElectoral> {
    return this.supabase.rpc('listas_crear', { p_body: params?.body ?? {} });
  }

  async apiListasElectoralIdPut(params: { id: string; body?: ListaElectoral }): Promise<void> {
    await this.supabase.rpc('listas_actualizar', { p_id: params.id, p_body: params.body ?? {} });
  }

  async apiListasElectoralCambiarEstadoIdPut(params: { id: string }): Promise<void> {
    await this.supabase.rpc('listas_cambiar_estado', { p_id: params.id });
  }
}
