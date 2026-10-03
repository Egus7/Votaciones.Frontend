import { Injectable } from '@angular/core';
import { LoginDto } from '../../api/models/login-dto';
import { LoginResponseDto } from '../../api/models/login-response-dto';
import { AuthService as ApiAuthService } from '../../api/services/auth.service';
import { EstadoSesion } from '../../Config';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthCoreServiceCore {
  private readonly tokenKey = 'auth_token';
  private readonly userKey = 'auth_user';

  constructor(
    private apiAuthService: ApiAuthService,
    private router: Router,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const response = await this.apiAuthService.apiAuthLoginPost$Json({
      body: loginDto,
    });

    if (response.token) {
      localStorage.setItem(this.tokenKey, response.token);
    }

    localStorage.setItem(this.userKey, JSON.stringify(response));
    return response;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUsuario(): LoginResponseDto | null {
    const usuario = localStorage.getItem(this.userKey);
    return usuario ? JSON.parse(usuario) : null;
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    void this.router.navigate(['/login']);
  }
  clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  getEstadoSesion(): EstadoSesion {
    const token = this.getToken();
    // No existe token
    if (!token) {
      return EstadoSesion.NoAutenticado;
    }

    try {
      const partes = token.split('.');
      // Un JWT válido debe tener 3 partes
      if (partes.length !== 3) {
        return EstadoSesion.Invalido;
      }
      const payload = JSON.parse(atob(partes[1]));
      // El claim exp es obligatorio para nuestra validación
      if (!payload.exp) {
        return EstadoSesion.Invalido;
      }
      //Expiro el token
      const expiracion = payload.exp * 1000;
      if (Date.now() >= expiracion) {
        return EstadoSesion.Expirado;
      }
      return EstadoSesion.Autenticado;
    } catch {
      return EstadoSesion.Invalido;
    }
  }
  isAuthenticated(): boolean {
    return this.getEstadoSesion() === EstadoSesion.Autenticado;
  }
}
