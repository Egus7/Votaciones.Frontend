import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Usuarios } from './seguridad/pages/usuarios/usuarios';
import { EnlaceSub, Permisos } from '../../Config';
import { UsuariosForm } from './seguridad/components/usuarios-form/usuarios-form';
import { PermisosGuard } from '../../core/guards/permisos.guard';
import { Roles } from './seguridad/pages/roles/roles';
import { RolesForm } from './seguridad/components/roles-form/roles-form';
import { Bitacora } from './seguridad/pages/bitacora/bitacora';
import { Elecciones } from './elecciones/pages/elecciones';
import { EleccionesForm } from './elecciones/elecciones-form/elecciones-form';

const routes: Routes = [
  //Elecciones
  {
    path: EnlaceSub.Elecciones,
    component: Elecciones,
    canActivate: [PermisosGuard],
    data: {
      permiso: Permisos.ELECCIONES_VIEW,
    },
  },
  {
    path: `${EnlaceSub.Elecciones}/new`,
    component: EleccionesForm,
    canActivate: [PermisosGuard],
    data: {
      permiso: Permisos.ELECCIONES_VIEW,
    }
  },
  {
    path: `${EnlaceSub.Elecciones}/edit/:id`,
    component: EleccionesForm,
    canActivate: [PermisosGuard],
    data: {
      permiso: Permisos.ELECCIONES_VIEW,
    }
  },
  //Usuarios
  {
    path: `${EnlaceSub.Seguridad}/${EnlaceSub.Usuarios}`,
    component: Usuarios,
    canActivate: [PermisosGuard],
    data: {
      permiso: Permisos.USUARIOS_VIEW,
    },
  },
  {
    path: `${EnlaceSub.Seguridad}/${EnlaceSub.Usuarios}/new`,
    component: UsuariosForm,
    canActivate: [PermisosGuard],
    data: {
      permiso: Permisos.USUARIOS_VIEW,
    },
  },
  {
    path: `${EnlaceSub.Seguridad}/${EnlaceSub.Usuarios}/edit/:id`,
    component: UsuariosForm,
    canActivate: [PermisosGuard],
    data: {
      permiso: Permisos.USUARIOS_VIEW,
    },
  },
  //Roles
  {
    path: `${EnlaceSub.Seguridad}/${EnlaceSub.Roles}`,
    component: Roles,
    canActivate: [PermisosGuard],
    data: {
      permiso: Permisos.ROLES_VIEW,
    },
  },
  {
    path: `${EnlaceSub.Seguridad}/${EnlaceSub.Roles}/new`,
    component: RolesForm,
    canActivate: [PermisosGuard],
    data: {
      permiso: Permisos.ROLES_VIEW,
    },
  },
  {
    path: `${EnlaceSub.Seguridad}/${EnlaceSub.Roles}/edit/:id`,
    component: RolesForm,
    canActivate: [PermisosGuard],
    data: {
      permiso: Permisos.ROLES_VIEW,
    },
  },
  //Bitacora
  {
    path: `${EnlaceSub.Seguridad}/${EnlaceSub.Bitacora}`,
    component: Bitacora,
    canActivate: [PermisosGuard],
    data: {
      permiso: Permisos.BITACORA_VIEW,
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
