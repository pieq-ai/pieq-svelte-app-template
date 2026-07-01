import { error } from '@sveltejs/kit';
import { canAccess } from '$lib/authz';
import type { AuthzUser } from '$lib/authz';

/**
 * Server-side guard to enforce permissions on protected routes and API endpoints.
 * Throws standard SvelteKit HTTP errors if authorization fails.
 * 
 * @param user The current authenticated user object (from locals.user)
 * @param permission The business capability being requested (e.g. 'employee:view', 'payroll:upload')
 */
export function requirePermission(user: AuthzUser | null | undefined, permission: string) {
    if (!user) {
        // User is not authenticated at all
        throw error(401, 'Authentication required');
    }

    if (!canAccess(user, permission)) {
        // User is authenticated but lacks the specific permission
        throw error(403, 'You do not have permission to access this resource.');
    }
}
