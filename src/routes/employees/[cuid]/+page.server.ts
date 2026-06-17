import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import type { PageServerLoad } from './$types';
import { serialize } from '$lib/server/utils/mapping.js';
import { listRoles } from '$lib/server/services/role.service.js';
import { listLocations } from '$lib/server/services/organization_location.service.js';

export const load: PageServerLoad = async ({ params }) => {
	const employeeCuid = params.cuid;

	const employee = await db.employee.findUnique({
		where: { cuid: employeeCuid }
	});

	if (!employee) {
		throw error(404, 'Employee not found');
	}

	const [employment, roles, locations, employees] = await Promise.all([
		db.employment.findFirst({
			where: { employee_cuid: employeeCuid }
		}),
		listRoles(),
		listLocations(),
		db.employee.findMany({ select: { cuid: true, first_name: true, last_name: true } })
	]);

	return {
		employee: serialize(employee),
		employment: serialize(employment),
		roles: roles.data,
		locations: locations.data,
		employees: employees.map((e) => ({ cuid: e.cuid, first_name: e.first_name, last_name: e.last_name }))
	};
};
