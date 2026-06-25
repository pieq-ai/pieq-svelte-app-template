import { getAppConfig } from '$lib/server/config.js';
import { getPermissionsForRoles } from '$lib/server/guards/permission.guard.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = await locals.auth();
	const sessionUser = session?.user?.id
		? {
				id: session.user.id,
				email: session.user.email ?? '',
				name: session.user.name ?? null
			}
		: null;

	const roles = locals.roles ?? [];
	const permissions = await getPermissionsForRoles(roles);

	return {
		session,
		user: locals.user ?? sessionUser,
		roles,
		permissions,
		config: getAppConfig()
	};
};
