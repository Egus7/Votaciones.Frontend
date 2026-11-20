import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { createClient, FunctionsHttpError, SupabaseClient } from '@supabase/supabase-js';

export const SupabaseConfig = {
  url: 'https://ljuaptdrpiiahiwbmkjj.supabase.co',
  // Clave publicable: es segura en el navegador, los permisos se validan en las RPC (RLS / security definer).
  publishableKey: 'sb_publishable_hISjLUcij8kYhnUZXkXZ7g_t-5Itl4z',
  storageKey: 'votaciones-auth',
};

// Un solo cliente para toda la aplicación (sesión, RPC, Edge Functions y Realtime).
export const supabase: SupabaseClient = createClient(SupabaseConfig.url, SupabaseConfig.publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: SupabaseConfig.storageKey,
  },
});

// Error de negocio devuelto por las RPC o Edge Functions ({ message } como en el backend .NET).
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Códigos que indican sesión inválida o expirada (PostgREST / Postgres).
const CODIGOS_SESION = ['PGRST301', 'PGRST302', 'PGRST303', '28000'];

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  readonly client = supabase;

  constructor(private router: Router) {}

  // Llama a una función RPC de Postgres. Los parámetros null/undefined se omiten para usar el valor por defecto.
  async rpc<T>(funcion: string, parametros?: Record<string, unknown>): Promise<T> {
    const { data, error, status } = await this.client.rpc(funcion, this.limpiar(parametros));
    if (error) {
      throw this.crearError(error.message, status, error.code);
    }
    return data as T;
  }

  // Llama a una Edge Function. Con validarSesion = false un 401 no cierra la sesión (login).
  async invocar<T>(funcion: string, body: object, validarSesion = true): Promise<T> {
    const { data, error } = await this.client.functions.invoke(funcion, { body: body as Record<string, unknown> });
    if (error) {
      let mensaje = error.message;
      let status: number | undefined;
      if (error instanceof FunctionsHttpError) {
        status = error.context.status;
        try {
          const cuerpo = await error.context.json();
          mensaje = cuerpo?.message ?? mensaje;
        } catch {
          // La respuesta no era JSON, se mantiene el mensaje original
        }
      }
      throw validarSesion ? this.crearError(mensaje, status) : new ApiError(mensaje, status);
    }
    return data as T;
  }

  private crearError(mensaje: string, status?: number, codigo?: string): ApiError {
    if (status === 401 || (codigo && CODIGOS_SESION.includes(codigo))) {
      localStorage.removeItem('auth_user');
      void this.client.auth.signOut({ scope: 'local' });
      void this.router.navigate(['/login']);
      return new ApiError('Su sesión ha expirado, por favor inicie sesión nuevamente.', 401);
    }
    return new ApiError(mensaje, status);
  }

  private limpiar(parametros?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!parametros) {
      return undefined;
    }
    return Object.fromEntries(Object.entries(parametros).filter(([, valor]) => valor !== undefined && valor !== null));
  }
}
