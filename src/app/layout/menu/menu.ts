import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AuthCoreServiceCore } from '../../core/auth/auth-core.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Enlace, EnlaceSub } from '../../Config';
import { MatIconButton } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-menu',
  imports: [MatIconModule, RouterLink, RouterLinkActive, MatIconButton, MatTooltipModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {
  constructor(
    private authService: AuthCoreServiceCore,
    private router: Router,
  ) {}

  abierto = input(true);
  menuToggle = output<void>();

  logout() {
    this.authService.logout();
  }

  protected readonly Enlace = Enlace;
  protected readonly EnlaceSub = EnlaceSub;
}
