export const Enlace = {
  Login: 'login',
  Home: 'home',
  Admin: 'admin',
  Votaciones: 'votaciones',
};

export const EnlaceSub = {
  // votaciones
  Elecciones: 'elecciones',
  Listas: 'listas-electorales',
  Candidatos: 'candidatos',
  Mesas: 'mesas-electorales',
  Actas: 'actas',
  Resultados: 'resultados',
  // seguridad
  Seguridad: 'seguridad',
  Usuarios: 'usuarios',
  Roles: 'roles',
  Bitacora: 'bitacora',
  // configuracion
  Parametros: 'parametros',
};

export enum EstadoSesion {
  NoAutenticado,
  Autenticado,
  Expirado,
  Invalido,
}

export const ConfigPage = {
  page: 1,
  RowPorPagina: 5,
};

export const Tablas = {
  Eleccion: 'Eleccion',
  ListaElectoral: 'ListaElectoral',
  Candidato: 'Candidato',
  MesaElectoral: 'MesaElectoral',
  Actas: 'ActaEleccion',
  //seguridad
  Usuario: 'AdmUsuario',
  Rol: 'AdmRol',
};

export const Permisos = {
  ELECCIONES_VIEW: 'elecciones.view',
  ELECCIONES_CREATE: 'elecciones.create',
  ELECCIONES_EDIT: 'elecciones.edit',

  LISTAS_VIEW: 'listas.view',
  LISTAS_CREATE: 'listas.create',
  LISTAS_EDIT: 'listas.edit',

  CANDIDATOS_VIEW: 'candidatos.view',
  CANDIDATOS_CREATE: 'candidatos.create',
  CANDIDATOS_EDIT: 'candidatos.edit',

  MESAS_VIEW: 'mesas.view',
  MESAS_CREATE: 'mesas.create',
  MESAS_EDIT: 'mesas.edit',

  ACTAS_VIEW: 'actas.view',
  ACTAS_REGISTRAR: 'actas.registrar',
  ACTAS_EDITAR: 'actas.editar',
  ACTAS_VALIDAR: 'actas.validar',

  RESULTADOS_VIEW: 'resultados.view',

  USUARIOS_VIEW: 'usuarios.view',
  USUARIOS_CREATE: 'usuarios.create',
  USUARIOS_EDIT: 'usuarios.edit',

  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_EDIT: 'roles.edit',

  BITACORA_VIEW: 'bitacora.view',
} as const;
