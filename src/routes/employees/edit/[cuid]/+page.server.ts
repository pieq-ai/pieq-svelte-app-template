import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const employeeCuid = params.cuid;

	const employee = await db.employee.findUnique({
		where: { cuid: employeeCuid }
	});

	if (!employee) {
		throw error(404, 'Employee not found');
	}

	const employment = await db.employment.findFirst({
		where: { employee_cuid: employeeCuid }
	});

	return {
		employee,
		employment
	};
};
