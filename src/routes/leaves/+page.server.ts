import * as leaveService from '$lib/server/services/leave.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	permissionGuard.requireAuth(locals.user);
	const email = locals.user?.email || '';
	const year = new Date().getFullYear();

	const details = await leaveService.getEmployeeLeaveDetails(email, year);
	return { details };
};
