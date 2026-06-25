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
export async function requireAdmin(user: User | null | undefined, _roles?: string[]): Promise<void> {
	requireAuth(user);
}

/**
 * Fetches all active permission keys for the given list of roles.
 * Currently returns all default permissions as authorization is not yet active.
 */
export async function getPermissionsForRoles(_roles: string[]): Promise<string[]> {
	return [
		'salary_structure_view',
		'salary_structure_create',
		'salary_structure_edit',
		'payroll_view',
		'payroll_upload'
	];
}

/**
 * Ensures that the user has a specific permission.
 * Currently just checks authentication since authorization is not active.
 */
export async function requirePermission(
	user: User | null | undefined,
	_roles: string[] | undefined,
	_permission: string
): Promise<void> {
	requireAuth(user);
}
