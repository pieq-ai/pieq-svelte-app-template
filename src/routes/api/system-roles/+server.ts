import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import * as systemRoleService from '$lib/server/services/system-role.service.js';

function getStatus(message: string) {
	if (message === 'Unauthorized') return 401;
	if (message.includes('not found')) return 404;
	return 400;
}

function parseRoleId(event: RequestEvent) {
	const url = new URL(event.request.url);
	const id = Number(url.searchParams.get('id'));
	if (!Number.isInteger(id) || id <= 0) {
		throw new Error('System role ID is required as a positive query parameter');
	}
	return id;
}

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const url = new URL(event.request.url);
		const id = url.searchParams.get('id');
		if (id) {
			return json({ data: await systemRoleService.getSystemRoleById(Number(id)) });
		}
		return json({ data: await systemRoleService.getSystemRoles() });
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}

export async function POST(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const body = await event.request.json();
		return json({ data: await systemRoleService.createSystemRole(body) }, { status: 201 });
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}

export async function PUT(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const id = parseRoleId(event);
		const body = await event.request.json();
		return json({ data: await systemRoleService.updateSystemRole(id, body) });
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}

export async function DELETE(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const id = parseRoleId(event);
		return json({ data: await systemRoleService.deleteSystemRole(id) });
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}
