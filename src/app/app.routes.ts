import { Routes } from '@angular/router';
import { Enlace } from './Config';
import { AuthGuard } from './core/guards/auth.guard';
import { RedirectGuard } from './core/guards/redirect.guard';
import { Layout } from './layout/layout';

export const routes: Routes = [
  {
    path: Enlace.Login,
    canActivate: [RedirectGuard],
    loadChildren: () => import('./modules/login/login-module').then((m) => m.LoginModule),
  },
  // APLICACIÓN AUTENTICADA
  {
    path: '',
    component: Layout,
    canActivate: [AuthGuard],
    children: [
      // HOME
      {
        path: Enlace.Home,
        loadChildren: () => import('./modules/home/home-module').then((m) => m.HomeModule),
      },
      // ADMIN
      {
        path: Enlace.Admin,
        loadChildren: () => import('./modules/admin/admin-module').then((m) => m.AdminModule),
      },
      // VOTACIONES
      {
        path: Enlace.Votaciones,
        loadChildren: () =>
          import('./modules/votaciones/votaciones-module').then((m) => m.VotacionesModule),
      },
      // Si quieres que "/" también lleve a Home
      {
        path: '',
        redirectTo: Enlace.Home,
        pathMatch: 'full',
      },
    ],
  },
  // RUTA DESCONOCIDA
  {
    path: '**',
    redirectTo: Enlace.Home,
  },
];
