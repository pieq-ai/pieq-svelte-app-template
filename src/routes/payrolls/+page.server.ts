import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPayrollUploads } from '$lib/server/services/payroll-upload.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

export const load: PageServerLoad = async ({ locals }) => {
	try {
		await permissionGuard.requirePermission(locals.user, locals.roles, 'payroll_view');

		const uploads = await getPayrollUploads();
		return { uploads };
	} catch (e) {
		const message = (e as Error).message;
		if (message === 'Unauthorized' || message === 'Forbidden') {
			throw error(message === 'Unauthorized' ? 401 : 403, message);
		}
		console.error('Failed to load payroll uploads:', e);
		throw error(500, 'Failed to load payroll uploads');
	}
};
