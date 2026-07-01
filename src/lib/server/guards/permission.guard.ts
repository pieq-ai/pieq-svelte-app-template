import { error } from '@sveltejs/kit';
import { canAccess } from '$lib/authz';
import type { AuthzUser } from '$lib/authz';

/**
 * Ensures that the user is authenticated.
 */
export function requireAuth(user: AuthzUser | null | undefined): void {
	if (!user) {
		throw error(401, 'Authentication required');
	}
}

/**
 * Ensures that the user has administrator privileges.
 */
export function requireAdmin(user: AuthzUser | null | undefined): void {
	requireAuth(user);
    requirePermission(user, 'dashboard:admin');
}

/**
 * Ensures that the user has a specific permission.
 * Throws standard SvelteKit HTTP errors if authorization fails.
 * 
 * @param user The current authenticated user object (from locals.user)
 * @param permission The business capability being requested (e.g. 'employee:view', 'payroll:upload')
 */
export function requirePermission(user: AuthzUser | null | undefined, permission: string): void {
	requireAuth(user);
	if (!canAccess(user, permission)) {
		throw error(403, 'You do not have permission to access this resource.');
	}
}
