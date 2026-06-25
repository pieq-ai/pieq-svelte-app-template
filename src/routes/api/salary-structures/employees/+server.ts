import { json } from '@sveltejs/kit';
import { getAll } from '$lib/server/providers/employee.provider.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

export async function GET(event) {
	try {
		await permissionGuard.requirePermission(event.locals.user, event.locals.roles, 'salary_structure_view');
		const employees = await getAll();
		return json({ data: employees });
	} catch (error) {
		console.error('Error in GET /api/salary-structures/employees:', error);
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
		return json(
			{ success: false, message: message || 'Failed to retrieve employees' },
			{ status }
		);
	}
}
