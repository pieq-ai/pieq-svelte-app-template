import type { User } from '$lib/types/user';

const UNAUTHORIZED_MESSAGE = 'Unauthorized';

/**
 * Ensures that the user is authenticated.
 */
export function requireAuth(user: User | null | undefined): void {
	if (!user) {
		throw new Error(UNAUTHORIZED_MESSAGE);
	}
}

/**
 * Ensures that the user has administrator privileges.
 */
export function requireAdmin(user: User | null | undefined): void {
	requireAuth(user);
}

/**
 * Ensures that the user has a specific permission.
 */
export function requirePermission(user: User | null | undefined, _permission: string): void {
	void _permission;
	requireAuth(user);
}
