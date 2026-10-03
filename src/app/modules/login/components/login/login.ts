import { Component, signal } from '@angular/core';
import { LoginDto } from '../../../../api/models/login-dto';
import { FormsModule } from '@angular/forms';
import { AuthCoreServiceCore } from '../../../../core/auth/auth-core.service';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ManejoMensajesError } from '../../../../core/mensajes/manejo-mensajes-error';

@Component({
  selector: 'app-login',
  imports: [FormsModule, MatFormField, MatLabel, MatButtonModule, MatInput, MatIconModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginDto: LoginDto = {};
  errorLogin = signal('');
  mostrarPassword = signal(false);
  cargando = signal(false);

  constructor(
    private authService: AuthCoreServiceCore,
    private router: Router,
    private manejoMensajesError: ManejoMensajesError,
  ) {}

  async iniciarSesion() {
    this.errorLogin.set('');

    if (!this.loginDto.usuario?.trim()) {
      this.errorLogin.set('Ingrese su usuario.');
      return;
    }
    if (!this.loginDto.password) {
      this.errorLogin.set('Ingrese su contraseña.');
      return;
    }
    if (this.cargando()) {
      return;
    }
    this.cargando.set(true);

    try {
      await this.authService.login(this.loginDto);
      await this.router.navigate(['/home']);
    } catch (error: any) {
      this.errorLogin.set(this.manejoMensajesError.getMessage(error));
    } finally {
      this.cargando.set(false);
    }
  }
}
