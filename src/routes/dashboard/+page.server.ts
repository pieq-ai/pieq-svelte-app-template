import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/');
	}
	if (locals.roles?.includes('admin')) {
		redirect(302, '/dashboard/admin');
	}
	if (locals.roles?.includes('finance') || locals.roles?.includes('finance_manager')) {
		redirect(302, '/dashboard/finance');
	}
	redirect(302, '/dashboard/employee');
};
