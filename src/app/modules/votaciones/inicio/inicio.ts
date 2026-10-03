import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { EleccionContexto } from '../../../core/services/eleccion-contexto';
import { RouterLink } from '@angular/router';
import { Enlace, EnlaceSub } from '../../../Config';
import { MensajeService } from '../../../core/mensajes/mensaje-service';
import { ManejoMensajesError } from '../../../core/mensajes/manejo-mensajes-error';

@Component({
  selector: 'app-inicio',
  imports: [MatIconModule, RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  constructor(
    private eleccionContexto: EleccionContexto,
  ) {}

  get eleccion() {
    return this.eleccionContexto.eleccion;
  }

  protected readonly EnlaceSub = EnlaceSub;
  protected readonly Enlace = Enlace;
}
