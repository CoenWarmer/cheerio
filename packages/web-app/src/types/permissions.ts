/**
 * User permission types
 * These should match the enum values in the database
 */

export type UserPermission = 'admin' | 'tracker' | 'supporter';

export const USER_PERMISSIONS = {
  ADMIN: 'admin' as UserPermission,
  TRACKER: 'tracker' as UserPermission,
  SUPPORTER: 'supporter' as UserPermission,
} as const;

/**
 * Check if a permission has admin rights
 */
export function isAdmin(
  permission: UserPermission | null | undefined
): boolean {
  return permission === USER_PERMISSIONS.ADMIN;
}

/**
 * Check if a permission has tracker rights (tracker or admin)
 */
export function canTrack(
  permission: UserPermission | null | undefined
): boolean {
  return (
    permission === USER_PERMISSIONS.ADMIN ||
    permission === USER_PERMISSIONS.TRACKER
  );
}

/**
 * Check if a permission has supporter rights (any authenticated user)
 */
export function canSupport(
  permission: UserPermission | null | undefined
): boolean {
  return permission !== null && permission !== undefined;
}

/**
 * Get permission display name
 */
export function getPermissionLabel(permission: UserPermission): string {
  const labels: Record<UserPermission, string> = {
    admin: 'Administrator',
    tracker: 'Tracker',
    supporter: 'Supporter',
  };
  return labels[permission];
}

/**
 * Get permission description
 */
export function getPermissionDescription(permission: UserPermission): string {
  const descriptions: Record<UserPermission, string> = {
    admin: 'Full access to all features and settings',
    tracker: 'Can track location and participate in events',
    supporter: 'Can view and support events',
  };
  return descriptions[permission];
}
