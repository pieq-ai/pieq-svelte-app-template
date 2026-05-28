import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as departmentService from '$lib/server/services/department.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

/**
 * GET /api/departments
 * GET /api/departments?cuid2=
 * Handles listing all departments or finding one by CUID2.
 */
export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);

		const url = new URL(event.request.url);
		const cuid2 = url.searchParams.get('cuid2');

		if (cuid2) {
			const department = await departmentService.getDepartmentByCuid2(cuid2);
			return json({ data: department });
		}

		const departments = await departmentService.getDepartments();
		return json({ data: departments });
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

		const body = await event.request.json();
		const newDepartment = await departmentService.createDepartment(body);
		return json({ data: newDepartment }, { status: 201 });
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
		const cuid2 = url.searchParams.get('cuid2');

		if (!cuid2) {
			return json({ error: 'Department CUID2 is required as a query parameter' }, { status: 400 });
		}

		const body = await event.request.json();
		const updatedDepartment = await departmentService.updateDepartment(cuid2, body);
		return json({ data: updatedDepartment });
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
		const cuid2 = url.searchParams.get('cuid2');

		if (!cuid2) {
			return json({ error: 'Department CUID2 is required as a query parameter' }, { status: 400 });
		}

		const deletedDepartment = await departmentService.deleteDepartment(cuid2);
		return json({ data: deletedDepartment });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}
