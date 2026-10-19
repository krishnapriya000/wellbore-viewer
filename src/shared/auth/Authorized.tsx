import type { ReactNode } from 'react';
import { useAuth } from './useAuth';
import type { Permission } from './roles';

/**
 * Shows children only when the user has the permission. Display logic only —
 * the API must enforce the same rule.
 */
export function Authorized({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { can } = useAuth();
  return <>{can(permission) ? children : fallback}</>;
}
