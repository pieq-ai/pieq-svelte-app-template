import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { serialize } from '$lib/server/utils/mapping.js';
import { listRoles } from '$lib/server/services/role.service.js';
import { listLocations } from '$lib/server/services/organization_location.service.js';
import { getEmployeeByCuid2, getEmployees } from '$lib/server/services/employee.service.js';
import { getEmploymentByEmployeeCuid } from '$lib/server/services/employment.service.js';
import { mapLocation } from '$lib/server/response.js';

export const load: PageServerLoad = async ({ locals }) => {
	const employeeCuid = locals.user?.employee_cuid;
	
	if (!employeeCuid) {
		// User does not have a linked employee profile
		throw error(403, 'Your account is not linked to an employee profile.');
	}

	let employee;
	try {
		employee = await getEmployeeByCuid2(employeeCuid);
	} catch (err) {
		throw error(404, 'Employee profile not found.');
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
		locations: locations.data.map(mapLocation),
		employees: employees.map((e) => ({ cuid: e.cuid, first_name: e.first_name, last_name: e.last_name }))
	};
};
