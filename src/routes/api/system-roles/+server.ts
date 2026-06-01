import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import * as systemRoleService from '$lib/server/services/system-role.service.js';
import { mapToApi, mapToDb } from '$lib/server/utils/mapping.js';

function getStatus(message: string) {
	if (message === 'Unauthorized') return 401;
	if (message.includes('not found')) return 404;
	return 400;
}

function parseRoleCuid(event: RequestEvent) {
	const url = new URL(event.request.url);
	const cuid = url.searchParams.get('cuid');
	if (!cuid) {
		throw new Error('System role CUID is required as a query parameter');
	}
	return cuid;
}

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const url = new URL(event.request.url);
		const cuid = url.searchParams.get('cuid');
		if (cuid) {
			return json({ data: mapToApi(await systemRoleService.getSystemRoleByCuid2(cuid)) });
		}
		return json({ data: mapToApi(await systemRoleService.getSystemRoles()) });
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
		const newRole = await systemRoleService.createSystemRole(body);
		return json({ data: { cuid: newRole.cuid2, message: 'Successfully created' } }, { status: 201 });
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}

export async function PUT(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const cuid = parseRoleCuid(event);
		let body = await event.request.json();
		body = mapToDb(body);
		body.updated_by = event.locals.user?.id;
		const updatedRole = await systemRoleService.updateSystemRole(cuid, body);
		return json({ data: { cuid: updatedRole.cuid2, message: 'Successfully updated' } });
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}

export async function DELETE(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const cuid = parseRoleCuid(event);
		const deletedRole = await systemRoleService.deleteSystemRole(cuid);
		return json({ data: { cuid: deletedRole.cuid2, message: 'Successfully disabled' } });
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}
