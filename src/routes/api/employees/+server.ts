import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as employeeDao from '$lib/server/dao/employee.dao';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { toEmployeeDTO } from '$lib/server/utils/mapping.js';

function getErrorStatus(message: string, fallback = 500) {
	return message === 'Unauthorized' ? 401 : fallback;
}

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);

		const employees = await employeeDao.list();
		return json({ data: employees.map(toEmployeeDTO) });
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getErrorStatus(message) });
	}
}

export async function POST(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);

		const { request } = event;
		const body = await request.json();
		const { name, age } = body;

		if (!name || typeof name !== 'string') {
			return json({ error: 'Name is required and must be a string' }, { status: 400 });
		}

		if (age === undefined || isNaN(Number(age))) {
			return json({ error: 'Age is required and must be a valid number' }, { status: 400 });
		}

		const employee = await employeeDao.create({ name, age: Number(age) });
		return json({ data: { cuid: employee.cuid, message: 'Successfully created' } }, { status: 201 });
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getErrorStatus(message) });
	}
}
