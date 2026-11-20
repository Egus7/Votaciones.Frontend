import { Injectable } from '@angular/core';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { AlianzaElectoralDto } from '../models/alianza-electoral-dto';
import { Candidato } from '../models/candidato';
import { CandidatoDto } from '../models/candidato-dto';
import { CandidatoDtoPaginacionDto } from '../models/candidato-dto-paginacion-dto';
import { TipoCandidato } from '../models/tipo-candidato';

@Injectable({ providedIn: 'root' })
export class CandidatosService {
  constructor(private supabase: SupabaseService) {}

  apiCandidatosPaginacionGet$Json(params?: {
    eleccionId?: string;
    pagina?: number;
    pageSize?: number;
    busqueda?: string;
    tipoCandidato?: TipoCandidato;
    listaElectoralId?: string;
  }): Promise<CandidatoDtoPaginacionDto> {
    return this.supabase.rpc('candidatos_paginacion', {
      p_eleccion_id: params?.eleccionId,
      p_pagina: params?.pagina,
      p_page_size: params?.pageSize,
      p_busqueda: params?.busqueda,
      p_tipo_candidato: params?.tipoCandidato,
      p_lista_electoral_id: params?.listaElectoralId,
    });
  }

  apiCandidatosIdGet$Json(params: { id: string }): Promise<CandidatoDto> {
    return this.supabase.rpc('candidatos_obtener', { p_id: params.id });
  }

  apiCandidatosAlianzasElectoralesGet$Json(params?: {
    eleccionId?: string;
    provinciaId?: string;
    cantonId?: string;
    parroquiaId?: string;
    listasElectorales?: Array<string>;
  }): Promise<Array<AlianzaElectoralDto>> {
    return this.supabase.rpc('candidatos_alianzas_disponibles', {
      p_eleccion_id: params?.eleccionId,
      p_provincia_id: params?.provinciaId,
      p_canton_id: params?.cantonId,
      p_parroquia_id: params?.parroquiaId,
      p_listas: params?.listasElectorales,
    });
  }

  apiCandidatosPost$Json(params?: { nombreAlianza?: string; body?: Candidato }): Promise<Candidato> {
    return this.supabase.rpc('candidatos_crear', {
      p_body: params?.body ?? {},
      p_nombre_alianza: params?.nombreAlianza,
    });
  }

  async apiCandidatosCrearVariosPost(params?: { nombreAlianza?: string; body?: Array<Candidato> }): Promise<void> {
    await this.supabase.rpc('candidatos_crear_varios', {
      p_body: params?.body ?? [],
      p_nombre_alianza: params?.nombreAlianza,
    });
  }

  async apiCandidatosIdPut(params: { id: string; nombreAlianza?: string; body?: Candidato }): Promise<void> {
    await this.supabase.rpc('candidatos_actualizar', {
      p_id: params.id,
      p_body: params.body ?? {},
      p_nombre_alianza: params.nombreAlianza,
    });
  }

  async apiCandidatosCambiarEstadoIdPut(params: { id: string }): Promise<void> {
    await this.supabase.rpc('candidatos_cambiar_estado', { p_id: params.id });
  }
}
