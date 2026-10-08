import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule, MatIconButton } from '@angular/material/button';

@Component({
  selector: 'app-modal',
  imports: [MatIconModule, MatIconButton, MatButtonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})
export class Modal {
  @Input() titulo = '';
  @Input() subtitulo = '';
  @Input() ancho = '700px';
  @Input() mostrarFooter = false;
  @Input() textoCancelar = 'Cancelar';
  @Input() textoConfirmar = 'Aceptar';

  @Output() cerrar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
  @Output() confirmar = new EventEmitter<void>();

  cerrarModal(): void {
    this.cerrar.emit();
  }

  cancelarModal(): void {
    this.cancelar.emit();
  }

  confirmarModal(): void {
    this.confirmar.emit();
  }
}
