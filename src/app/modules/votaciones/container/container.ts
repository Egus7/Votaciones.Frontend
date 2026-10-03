import { Component, inject, OnInit } from '@angular/core';
import { EleccionContexto } from '../../../core/services/eleccion-contexto';
import { Router, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MensajeService } from '../../../core/mensajes/mensaje-service';
import { Enlace } from '../../../Config';

@Component({
  selector: 'app-container',
  imports: [RouterOutlet, MatIconModule],
  templateUrl: './container.html',
  styleUrl: './container.css',
})
export class Container implements OnInit {
  private readonly eleccionContexto = inject(EleccionContexto);
  readonly inicializado = this.eleccionContexto.inicializado;

  constructor(
    private router: Router,
    private swalMensaje: MensajeService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.eleccionContexto.cargarElecciones();
    const sesionValida = await this.eleccionContexto.cargar();
    // Si la sesión expiró, no mostrar el mensaje de elección.
    if (!sesionValida) {
      return;
    }

    if (!this.eleccionContexto.eleccion()) {
      await this.swalMensaje.informacion(
        'Elección no seleccionada', 'Debe seleccionar una elección para acceder a este módulo.',);
      await this.router.navigate([`/${Enlace.Home}`]);
    }
  }

}
