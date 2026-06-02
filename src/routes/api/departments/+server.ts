import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as departmentService from '$lib/server/services/department.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { mapToDb, toDepartmentDTO } from '$lib/server/utils/mapping.js';

/**
 * GET /api/departments
 * Handles listing all departments.
 */
export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);

		const departments = await departmentService.getDepartments();
		return json({ data: departments.map(toDepartmentDTO) });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}

/**
 * POST /api/departments
 * Handles creating a new department.
 */
export async function POST(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		permissionGuard.requireAdmin(event.locals.user);

		let body = await event.request.json();
		body = mapToDb(body);
		body.created_by = event.locals.user?.id;
		const newDepartment = await departmentService.createDepartment(body);
		return json({ data: { cuid: newDepartment.cuid, message: 'Successfully created' } }, { status: 201 });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : 400;
		return json({ error: message }, { status });
	}
}
