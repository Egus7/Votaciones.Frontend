import { Injectable } from '@angular/core';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { RolDto } from '../models/rol-dto';
import { RolDtoPaginacionDto } from '../models/rol-dto-paginacion-dto';

@Injectable({ providedIn: 'root' })
export class RolesService {
  constructor(private supabase: SupabaseService) {}

  apiRolesPaginacionGet$Json(params?: { pagina?: number; pageSize?: number; buscar?: string }): Promise<RolDtoPaginacionDto> {
    return this.supabase.rpc('roles_paginacion', {
      p_pagina: params?.pagina,
      p_page_size: params?.pageSize,
      p_buscar: params?.buscar,
    });
  }

  apiRolesIdGet$Json(params: { id: string }): Promise<RolDto> {
    return this.supabase.rpc('roles_obtener', { p_id: params.id });
  }

  apiRolesPost$Json(params?: { body?: RolDto }): Promise<RolDto> {
    return this.supabase.rpc('roles_crear', { p_body: params?.body ?? {} });
  }

  async apiRolesIdPut(params: { id: string; body?: RolDto }): Promise<void> {
    await this.supabase.rpc('roles_actualizar', { p_id: params.id, p_body: params.body ?? {} });
  }

  async apiRolesCambiarEstadoIdPut(params: { id: string }): Promise<void> {
    await this.supabase.rpc('roles_cambiar_estado', { p_id: params.id });
  }
}
