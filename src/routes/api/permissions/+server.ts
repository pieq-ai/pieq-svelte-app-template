import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import * as permissionService from '$lib/server/services/permission.service.js';
import { mapToDb, toPermissionDTO } from '$lib/server/utils/mapping.js';

function getStatus(message: string) {
	if (message === 'Unauthorized') return 401;
	if (message.includes('not found')) return 404;
	return 400;
}

function parsePermissionCuid(event: RequestEvent) {
	const url = new URL(event.request.url);
	const cuid = url.searchParams.get('cuid');
	if (!cuid) {
		throw new Error('Permission CUID is required as a query parameter');
	}
	return cuid;
}

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const url = new URL(event.request.url);
		const cuid = url.searchParams.get('cuid');
		if (cuid) {
			return json({ data: toPermissionDTO(await permissionService.getPermissionByCuid2(cuid)) });
		}
		const permissions = await permissionService.getPermissions();
		return json({ data: permissions.map(toPermissionDTO) });
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}

export async function POST(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		let body = await event.request.json();
		body = mapToDb(body);
		body.created_by = event.locals.user?.id;
		const newPermission = await permissionService.createPermission(body);
		return json({ data: { cuid: newPermission.cuid, message: 'Successfully created' } }, { status: 201 });
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}

export async function PUT(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const cuid = parsePermissionCuid(event);
		let body = await event.request.json();
		body = mapToDb(body);
		body.updated_by = event.locals.user?.id;
		const updatedPermission = await permissionService.updatePermission(cuid, body);
		return json({ data: { cuid: updatedPermission.cuid, message: 'Successfully updated' } });
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}

export async function DELETE(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const cuid = parsePermissionCuid(event);
		const deletedPermission = await permissionService.deletePermission(cuid);
		return json({ data: { cuid: deletedPermission.cuid, message: 'Successfully disabled' } });
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}
