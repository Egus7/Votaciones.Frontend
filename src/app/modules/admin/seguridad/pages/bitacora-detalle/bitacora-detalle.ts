import { Component, Inject } from '@angular/core';
import { BitacoraDto } from '../../../../../api/models/bitacora-dto';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe, JsonPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Tablas } from '../../../../../Config';

@Component({
  selector: 'app-bitacora-detalle',
  imports: [MatIconModule, DatePipe, JsonPipe, MatButtonModule],
  templateUrl: './bitacora-detalle.html',
  styleUrl: './bitacora-detalle.css',
})
export class BitacoraDetalle {
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: BitacoraDto,
    private dialogRef: MatDialogRef<BitacoraDetalle>,
  ) {}

  readonly modulos = [
    { valor: Tablas.Eleccion, nombre: 'Elecciones' },
    { valor: Tablas.ListaElectoral, nombre: 'Listas electorales' },
    { valor: Tablas.Candidato, nombre: 'Candidatos' },
    { valor: Tablas.MesaElectoral, nombre: 'Mesas electorales' },
    { valor: Tablas.Actas, nombre: 'Actas' },
    { valor: Tablas.Usuario, nombre: 'Usuarios' },
    { valor: Tablas.Rol, nombre: 'Roles' },
  ];

  obtenerJson(valor: string | null | undefined): unknown {
    if (!valor) {
      return null;
    }
    try {
      return JSON.parse(valor);
    } catch {
      return valor;
    }
  }

  obtenerNombreModulo(tabla: string | undefined): string {
    const modulo =
      this.modulos.find((item) => item.valor === tabla);

    return modulo?.nombre ?? tabla ?? '—';
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
