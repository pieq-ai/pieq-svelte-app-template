import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { canAccess } from '$lib/authz';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/');
	}
	if (canAccess(locals.user, 'dashboard:admin')) {
        throw redirect(302, '/dashboard/admin');
    }

    if (canAccess(locals.user, 'dashboard:finance')) {
        throw redirect(302, '/dashboard/finance');
    }

    throw redirect(302, '/dashboard/employee');
};
