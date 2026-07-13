import { error, redirect } from '@sveltejs/kit';
import { canAccess } from '$lib/authz';
import type { AuthzUser } from '$lib/authz';

/**
 * Ensures that the user is authenticated.
 */
export function requireAuth(user: AuthzUser | null | undefined): void {
	if (!user) {
        try {
		    error(401, 'Authentication required');
        } catch (err: any) {
            err.message = 'Authentication required';
            throw err;
        }
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
export function requirePermission(user: AuthzUser | null | undefined, permission: string, fallbackUrl?: string): void {
	requireAuth(user);
	if (!canAccess(user, permission)) {
        if (fallbackUrl) {
            throw redirect(303, fallbackUrl);
        }
        const roleName = user?.system_role_name || 'User';
        try {
		    error(403, `${roleName} cannot access ${permission} or does not have the required permissions.`);
        } catch (err: any) {
            err.message = `${roleName} cannot access ${permission} or does not have the required permissions.`;
            throw err;
        }
	}
}
