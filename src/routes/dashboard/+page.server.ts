import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { canAccess } from '$lib/authz';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/');
	}
	return {
		context: {
			user: locals.user,
			roles: locals.roles,
			stats: {
				memberSince: '—',
				roleCount: locals.roles.length
			}
		},
		showAdminSection: canAccess(locals.user, 'dashboard:admin')
	};
};
