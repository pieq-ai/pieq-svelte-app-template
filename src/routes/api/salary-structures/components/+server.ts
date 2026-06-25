import { json } from '@sveltejs/kit';
import * as salaryComponentDao from '$lib/server/dao/salary-component.dao.js';
import { serializeSalaryComponent } from '$lib/server/serializers/salary-component.serializer.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

export async function GET(event) {
	try {
		await permissionGuard.requirePermission(event.locals.user, event.locals.roles, 'salary_structure_view');
		const result = await salaryComponentDao.findMany();
		const active = result.items.filter((c) => c.status);
		return json({ data: active.map(serializeSalaryComponent) });
	} catch (error) {
		console.error('Error in GET /api/salary-structures/components:', error);
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
		return json(
			{ success: false, message: message || 'Failed to retrieve components' },
			{ status }
		);
	}
}
