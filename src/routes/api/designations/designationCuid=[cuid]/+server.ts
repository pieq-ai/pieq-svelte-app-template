import { json } from '@sveltejs/kit';
import { ValidationError } from '$lib/server/utils/errors.js';
import type { RequestEvent } from '@sveltejs/kit';
import * as designationService from '$lib/server/services/designation.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { mapToDb, toDesignationDTO } from '$lib/server/utils/mapping.js';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const cuid = event.params.cuid;
		if (!cuid) return json({ error: 'Designation CUID is required' }, { status: 400 });

		const designation = await designationService.getDesignationByCuid2(cuid);
		return json({ data: toDesignationDTO(designation) });
	} catch (error) {
		if (error instanceof ValidationError) {
			return json({ error: error.message, field: error.field }, { status: 409 });
		}
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}

export async function PUT(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		permissionGuard.requireAdmin(event.locals.user);

		const cuid = event.params.cuid;
		if (!cuid) return json({ error: 'Designation CUID is required' }, { status: 400 });

		let body = await event.request.json();
		body = mapToDb(body);
		body.updated_by = event.locals.user?.id;
		const updatedDesignation = await designationService.updateDesignation(cuid, body);
		return json({ data: { cuid: updatedDesignation.cuid, message: 'Successfully updated' } });
	} catch (error) {
		if (error instanceof ValidationError) {
			return json({ error: error.message, field: error.field }, { status: 409 });
		}
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}

export async function DELETE(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		permissionGuard.requireAdmin(event.locals.user);

		const cuid = event.params.cuid;
		if (!cuid) return json({ error: 'Designation CUID is required' }, { status: 400 });

		const deletedDesignation = await designationService.deleteDesignation(cuid, event.locals.user?.id);
		return json({ data: { cuid: deletedDesignation.cuid, message: 'Successfully disabled' } });
	} catch (error) {
		if (error instanceof ValidationError) {
			return json({ error: error.message, field: error.field }, { status: 409 });
		}
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}
