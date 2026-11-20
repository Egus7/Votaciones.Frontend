import { Injectable } from '@angular/core';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { AdmUsuario } from '../models/adm-usuario';
import { UsuarioDto } from '../models/usuario-dto';
import { UsuarioDtoPaginacionDto } from '../models/usuario-dto-paginacion-dto';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  constructor(private supabase: SupabaseService) {}

  apiUsuariosPaginacionGet$Json(params?: {
    pagina?: number;
    pageSize?: number;
    buscar?: string;
  }): Promise<UsuarioDtoPaginacionDto> {
    return this.supabase.rpc('usuarios_paginacion', {
      p_pagina: params?.pagina,
      p_page_size: params?.pageSize,
      p_buscar: params?.buscar,
    });
  }

  apiUsuariosIdGet$Json(params: { id: string }): Promise<UsuarioDto> {
    return this.supabase.rpc('usuarios_obtener', { p_id: params.id });
  }

  apiUsuariosPermisosGet$Json(): Promise<Array<string>> {
    return this.supabase.rpc('usuarios_permisos');
  }

  // Crear y editar usuarios pasa por la Edge Function porque también modifica Supabase Auth.
  apiUsuariosPost$Json(params?: { body?: AdmUsuario }): Promise<AdmUsuario> {
    return this.supabase.invocar('usuarios-admin', { accion: 'crear', usuario: params?.body ?? {} });
  }

  async apiUsuariosIdPut(params: { id: string; body?: AdmUsuario }): Promise<void> {
    await this.supabase.invocar('usuarios-admin', { accion: 'actualizar', id: params.id, usuario: params.body ?? {} });
  }

  async apiUsuariosCambiarEstadoIdPut(params: { id: string }): Promise<void> {
    await this.supabase.rpc('usuarios_cambiar_estado', { p_id: params.id });
  }
}
