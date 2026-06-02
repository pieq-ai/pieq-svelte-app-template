import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as designationService from '$lib/server/services/designation.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { mapToDb, toDesignationDTO } from '$lib/server/utils/mapping.js';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
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
