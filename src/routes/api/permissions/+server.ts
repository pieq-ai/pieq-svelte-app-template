import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import * as permissionService from '$lib/server/services/permission.service.js';

function getStatus(message: string) {
	if (message === 'Unauthorized') return 401;
	if (message.includes('not found')) return 404;
	return 400;
}

function parsePermissionCuid2(event: RequestEvent) {
	const url = new URL(event.request.url);
	const cuid2 = url.searchParams.get('cuid2');
	if (!cuid2) {
		throw new Error('Permission CUID2 is required as a query parameter');
	}
	return cuid2;
}

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const url = new URL(event.request.url);
		const cuid2 = url.searchParams.get('cuid2');
		if (cuid2) {
			return json({ data: await permissionService.getPermissionByCuid2(cuid2) });
		}
		return json({ data: await permissionService.getPermissions() });
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}

export async function POST(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const body = await event.request.json();
		return json({ data: await permissionService.createPermission(body) }, { status: 201 });
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}

export async function PUT(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const cuid2 = parsePermissionCuid2(event);
		const body = await event.request.json();
		return json({ data: await permissionService.updatePermission(cuid2, body) });
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}

export async function DELETE(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const cuid2 = parsePermissionCuid2(event);
		return json({ data: await permissionService.deletePermission(cuid2) });
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}
