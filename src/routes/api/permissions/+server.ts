import { json } from '@sveltejs/kit';
import { ValidationError } from '$lib/server/utils/errors.js';
import type { RequestEvent } from '@sveltejs/kit';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import * as permissionService from '$lib/server/services/permission.service.js';
import { mapToDb, toPermissionDTO } from '$lib/server/utils/mapping.js';

function getStatus(message: string) {
	if (message === 'Unauthorized') return 401;
	if (message.includes('not found')) return 404;
	return 400;
}

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requirePermission(event.locals.user, 'permission:view');
		const permissions = await permissionService.getPermissions();
		return json({ data: permissions.map(toPermissionDTO) });
	} catch (error) {
		if (error instanceof ValidationError) {
			return json({ error: error.message, field: error.field }, { status: 409 });
		}
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}

export async function POST(event: RequestEvent) {
	try {
		permissionGuard.requirePermission(event.locals.user, 'permission:view');
		let body = await event.request.json();
		body = mapToDb(body);
		body.created_by = event.locals.user?.id;
		const newPermission = await permissionService.createPermission(body);
		return json({ data: { cuid: newPermission.cuid, message: 'Successfully created' } }, { status: 201 });
	} catch (error) {
		if (error instanceof ValidationError) {
			return json({ error: error.message, field: error.field }, { status: 409 });
		}
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}
