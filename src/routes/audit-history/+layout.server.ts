import type { LayoutServerLoad } from './$types';
import { requirePermission } from '$lib/server/guards/permission.guard.js';

export const load: LayoutServerLoad = async ({ locals }) => {
	requirePermission(locals.user, 'audit:view', '/dashboard');
	return {};
};
