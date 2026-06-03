import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	createEmployee,
	EmployeeValidationError,
	listEmployees
} from '$lib/server/services/employee.service';

export const GET: RequestHandler = async () => {
	try {
		const employees = await listEmployees();
		return json({ data: employees });
	} catch (error) {
		console.error('GET /api/employees failed', error);
		return json({ error: 'Failed to list employees' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return json({ error: 'Request body must be valid JSON' }, { status: 400 });
	}

	const { name, age } = (body ?? {}) as { name?: unknown; age?: unknown };

	try {
		const employee = await createEmployee({ name, age });
		return json({ data: employee }, { status: 201 });
	} catch (error) {
		if (error instanceof EmployeeValidationError) {
			return json({ error: error.message, field: error.field }, { status: 400 });
		}

		console.error('POST /api/employees failed', error);
		return json({ error: 'Failed to create employee' }, { status: 500 });
	}
};