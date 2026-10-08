import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { EleccionContexto } from '../../../core/services/eleccion-contexto';
import { RouterLink } from '@angular/router';
import { Enlace, EnlaceSub } from '../../../Config';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-inicio',
  imports: [MatIconModule, RouterLink, MatButtonModule],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  constructor(private eleccionContexto: EleccionContexto) {}

  get eleccion() {
    return this.eleccionContexto.eleccion;
  }

  protected readonly EnlaceSub = EnlaceSub;
  protected readonly Enlace = Enlace;
}
