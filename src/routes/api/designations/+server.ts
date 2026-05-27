import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as designationService from '$lib/server/services/designation.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

function parseDesignationUuid(event: RequestEvent) {
	const url = new URL(event.request.url);
	const uuid = url.searchParams.get('uuid');

	if (!uuid) {
		throw new Error('Designation UUID is required as a query parameter');
	}

	return uuid;
}

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);

		const url = new URL(event.request.url);
		const uuid = url.searchParams.get('uuid');

		if (uuid) {
			const designation = await designationService.getDesignationByUuid(uuid);
			return json({ data: designation });
		}

		const designations = await designationService.getDesignations();
		return json({ data: designations });
	} catch (error) {
		const message = (error as Error).message;
		const status = message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}

export async function POST(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		permissionGuard.requireAdmin(event.locals.user);

		const body = await event.request.json();
		const newDesignation = await designationService.createDesignation(body);
		return json({ data: newDesignation }, { status: 201 });
	} catch (error) {
		return json({ error: (error as Error).message }, { status: 400 });
	}
}

export async function PUT(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		permissionGuard.requireAdmin(event.locals.user);

		const uuid = parseDesignationUuid(event);
		const body = await event.request.json();
		const updatedDesignation = await designationService.updateDesignation(uuid, body);
		return json({ data: updatedDesignation });
	} catch (error) {
		const message = (error as Error).message;
		const status = message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}

export async function DELETE(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		permissionGuard.requireAdmin(event.locals.user);

		const uuid = parseDesignationUuid(event);
		const deletedDesignation = await designationService.deleteDesignation(uuid);
		return json({ data: deletedDesignation });
	} catch (error) {
		const message = (error as Error).message;
		const status = message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}
