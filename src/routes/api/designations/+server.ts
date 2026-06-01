import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as designationService from '$lib/server/services/designation.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { mapToDb, toDesignationDTO } from '$lib/server/utils/mapping.js';

function parseDesignationCuid(event: RequestEvent) {
	const url = new URL(event.request.url);
	const cuid = url.searchParams.get('cuid');

	if (!cuid) {
		throw new Error('Designation CUID is required as a query parameter');
	}

	return cuid;
}

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);

		const url = new URL(event.request.url);
		const cuid = url.searchParams.get('cuid');

		if (cuid) {
			const designation = await designationService.getDesignationByCuid2(cuid);
			return json({ data: toDesignationDTO(designation) });
		}

		const designations = await designationService.getDesignations();
		return json({ data: designations.map(toDesignationDTO) });
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

		let body = await event.request.json();
		body = mapToDb(body);
		body.created_by = event.locals.user?.id;
		const newDesignation = await designationService.createDesignation(body);
		return json({ data: { cuid: newDesignation.cuid, message: 'Successfully created' } }, { status: 201 });
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

		const cuid = parseDesignationCuid(event);
		let body = await event.request.json();
		body = mapToDb(body);
		body.updated_by = event.locals.user?.id;
		const updatedDesignation = await designationService.updateDesignation(cuid, body);
		return json({ data: { cuid: updatedDesignation.cuid, message: 'Successfully updated' } });
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

		const cuid = parseDesignationCuid(event);
		const deletedDesignation = await designationService.deleteDesignation(cuid, event.locals.user?.id);
		return json({ data: { cuid: deletedDesignation.cuid, message: 'Successfully disabled' } });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}
