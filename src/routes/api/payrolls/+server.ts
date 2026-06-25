import { json } from '@sveltejs/kit';
import * as service from '$lib/server/services/payroll.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

export async function GET(event) {
	try {
		await permissionGuard.requirePermission(event.locals.user, event.locals.roles, 'payroll_view');
		const payrolls = await service.getPayrolls();
		return json({ data: payrolls });
	} catch (error) {
		console.error('Error in GET /api/payrolls:', error);
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
		return json(
			{ message: message || 'Failed to retrieve payroll records' },
			{ status }
		);
	}
}
