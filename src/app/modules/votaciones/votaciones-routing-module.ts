import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Inicio } from './pages/inicio/inicio';
import { Candidatos } from './pages/candidatos/candidatos';
import { Container } from './container/container';
import { EnlaceSub, Permisos } from '../../Config';
import { CandidatosForm } from './components/candidatos-form/candidatos-form';
import { ListasElectoral } from './pages/listas-electoral/listas-electoral';
import { ListasElectoralForm } from './components/listas-electoral-form/listas-electoral-form';
import { MesasElectoral } from './pages/mesas-electoral/mesas-electoral';
import { MesasElectoralForm } from './components/mesas-electoral-form/mesas-electoral-form';
import { PermisosGuard } from '../../core/guards/permisos.guard';
import { Actas } from './pages/actas/actas';
import { ActasForm } from './components/actas-form/actas-form';
import { Resultados } from './pages/resultados/resultados';
import { ResultadosGrid } from './components/resultados-grid/resultados-grid';

const routes: Routes = [
  {
    path: '',
    component: Container,
    children: [
      {
        path: '',
        component: Inicio,
      },
      //Candidatos
      {
        path: EnlaceSub.Candidatos,
        component: Candidatos,
        canActivate: [PermisosGuard],
        data: {
          permiso: Permisos.CANDIDATOS_VIEW,
        },
      },
      {
        path: `${EnlaceSub.Candidatos}/new`,
        component: CandidatosForm,
        canActivate: [PermisosGuard],
        data: {
          permiso: Permisos.CANDIDATOS_VIEW,
        },
      },
      {
        path: `${EnlaceSub.Candidatos}/edit/:id`,
        component: CandidatosForm,
        canActivate: [PermisosGuard],
        data: {
          permiso: Permisos.CANDIDATOS_VIEW,
        },
      },
      //MesasElectoral
      {
        path: EnlaceSub.Mesas,
        component: MesasElectoral,
        canActivate: [PermisosGuard],
        data: {
          permiso: Permisos.MESAS_VIEW,
        },
      },
      {
        path: `${EnlaceSub.Mesas}/new`,
        component: MesasElectoralForm,
        canActivate: [PermisosGuard],
        data: {
          permiso: Permisos.MESAS_VIEW,
        },
      },
      {
        path: `${EnlaceSub.Mesas}/edit/:id`,
        component: MesasElectoralForm,
        canActivate: [PermisosGuard],
        data: {
          permiso: Permisos.MESAS_VIEW,
        },
      },
      //ActasElectoral
      {
        path: `${EnlaceSub.Actas}`,
        component: Actas,
        canActivate: [PermisosGuard],
        data: {
          permiso: Permisos.ACTAS_VIEW,
        },
      },
      {
        path: `${EnlaceSub.Actas}/new`,
        component: ActasForm,
        canActivate: [PermisosGuard],
        data: {
          permiso: Permisos.ACTAS_VIEW,
        },
      },
      {
        path: `${EnlaceSub.Actas}/view/:id`,
        component: ActasForm,
        canActivate: [PermisosGuard],
        data: {
          permiso: Permisos.ACTAS_VIEW,
        },
      },
      {
        path: `${EnlaceSub.Actas}/edit/:id`,
        component: ActasForm,
        canActivate: [PermisosGuard],
        data: {
          permiso: Permisos.ACTAS_VIEW,
        },
      },
      //Resultados
      {
        path: `${EnlaceSub.Resultados}`,
        component: Resultados,
        canActivate: [PermisosGuard],
        data: {
          permiso: Permisos.RESULTADOS_VIEW,
        },
      },
      {
        path: `${EnlaceSub.Resultados}/reportes`,
        component: ResultadosGrid,
        canActivate: [PermisosGuard],
        data: {
          permiso: Permisos.RESULTADOS_VIEW,
        }
      },
    ],
  },
  //ListaElectoral
  {
    path: `${EnlaceSub.Listas}`,
    component: ListasElectoral,
    canActivate: [PermisosGuard],
    data: {
      permiso: Permisos.LISTAS_VIEW,
    },
  },
  {
    path: `${EnlaceSub.Listas}/new`,
    component: ListasElectoralForm,
    canActivate: [PermisosGuard],
    data: {
      permiso: Permisos.LISTAS_VIEW,
    },
  },
  {
    path: `${EnlaceSub.Listas}/edit/:id`,
    component: ListasElectoralForm,
    canActivate: [PermisosGuard],
    data: {
      permiso: Permisos.LISTAS_VIEW,
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VotacionesRoutingModule {}
