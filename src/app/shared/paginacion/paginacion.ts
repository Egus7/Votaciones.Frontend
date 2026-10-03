import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ConfigPage } from '../../Config';

@Component({
  selector: 'app-paginacion',
  imports: [MatIconModule],
  templateUrl: './paginacion.html',
  styleUrl: './paginacion.css',
})
export class Paginacion {
  @Input() paginaActual = ConfigPage.page;
  @Input() pageSize = ConfigPage.RowPorPagina;
  @Input() totalPages = 0;
  @Input() totalRegistros = 0;

  @Output() paginaCambio = new EventEmitter<number>();

  get paginas(): (number | string)[] {
    const total = this.totalPages;
    const actual = this.paginaActual;

    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }
    if (actual <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }

    if (actual >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, '...', actual - 2, actual - 1, actual, actual + 1, actual + 2, '...', total];
  }

  get inicioRegistro(): number {
    if (this.totalRegistros === 0) {
      return 0;
    }
    return (this.paginaActual - 1) * this.pageSize + 1;
  }

  get finRegistro(): number {
    return Math.min(this.paginaActual * this.pageSize, this.totalRegistros);
  }

  irPrimeraPagina(): void {
    if (this.paginaActual <= 1) return;
    this.paginaCambio.emit(1);
  }

  irUltimaPagina(): void {
    if (this.paginaActual >= this.totalPages) return;
    this.paginaCambio.emit(this.totalPages);
  }

  paginaAnterior(): void {
    if (this.paginaActual <= 1) {
      return;
    }
    this.paginaCambio.emit(this.paginaActual - 1);
  }

  paginaSiguiente(): void {
    if (this.paginaActual >= this.totalPages) {
      return;
    }
    this.paginaCambio.emit(this.paginaActual + 1);
  }

  irPagina(pagina: number | string): void {
    if (typeof pagina !== 'number') {
      return;
    }
    if (pagina === this.paginaActual) {
      return;
    }
    this.paginaCambio.emit(pagina);
  }
}
