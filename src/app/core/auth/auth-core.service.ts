import { Injectable } from '@angular/core';
import { LoginDto } from '../../api/models/login-dto';
import { LoginResponseDto } from '../../api/models/login-response-dto';
import { AuthService as ApiAuthService } from '../../api/services/auth.service';
import { EstadoSesion } from '../../Config';
import { Router } from '@angular/router';
import { supabase, SupabaseConfig } from '../supabase/supabase.service';

interface SesionGuardada {
  access_token?: string;
  refresh_token?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthCoreServiceCore {
  private readonly userKey = 'auth_user';

  constructor(
    private apiAuthService: ApiAuthService,
    private router: Router,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const response = await this.apiAuthService.apiAuthLoginPost$Json({
      body: loginDto,
    });

    localStorage.setItem(this.userKey, JSON.stringify(response));
    return response;
  }

  // Token de acceso actual de Supabase (se renueva automáticamente con el refresh token).
  getToken(): string | null {
    return this.leerSesion()?.access_token ?? null;
  }

  getUsuario(): LoginResponseDto | null {
    const usuario = localStorage.getItem(this.userKey);
    return usuario ? JSON.parse(usuario) : null;
  }

  logout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  clearSession(): void {
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(SupabaseConfig.storageKey);
    void supabase.auth.signOut({ scope: 'local' });
  }

  getEstadoSesion(): EstadoSesion {
    const sesion = this.leerSesion();
    // No existe sesión
    if (!sesion) {
      return EstadoSesion.NoAutenticado;
    }
    // Sin tokens no se puede renovar la sesión
    if (!sesion.access_token || !sesion.refresh_token) {
      return EstadoSesion.Invalido;
    }
    // Supabase renueva el access token con el refresh token; la sesión sigue vigente hasta cerrarla
    return EstadoSesion.Autenticado;
  }

  isAuthenticated(): boolean {
    return this.getEstadoSesion() === EstadoSesion.Autenticado;
  }

  private leerSesion(): SesionGuardada | null {
    try {
      const valor = localStorage.getItem(SupabaseConfig.storageKey);
      return valor ? (JSON.parse(valor) as SesionGuardada) : null;
    } catch {
      return null;
    }
  }
}
