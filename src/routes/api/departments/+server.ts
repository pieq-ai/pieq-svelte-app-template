import { json } from '@sveltejs/kit';
import * as departmentService from '$lib/server/services/department.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

/**
 * GET /api/departments
 * GET /api/departments?uuid=
 * Handles listing all departments or finding one by UUID.
 */
export async function GET({ url, locals }) {
	try {
		// Enforce auth permission guard
		permissionGuard.requireAuth(locals.user);

		const uuid = url.searchParams.get('uuid');
		if (uuid) {
			const department = await departmentService.getDepartmentByUuid(uuid);
			return json({ data: department });
		}

		const departments = await departmentService.getDepartments();
		return json({ data: departments });
	} catch (error) {
		const message = (error as Error).message;
		const status = message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}

/**
 * POST /api/departments
 * Handles creating a new department.
 */
export async function POST({ request, locals }) {
	try {
		// Enforce auth + admin permission guards
		permissionGuard.requireAuth(locals.user);
		permissionGuard.requireAdmin(locals.user);

		const body = await request.json();
		const newDepartment = await departmentService.createDepartment(body);
		return json({ data: newDepartment }, { status: 201 });
	} catch (error) {
		return json({ error: (error as Error).message }, { status: 400 });
	}
}

/**
 * PUT /api/departments?uuid=
 * Handles updating an existing department.
 */
export async function PUT({ url, request, locals }) {
	try {
		// Enforce auth + admin permission guards
		permissionGuard.requireAuth(locals.user);
		permissionGuard.requireAdmin(locals.user);

		const uuid = url.searchParams.get('uuid');
		if (!uuid) {
			return json({ error: 'Department UUID is required as a query parameter' }, { status: 400 });
		}

		const body = await request.json();
		const updatedDepartment = await departmentService.updateDepartment(uuid, body);
		return json({ data: updatedDepartment });
	} catch (error) {
		const message = (error as Error).message;
		const status = message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}

/**
 * DELETE /api/departments?uuid=
 * Handles soft deleting a department (sets status = inactive).
 */
export async function DELETE({ url, locals }) {
	try {
		// Enforce auth + admin permission guards
		permissionGuard.requireAuth(locals.user);
		permissionGuard.requireAdmin(locals.user);

		const uuid = url.searchParams.get('uuid');
		if (!uuid) {
			return json({ error: 'Department UUID is required as a query parameter' }, { status: 400 });
		}

		const deletedDepartment = await departmentService.deleteDepartment(uuid);
		return json({ data: deletedDepartment });
	} catch (error) {
		const message = (error as Error).message;
		const status = message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}
