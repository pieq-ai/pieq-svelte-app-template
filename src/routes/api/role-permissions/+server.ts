import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import * as rolePermissionService from '$lib/server/services/role-permission.service.js';

function getStatus(message: string) {
	if (message === 'Unauthorized') return 401;
	if (message.includes('not found')) return 404;
	return 400;
}

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		return json({ data: await rolePermissionService.getRolePermissionMatrix() });
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}

export async function POST(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const body = await event.request.json();
		body.created_by = event.locals.user?.id;
		return json({ data: await rolePermissionService.assignPermissionsToRole(body) }, { status: 201 });
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}

export async function DELETE(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const url = new URL(event.request.url);
		const systemRoleCuid2 = url.searchParams.get('roleCuid2') ?? '';
		const permissionCuid2 = url.searchParams.get('permissionCuid2') ?? '';
		return json({
			data: await rolePermissionService.removePermissionFromRoleByCuid2(
				systemRoleCuid2,
				permissionCuid2
			)
		});
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}
