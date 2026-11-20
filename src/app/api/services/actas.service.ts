import { Injectable } from '@angular/core';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { ActaDetalleDto } from '../models/acta-detalle-dto';
import { ActaDto } from '../models/acta-dto';
import { ActaDtoPaginacionDto } from '../models/acta-dto-paginacion-dto';
import { ActaEleccion } from '../models/acta-eleccion';
import { EstadoActa } from '../models/estado-acta';
import { TipoCandidato } from '../models/tipo-candidato';

@Injectable({ providedIn: 'root' })
export class ActasService {
  constructor(private supabase: SupabaseService) {}

  apiActasPaginacionGet$Json(params?: {
    eleccionId?: string;
    pagina?: number;
    pageSize?: number;
    provinciaId?: string;
    cantonId?: string;
    parroquiaId?: string;
    zonaId?: string;
    mesaId?: string;
    estadoActa?: EstadoActa;
    tipoCandidato?: TipoCandidato;
  }): Promise<ActaDtoPaginacionDto> {
    return this.supabase.rpc('actas_paginacion', {
      p_eleccion_id: params?.eleccionId,
      p_pagina: params?.pagina,
      p_page_size: params?.pageSize,
      p_provincia_id: params?.provinciaId,
      p_canton_id: params?.cantonId,
      p_parroquia_id: params?.parroquiaId,
      p_zona_id: params?.zonaId,
      p_mesa_id: params?.mesaId,
      p_estado_acta: params?.estadoActa,
      p_tipo_candidato: params?.tipoCandidato,
    });
  }

  apiActasIdGet$Json(params: { id: string }): Promise<ActaDto> {
    return this.supabase.rpc('actas_obtener', { p_id: params.id });
  }

  apiActasCandidatosListasRegistroGet$Json(params?: {
    eleccionId?: string;
    tipoCandidato?: TipoCandidato;
    provinciaId?: string;
    cantonId?: string;
    parroquiaId?: string;
  }): Promise<Array<ActaDetalleDto>> {
    return this.supabase.rpc('actas_candidatos_listas_registro', {
      p_eleccion_id: params?.eleccionId,
      p_tipo_candidato: params?.tipoCandidato,
      p_provincia_id: params?.provinciaId,
      p_canton_id: params?.cantonId,
      p_parroquia_id: params?.parroquiaId,
    });
  }

  apiActasPost$Json(params?: { body?: ActaEleccion }): Promise<ActaEleccion> {
    return this.supabase.rpc('actas_crear', { p_body: params?.body ?? {} });
  }

  async apiActasIdPut(params: { id: string; body?: ActaEleccion }): Promise<void> {
    await this.supabase.rpc('actas_actualizar', { p_id: params.id, p_body: params.body ?? {} });
  }

  async apiActasCambiarEstadoIdPut(params: { id: string; nuevoEstado?: EstadoActa }): Promise<void> {
    await this.supabase.rpc('actas_cambiar_estado', { p_id: params.id, p_nuevo_estado: params.nuevoEstado });
  }

  // Elimina todas las actas de prueba. La Edge Function valida la contraseña y el rol Administrador.
  apiActasEliminarPruebasPost(params: { body: { password: string } }): Promise<string> {
    return this.supabase.invocar('actas-eliminar-pruebas', { password: params.body.password });
  }
}
