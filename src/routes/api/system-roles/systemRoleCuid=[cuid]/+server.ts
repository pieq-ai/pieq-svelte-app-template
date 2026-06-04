import { json } from '@sveltejs/kit';
import { ValidationError } from '$lib/server/utils/errors.js';
import type { RequestEvent } from '@sveltejs/kit';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import * as systemRoleService from '$lib/server/services/system-role.service.js';
import { mapToDb, toSystemRoleDTO } from '$lib/server/utils/mapping.js';

function getStatus(message: string) {
	if (message === 'Unauthorized') return 401;
	if (message.includes('not found')) return 404;
	return 400;
}

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const cuid = event.params.cuid;
		if (!cuid) return json({ error: 'System role CUID is required' }, { status: 400 });
		return json({ data: toSystemRoleDTO(await systemRoleService.getSystemRoleByCuid2(cuid)) });
	} catch (error) {
		if (error instanceof ValidationError) {
			return json({ error: error.message, field: error.field }, { status: 409 });
		}
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}

export async function PUT(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const cuid = event.params.cuid;
		if (!cuid) return json({ error: 'System role CUID is required' }, { status: 400 });
		let body = await event.request.json();
		body = mapToDb(body);
		body.updated_by = event.locals.user?.id;
		const updatedRole = await systemRoleService.updateSystemRole(cuid, body);
		return json({ data: { cuid: updatedRole.cuid, message: 'Successfully updated' } });
	} catch (error) {
		if (error instanceof ValidationError) {
			return json({ error: error.message, field: error.field }, { status: 409 });
		}
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}

export async function DELETE(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const cuid = event.params.cuid;
		if (!cuid) return json({ error: 'System role CUID is required' }, { status: 400 });
		const deletedRole = await systemRoleService.deleteSystemRole(cuid);
		return json({ data: { cuid: deletedRole.cuid, message: 'Successfully disabled' } });
	} catch (error) {
		if (error instanceof ValidationError) {
			return json({ error: error.message, field: error.field }, { status: 409 });
		}
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}
