import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getStructures } from '$lib/server/services/salary-structure.service.js';
import { getAll as getAllEmployees } from '$lib/server/providers/employee.provider.js';
import * as salaryComponentDao from '$lib/server/dao/salary-component.dao.js';
import { serializeSalaryComponent } from '$lib/server/serializers/salary-component.serializer.js';

export const load: PageServerLoad = async () => {
	try {
		const [structures, employees, componentsResult] = await Promise.all([
			getStructures(),
			getAllEmployees(),
			salaryComponentDao.findMany()
		]);

		// Only active components can be assigned to a new salary structure.
		const components = componentsResult.items
			.filter((c) => c.status)
			.map(serializeSalaryComponent);

		// Employees that currently have NO active salary structure are eligible for "Add Structure".
		// This is a business rule — it belongs here in the server load, not in the client.
		const activeEmployeeCuids = new Set(
			structures.filter((s) => s.is_active).map((s) => s.employee_cuid)
		);
		const eligibleEmployees = employees.filter((e) => !activeEmployeeCuids.has(e.cuid));

		return { structures, employees, components, eligibleEmployees };
	} catch (e) {
		console.error('Failed to load salary structures page:', e);
		throw error(500, 'Failed to load salary structures data');
	}
};
