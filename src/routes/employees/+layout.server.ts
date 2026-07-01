import { requirePermission } from '$lib/server/authz/guards';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	requirePermission(locals.user, 'employee:view');
	return {};
};
