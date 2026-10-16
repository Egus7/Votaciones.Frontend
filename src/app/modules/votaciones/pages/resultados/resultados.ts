import { Component, computed, inject, signal } from '@angular/core';
import { TipoCandidato } from '../../../../api/models/tipo-candidato';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TipoEleccion } from '../../../../api/models/tipo-eleccion';
import { Router, RouterLink } from '@angular/router';
import { EleccionContexto } from '../../../../core/services/eleccion-contexto';
import { MatButtonModule } from '@angular/material/button';
import { Enlace, EnlaceSub } from '../../../../Config';

export interface DignidadResultado {
  tipoCandidato: TipoCandidato;
  nombre: string;
  descripcion: string;
  icono: string;
}
@Component({
  selector: 'app-resultados',
  imports: [FormsModule, MatIconModule, MatButtonModule, RouterLink],
  templateUrl: './resultados.html',
  styleUrl: './resultados.css',
})
export class Resultados {
  private readonly eleccionContexto = inject(EleccionContexto);
  private readonly router = inject(Router);
  // Elección seleccionada
  readonly eleccion = this.eleccionContexto.eleccion;
  // Tipo de elección: General o Seccional.
  readonly tipoEleccion = computed<TipoEleccion | undefined>(() => this.eleccion()?.tipoEleccion);

  readonly cargando = signal(false);

  private readonly dignidadesGenerales: DignidadResultado[] = [
    {
      tipoCandidato: 'Presidente',
      nombre: 'Presidente',
      descripcion: 'Consulte los resultados de la elección presidencial.',
      icono: 'how_to_vote',
    },
  ];
  private readonly dignidadesSeccionales: DignidadResultado[] = [
    {
      tipoCandidato: 'Prefecto',
      nombre: 'Prefecto',
      descripcion: 'Consulte los resultados de la elección de prefectura.',
      icono: 'account_balance',
    },
    {
      tipoCandidato: 'Alcalde',
      nombre: 'Alcalde',
      descripcion: 'Consulte los resultados de la elección de alcaldía.',
      icono: 'supervisor_account',
    },
    {
      tipoCandidato: 'ConcejalUrbano',
      nombre: 'Concejal urbano',
      descripcion: 'Consulte los resultados de concejales urbanos.',
      icono: 'groups',
    },
    {
      tipoCandidato: 'ConcejalRural',
      nombre: 'Concejal rural',
      descripcion: 'Consulte los resultados de concejales rurales.',
      icono: 'groups',
    },
  ];
  // Genera las tarjetas según el tipo de elección.
  readonly dignidadesDisponibles = computed<DignidadResultado[]>(() => {
    switch (this.tipoEleccion()) {
      case 'General':
        return this.dignidadesGenerales;
      case 'Seccional':
        return this.dignidadesSeccionales;

      default:
        return [];
    }
  });

  seleccionarDignidad(dignidad: DignidadResultado): void {
    void this.router.navigate([`${Enlace.Votaciones}/${EnlaceSub.Resultados}/reportes`], {
      state: { dignidad },
    });
  }

}
