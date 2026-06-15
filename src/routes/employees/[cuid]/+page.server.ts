import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import type { PageServerLoad } from './$types';
import { serialize } from '$lib/server/utils/mapping.js';

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
		db.role.findMany({ where: { status: true } }),
		db.companyLocation.findMany({ where: { status: true } }),
		db.employee.findMany({ select: { cuid: true, first_name: true, last_name: true } })
	]);

	return {
		employee: serialize(employee),
		employment: serialize(employment),
		roles: roles.map((r) => ({ cuid: r.cuid, name: r.name })),
		locations: locations.map((l) => ({ cuid: l.cuid, name: l.name })),
		employees: employees.map((e) => ({ cuid: e.cuid, first_name: e.first_name, last_name: e.last_name }))
	};
};
