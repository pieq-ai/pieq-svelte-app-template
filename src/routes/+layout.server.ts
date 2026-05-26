import { getAppConfig } from '$lib/server/config.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		session: await locals.auth(),
		user: locals.user,
		roles: locals.roles,
		config: getAppConfig()
	};
};
