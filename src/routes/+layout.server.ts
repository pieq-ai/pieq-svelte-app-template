import { getAppConfig } from '$lib/server/config.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = locals.session !== undefined ? locals.session : await locals.auth();
	return {
		session,
		user: locals.user,
		roles: locals.roles,
		config: getAppConfig()
	};
};
