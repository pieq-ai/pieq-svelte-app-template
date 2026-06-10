import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getEmployees } from '$lib/server/services/employee.service.js';

export const load: PageServerLoad = async () => {
	try {
		const employees = await getEmployees();
		return { employees };
	} catch (e) {
		console.error('Failed to load employees:', e);
		throw error(500, 'Failed to load employees');
	}
};
