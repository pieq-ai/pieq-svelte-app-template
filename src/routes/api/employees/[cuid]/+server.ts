import type { RequestEvent } from '@sveltejs/kit';
import * as employeeService from '$lib/server/services/employee.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { mapToDb, toEmployeeDTO } from '$lib/server/utils/mapping.js';
import { sendItem, sendUpdated, sendDeleted, handleError } from '$lib/server/utils/response.js';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requirePermission(event.locals.user, 'employee:view');
		const cuid = event.params.cuid;
		if (!cuid) throw new Error('CUID2 parameter is missing');

		const employee = await employeeService.getEmployeeByCuid2(cuid);
		return sendItem(toEmployeeDTO(employee));
	} catch (error) {
		return handleError(error);
	}
}

export async function PUT(event: RequestEvent) {
	try {
		permissionGuard.requirePermission(event.locals.user, 'employee:view');
		const cuid = event.params.cuid;
		if (!cuid) throw new Error('CUID2 parameter is missing');

		let body = await event.request.json();
		body = mapToDb(body);
		body.updated_by = event.locals.user?.id;

		const updatedEmployee = await employeeService.updateEmployee(cuid, body);
		return sendUpdated(updatedEmployee.cuid);
	} catch (error) {
		return handleError(error);
	}
}

export async function DELETE(event: RequestEvent) {
	try {
		permissionGuard.requirePermission(event.locals.user, 'employee:view');
		const cuid = event.params.cuid;
		if (!cuid) throw new Error('CUID2 parameter is missing');

		const deletedEmployee = await employeeService.deleteEmployee(cuid);
        return sendDeleted(deletedEmployee.cuid);
	} catch (error) {
		return handleError(error);
	}
}
