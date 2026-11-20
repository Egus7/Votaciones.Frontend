import { Injectable } from '@angular/core';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { BitacoraDtoPaginacionDto } from '../models/bitacora-dto-paginacion-dto';

@Injectable({ providedIn: 'root' })
export class BitacoraService {
  constructor(private supabase: SupabaseService) {}

  apiBitacoraPaginacionGet$Json(params?: {
    pagina?: number;
    pageSize?: number;
    fechaDesde?: string;
    fechaHasta?: string;
    usuarioId?: string;
    accion?: string;
    tabla?: string;
  }): Promise<BitacoraDtoPaginacionDto> {
    return this.supabase.rpc('bitacora_paginacion', {
      p_pagina: params?.pagina,
      p_page_size: params?.pageSize,
      p_fecha_desde: params?.fechaDesde,
      p_fecha_hasta: params?.fechaHasta,
      p_usuario_id: params?.usuarioId,
      p_accion: params?.accion,
      p_tabla: params?.tabla,
    });
  }
}
