import { getAppConfig } from '$lib/server/config.js';
import { resolveEmployee } from '$lib/server/services/leave.service.js';
import { getSubordinates } from '$lib/server/dao/leave.dao.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = await locals.auth();
	const sessionUser = session?.user?.id
		? {
				id: session.user.id,
				email: session.user.email ?? '',
				name: session.user.name ?? null
			} as import('$lib/types/user').User
		: null;

	const user = locals.user ?? sessionUser;
	let isManager = false;

	if (user?.email) {
		try {
			const { employee } = await resolveEmployee(user.email);
			if (employee?.cuid) {
				const subs = await getSubordinates(employee.cuid);
				isManager = subs.length > 0;
			}
		} catch (err) {
			// ignore and fallback to isManager = false
		}
	}

	console.log("[DIAG-7] +layout.server.ts returning user:", user);

	return {
		session,
		user,
		roles: locals.roles,
		config: getAppConfig(),
		isManager
	};
};

