import type { RequestEvent } from '@sveltejs/kit';
import * as employeeService from '$lib/server/services/employee.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { mapToDb, toEmployeeDTO } from '$lib/server/utils/mapping.js';
import { sendList, sendCreated, handleError } from '$lib/server/utils/response.js';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requirePermission(event.locals.user, 'employee:view');
		const employees = await employeeService.getEmployees();
		return sendList(employees.map(toEmployeeDTO));
	} catch (error) {
		return handleError(error);
	}
}

export async function POST(event: RequestEvent) {
	try {
		permissionGuard.requirePermission(event.locals.user, 'employee:view');
		
		let body = await event.request.json();
		body = mapToDb(body);
		body.created_by = event.locals.user?.id;
		
		const newEmployee = await employeeService.createEmployee(body);
		return sendCreated(newEmployee.cuid);
	} catch (error) {
		return handleError(error);
	}
}