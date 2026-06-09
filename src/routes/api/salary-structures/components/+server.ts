import { json } from '@sveltejs/kit';
import * as salaryComponentDao from '$lib/server/dao/salary-component.dao.js';
import { serializeSalaryComponent } from '$lib/server/serializers/salary-component.serializer.js';

/**
 * Returns all active salary components for use in the salary structure item dropdown.
 * Only active components can be assigned to a new salary structure.
 */
export async function GET() {
	try {
		const result = await salaryComponentDao.findMany();
		const active = result.items.filter((c) => c.is_active);
		return json({ data: active.map(serializeSalaryComponent) });
	} catch (error) {
		console.error('Error in GET /api/salary-structures/components:', error);
		return json(
			{ success: false, message: (error as Error).message || 'Failed to retrieve components' },
			{ status: 500 }
		);
	}
}
