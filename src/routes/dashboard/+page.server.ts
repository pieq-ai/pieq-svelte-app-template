import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

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
		showAdminSection: locals.roles.includes('admin')
	};
};
