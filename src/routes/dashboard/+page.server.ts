import { redirect, error } from '@sveltejs/kit';
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

    if (canAccess(locals.user, 'dashboard:manager')) {
        throw redirect(302, '/dashboard/manager');
    }

    if (canAccess(locals.user, 'dashboard:employee')) {
        throw redirect(302, '/dashboard/employee');
    }

    throw error(403, 'Unauthorized: You do not have permission to access any dashboard.');
};
