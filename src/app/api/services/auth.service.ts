import { Injectable } from '@angular/core';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { LoginDto } from '../models/login-dto';
import { LoginResponseDto } from '../models/login-response-dto';

interface LoginSupabaseResponse extends LoginResponseDto {
  session: { access_token: string; refresh_token: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private supabase: SupabaseService) {}

  // Edge Function "login": permite ingresar con nombre de usuario o correo.
  async apiAuthLoginPost$Json(params?: { body?: LoginDto }): Promise<LoginResponseDto> {
    const { session, ...usuario } = await this.supabase.invocar<LoginSupabaseResponse>('login', params?.body ?? {}, false);
    const { error } = await this.supabase.client.auth.setSession(session);
    if (error) {
      throw error;
    }
    return usuario;
  }
}
