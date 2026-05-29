import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as designationService from '$lib/server/services/designation.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

function parseDesignationCuid2(event: RequestEvent) {
	const url = new URL(event.request.url);
	const cuid2 = url.searchParams.get('cuid2');

	if (!cuid2) {
		throw new Error('Designation CUID2 is required as a query parameter');
	}

	return cuid2;
}

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);

		const url = new URL(event.request.url);
		const cuid2 = url.searchParams.get('cuid2');

		if (cuid2) {
			const designation = await designationService.getDesignationByCuid2(cuid2);
			return json({ data: designation });
		}

		const designations = await designationService.getDesignations();
		return json({ data: designations });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}

export async function POST(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		permissionGuard.requireAdmin(event.locals.user);

		const body = await event.request.json();
		body.created_by = event.locals.user?.id;
		const newDesignation = await designationService.createDesignation(body);
		return json({ data: newDesignation }, { status: 201 });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : 400;
		return json({ error: message }, { status });
	}
}

export async function PUT(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		permissionGuard.requireAdmin(event.locals.user);

		const cuid2 = parseDesignationCuid2(event);
		const body = await event.request.json();
		body.updated_by = event.locals.user?.id;
		const updatedDesignation = await designationService.updateDesignation(cuid2, body);
		return json({ data: updatedDesignation });
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

		const cuid2 = parseDesignationCuid2(event);
		const deletedDesignation = await designationService.deleteDesignation(cuid2, event.locals.user?.id);
		return json({ data: deletedDesignation });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}
