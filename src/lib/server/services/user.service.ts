import * as userDao from '$lib/server/dao/user.dao';
import type { DashboardContext, KeycloakProfile, KeycloakRole, User } from '$lib/types/user';
import { error } from '@sveltejs/kit';

export function hasRole(roles: KeycloakRole[], requiredRole: KeycloakRole): boolean {
	return roles.includes(requiredRole);
}

export async function syncFromKeycloakProfile(profile: KeycloakProfile): Promise<User> {
	if (!profile.id) {
		error(400, 'Keycloak profile is missing subject (id)');
	}

	if (!profile.email) {
		error(400, 'Keycloak profile is missing email');
	}

	return userDao.upsert({
		id: profile.id,
		email: profile.email,
		name: profile.name ?? null
	});
}

export async function getById(id: string): Promise<User> {
	const user = await userDao.findById(id);

	if (!user) {
		error(404, 'User not found');
	}

	return user;
}

export async function getDashboardContext(userId: string, roles: KeycloakRole[]): Promise<DashboardContext> {
	const user = await getById(userId);

	return {
		user,
		roles,
		stats: {
			memberSince: user.createdAt?.toISOString().slice(0, 10) ?? '—',
			roleCount: roles.length
		}
	};
}
