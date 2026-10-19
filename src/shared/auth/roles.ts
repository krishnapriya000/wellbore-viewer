import { ROLES, type Role } from './types';

/**
 * Permissions the UI asks about. Map them to roles here, in one place, so a component
 * asks "can I upload surveys?" rather than "am I an engineer?".
 *
 * These checks only decide what the UI shows. The API enforces the same rules from the
 * `roles` claim in its access token.
 */
export const PERMISSIONS = {
  'survey:view': 'Wellbore.Viewer',
  'survey:upload': 'Wellbore.Engineer',
  'survey:addLive': 'Wellbore.Engineer',
  'geology:edit': 'Wellbore.Engineer',
  'events:edit': 'Wellbore.Engineer',
  'construction:edit': 'Wellbore.Engineer',
  'well:configure': 'Wellbore.Admin',
} as const satisfies Record<string, Role>;

export type Permission = keyof typeof PERMISSIONS;

/** Higher roles include lower ones: Admin ⊃ Engineer ⊃ Viewer. */
const rank = (r: Role) => ROLES.indexOf(r);

export function hasRole(userRoles: readonly Role[], required: Role): boolean {
  return userRoles.some((r) => rank(r) >= rank(required));
}

export function can(userRoles: readonly Role[], permission: Permission): boolean {
  return hasRole(userRoles, PERMISSIONS[permission]);
}

/** Keeps only role strings this app knows; unknown values in a token are ignored, never trusted. */
export function toRoles(claim: unknown): Role[] {
  if (!Array.isArray(claim)) return [];
  return claim.filter((v): v is Role => (ROLES as readonly string[]).includes(v as string));
}
