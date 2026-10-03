import { Component, OnInit, signal } from '@angular/core';
import { Eleccion } from '../../../../api/models/eleccion';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { EleccionContexto } from '../../../../core/services/eleccion-contexto';
import { Router } from '@angular/router';
import { Enlace } from '../../../../Config';
import { MensajeService } from '../../../../core/mensajes/mensaje-service';
import { ManejoMensajesError } from '../../../../core/mensajes/manejo-mensajes-error';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, MatButton, MatIcon],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  cargando = signal(false);

  constructor(
    private eleccionContexto: EleccionContexto,
    private router: Router,
    private swalMensaje: MensajeService,
    private manejoMensajeError: ManejoMensajesError,
  ) {}

  get elecciones() {
    return this.eleccionContexto.elecciones;
  }

  async ngOnInit() {
    this.eleccionContexto.limpiar();
    await this.cargarElecciones();
  }

  async cargarElecciones(): Promise<void> {
    this.cargando.set(true);

    try {
      await this.eleccionContexto.cargarElecciones();
    } catch (error) {
      const mensajeError = this.manejoMensajeError.getMessage(error);
      void this.swalMensaje.error('Error', mensajeError);
    }
    finally {
      this.cargando.set(false);
    }
  }

  seleccionarEleccion(eleccion: Eleccion): void {
    this.eleccionContexto.seleccionar(eleccion);
    return void this.router.navigate([Enlace.Votaciones]);
  }

}
