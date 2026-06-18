import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getEmployees } from '$lib/server/services/employee.service.js';

export const load: PageServerLoad = async () => {
	try {
		const employees = await getEmployees();
		return {
			employees: employees.map((e) => ({
				cuid: e.cuid,
				emp_code: e.emp_code,
				first_name: e.first_name,
				last_name: e.last_name,
				personal_email: e.personal_email,
				profile_completion_status: e.profile_completion_status
			}))
		};
	} catch (e) {
		console.error('Failed to load employees:', e);
		throw error(500, 'Failed to load employees');
	}
};
