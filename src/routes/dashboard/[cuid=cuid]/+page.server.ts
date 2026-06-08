import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		redirect(302, '/');
	}
	if (params.cuid !== locals.user.id) {
		error(403, 'You can only view your own profile');
	}

	return { user: locals.user };
};
