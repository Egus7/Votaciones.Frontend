import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Usuarios } from './seguridad/usuarios/usuarios';
import { EnlaceSub, Permisos } from '../../Config';
import { UsuariosForm } from './seguridad/usuarios/usuarios-form/usuarios-form';
import { PermisosGuard } from '../../core/guards/permisos.guard';
import { Roles } from './seguridad/roles/roles';
import { RolesForm } from './seguridad/roles/roles-form/roles-form';
import { Bitacora } from './seguridad/bitacora/bitacora';

const routes: Routes = [
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
