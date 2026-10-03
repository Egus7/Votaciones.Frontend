import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './navbar/navbar';
import { Menu } from './menu/menu';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Navbar, Menu],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  menuAbierto = signal(false);

  toggleMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }
}
