import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-modal',
  imports: [MatIconModule],
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
