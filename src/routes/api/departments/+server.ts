import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as departmentService from '$lib/server/services/department.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { mapToDb, toDepartmentDTO } from '$lib/server/utils/mapping.js';

/**
 * GET /api/departments
 * GET /api/departments?cuid2=
 * Handles listing all departments or finding one by CUID2.
 */
export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);

		const url = new URL(event.request.url);
		const cuid = url.searchParams.get('cuid');

		if (cuid) {
			const department = await departmentService.getDepartmentByCuid2(cuid);
			return json({ data: toDepartmentDTO(department) });
		}

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
		return json({ data: { cuid: newDepartment.cuid2, message: 'Successfully created' } }, { status: 201 });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : 400;
		return json({ error: message }, { status });
	}
}

/**
 * PUT /api/departments?cuid2=
 * Handles updating an existing department.
 */
export async function PUT(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		permissionGuard.requireAdmin(event.locals.user);

		const url = new URL(event.request.url);
		const cuid = url.searchParams.get('cuid');

		if (!cuid) {
			return json({ error: 'Department CUID is required as a query parameter' }, { status: 400 });
		}

		let body = await event.request.json();
		body = mapToDb(body);
		body.updated_by = event.locals.user?.id;
		const updatedDepartment = await departmentService.updateDepartment(cuid, body);
		return json({ data: { cuid: updatedDepartment.cuid2, message: 'Successfully updated' } });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}

/**
 * DELETE /api/departments?cuid2=
 * Handles soft deleting a department (sets status = inactive).
 */
export async function DELETE(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		permissionGuard.requireAdmin(event.locals.user);

		const url = new URL(event.request.url);
		const cuid = url.searchParams.get('cuid');

		if (!cuid) {
			return json({ error: 'Department CUID is required as a query parameter' }, { status: 400 });
		}

		const deletedDepartment = await departmentService.deleteDepartment(cuid, event.locals.user?.id);
		return json({ data: { cuid: deletedDepartment.cuid2, message: 'Successfully disabled' } });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}
