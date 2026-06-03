import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	createEmployee,
	EmployeeValidationError,
	listEmployees
} from '$lib/server/services/employee.service';

export const load: PageServerLoad = async () => {
	return {
		employees: await listEmployees()
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const name = form.get('name');
		const age = form.get('age');

		try {
			const employee = await createEmployee({ name, age });
			return { created: employee };
		} catch (error) {
			if (error instanceof EmployeeValidationError) {
				return fail(400, {
					error: error.message,
					field: error.field,
					name: typeof name === 'string' ? name : '',
					age: typeof age === 'string' ? age : ''
				});
			}

			console.error('POST /employees?/create failed', error);
			return fail(500, {
				error: 'Failed to create employee. Please try again.',
				name: typeof name === 'string' ? name : '',
				age: typeof age === 'string' ? age : ''
			});
		}
	}
};
