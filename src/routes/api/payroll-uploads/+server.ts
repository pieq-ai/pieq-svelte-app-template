import { json } from '@sveltejs/kit';
import * as service from '$lib/server/services/payroll-upload.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

/** GET /api/payroll-uploads — returns all upload batches, newest first. */
export async function GET(event) {
	try {
		await permissionGuard.requirePermission(event.locals.user, event.locals.roles, 'payroll_view');
		const uploads = await service.getPayrollUploads();
		return json({ data: uploads });
	} catch (error) {
		console.error('Error in GET /api/payroll-uploads:', error);
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
		return json(
			{ message: message || 'Failed to retrieve payroll upload records' },
			{ status }
		);
	}
}
