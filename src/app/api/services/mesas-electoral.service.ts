import { Injectable } from '@angular/core';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { MesaElectoral } from '../models/mesa-electoral';
import { MesaElectoralDto } from '../models/mesa-electoral-dto';
import { MesaElectoralDtoPaginacionDto } from '../models/mesa-electoral-dto-paginacion-dto';
import { TipoCandidato } from '../models/tipo-candidato';
import { TipoMesa } from '../models/tipo-mesa';

export interface CodigoMesaPreview {
  codigoMesa: string;
  descripcion: string;
}

@Injectable({ providedIn: 'root' })
export class MesasElectoralService {
  constructor(private supabase: SupabaseService) {}

  apiMesasElectoralPaginacionGet$Json(params?: {
    eleccionId?: string;
    pagina?: number;
    pageSize?: number;
    busqueda?: string;
    tipoMesa?: TipoMesa;
  }): Promise<MesaElectoralDtoPaginacionDto> {
    return this.supabase.rpc('mesas_paginacion', {
      p_eleccion_id: params?.eleccionId,
      p_pagina: params?.pagina,
      p_page_size: params?.pageSize,
      p_busqueda: params?.busqueda,
      p_tipo_mesa: params?.tipoMesa,
    });
  }

  apiMesasElectoralIdGet$Json(params: { id: string }): Promise<MesaElectoralDto> {
    return this.supabase.rpc('mesas_obtener', { p_id: params.id });
  }

  apiMesasElectoralZonaGet$Json(params?: { eleccionId?: string; zonaId?: string }): Promise<Array<MesaElectoralDto>> {
    return this.supabase.rpc('mesas_por_zona', {
      p_eleccion_id: params?.eleccionId,
      p_zona_id: params?.zonaId,
    });
  }

  apiMesasElectoralDisponiblePorZonaGet$Json(params?: {
    eleccionId?: string;
    zonaId?: string;
    tipoCandidato?: TipoCandidato;
  }): Promise<Array<MesaElectoralDto>> {
    return this.supabase.rpc('mesas_disponible_por_zona', {
      p_eleccion_id: params?.eleccionId,
      p_zona_id: params?.zonaId,
      p_tipo_candidato: params?.tipoCandidato,
    });
  }

  apiMesasElectoralCodigoMesaGet(params?: {
    eleccionId?: string;
    zonaId?: string;
    tipoMesa?: TipoMesa;
  }): Promise<CodigoMesaPreview> {
    return this.supabase.rpc('mesas_codigo_mesa', {
      p_eleccion_id: params?.eleccionId,
      p_zona_id: params?.zonaId,
      p_tipo_mesa: params?.tipoMesa,
    });
  }

  apiMesasElectoralPost$Json(params?: { body?: MesaElectoral }): Promise<MesaElectoral> {
    return this.supabase.rpc('mesas_crear', { p_body: params?.body ?? {} });
  }

  apiMesasElectoralLotePost$Json(params?: {
    eleccionId?: string;
    zonaId?: string;
    cantidadFemeninas?: number;
    cantidadMasculinas?: number;
  }): Promise<Array<MesaElectoral>> {
    return this.supabase.rpc('mesas_crear_lote', {
      p_eleccion_id: params?.eleccionId,
      p_zona_id: params?.zonaId,
      p_cantidad_femeninas: params?.cantidadFemeninas,
      p_cantidad_masculinas: params?.cantidadMasculinas,
    });
  }

  async apiMesasElectoralIdPut(params: { id: string; body?: MesaElectoral }): Promise<void> {
    await this.supabase.rpc('mesas_actualizar', { p_id: params.id, p_body: params.body ?? {} });
  }

  async apiMesasElectoralCambiarEstadoIdPut(params: { id: string }): Promise<void> {
    await this.supabase.rpc('mesas_cambiar_estado', { p_id: params.id });
  }
}
