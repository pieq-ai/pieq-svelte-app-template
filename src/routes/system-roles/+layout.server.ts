import { requirePermission } from '$lib/server/guards/permission.guard';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	requirePermission(locals.user, 'system_role:view', '/dashboard');
	return {};
};
