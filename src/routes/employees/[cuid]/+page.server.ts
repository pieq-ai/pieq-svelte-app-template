import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { serialize } from '$lib/server/utils/mapping.js';
import { listRoles } from '$lib/server/services/role.service.js';
import { listLocations } from '$lib/server/services/organization_location.service.js';
import { getEmployeeByCuid2, getEmployees } from '$lib/server/services/employee.service.js';
import { getEmploymentByEmployeeCuid } from '$lib/server/services/employment.service.js';

export const load: PageServerLoad = async ({ params }) => {
	const employeeCuid = params.cuid;

	let employee;
	try {
		employee = await getEmployeeByCuid2(employeeCuid);
	} catch (err) {
		throw error(404, 'Employee not found');
	}

	const [employment, roles, locations, employees] = await Promise.all([
		getEmploymentByEmployeeCuid(employeeCuid),
		listRoles(),
		listLocations(),
		getEmployees()
	]);

	return {
		employee: serialize(employee),
		employment: serialize(employment),
		roles: roles.data,
		locations: locations.data,
		employees: employees.map((e) => ({ cuid: e.cuid, first_name: e.first_name, last_name: e.last_name }))
	};
};
