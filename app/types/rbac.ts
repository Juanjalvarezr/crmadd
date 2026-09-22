export const ROLES = {
  admin: 'admin',
  editor: 'editor',
  viewer: 'viewer',
} as const;

export type Role = keyof typeof ROLES;
export type RoleValue = (typeof ROLES)[Role];

export const ROLE_ORDER: Record<RoleValue, number> = {
  [ROLES.admin]: 3,
  [ROLES.editor]: 2,
  [ROLES.viewer]: 1,
};

export const PROTECTED_ROUTES: Record<string, RoleValue> = {
  '/configuracion': ROLES.admin,
  '/contratos': ROLES.admin,
  '/finanzas': ROLES.admin,
};

export const hasRoleAccess = (userRole: RoleValue, required: RoleValue): boolean => {
  return ROLE_ORDER[userRole] >= ROLE_ORDER[required];
};
