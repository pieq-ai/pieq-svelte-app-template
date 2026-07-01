import type { RequestEvent } from '@sveltejs/kit';
import * as employeeService from '$lib/server/services/employee.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { toEmployeeAttendanceViewDTO } from '$lib/server/utils/mapping.js';
import { sendList, handleError } from '$lib/server/utils/response.js';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requirePermission(event.locals.user, 'employee:view');
		const employees = await employeeService.getMinimalEmployeesForAttendance();
		return sendList(employees.map(toEmployeeAttendanceViewDTO));
	} catch (error) {
		return handleError(error);
	}
}
