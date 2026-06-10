import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as employeeService from '$lib/server/services/employee.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { mapToDb, toEmployeeDTO } from '$lib/server/utils/mapping.js';
import { ValidationError } from '$lib/server/utils/errors.js';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const cuid = event.params.cuid;
		if (!cuid) throw new Error('CUID2 parameter is missing');

		const employee = await employeeService.getEmployeeByCuid2(cuid);
		return json({ data: toEmployeeDTO(employee) });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}

export async function PUT(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const cuid = event.params.cuid;
		if (!cuid) throw new Error('CUID2 parameter is missing');

		let body = await event.request.json();
		body = mapToDb(body);
		body.updated_by = event.locals.user?.id;

		const updatedEmployee = await employeeService.updateEmployee(cuid, body);
		return json({ data: { cuid: updatedEmployee.cuid, message: 'Successfully updated' } });
	} catch (error) {
		if (error instanceof ValidationError) {
			return json({ error: error.message, field: error.field }, { status: 409 });
		}
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}
