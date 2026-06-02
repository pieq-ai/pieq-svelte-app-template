import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as departmentService from '$lib/server/services/department.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { mapToDb, toDepartmentDTO } from '$lib/server/utils/mapping.js';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const cuid = event.params.cuid;
		if (!cuid) return json({ error: 'Department CUID is required' }, { status: 400 });

		const department = await departmentService.getDepartmentByCuid2(cuid);
		return json({ data: toDepartmentDTO(department) });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}

export async function PUT(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		permissionGuard.requireAdmin(event.locals.user);

		const cuid = event.params.cuid;
		if (!cuid) return json({ error: 'Department CUID is required' }, { status: 400 });

		let body = await event.request.json();
		body = mapToDb(body);
		body.updated_by = event.locals.user?.id;
		const updatedDepartment = await departmentService.updateDepartment(cuid, body);
		return json({ data: { cuid: updatedDepartment.cuid, message: 'Successfully updated' } });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}

export async function DELETE(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		permissionGuard.requireAdmin(event.locals.user);

		const cuid = event.params.cuid;
		if (!cuid) return json({ error: 'Department CUID is required' }, { status: 400 });

		const deletedDepartment = await departmentService.deleteDepartment(cuid, event.locals.user?.id);
		return json({ data: { cuid: deletedDepartment.cuid, message: 'Successfully disabled' } });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}
