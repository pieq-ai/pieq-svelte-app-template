import { json } from '@sveltejs/kit';
import { ValidationError } from '$lib/server/utils/errors.js';
import type { RequestEvent } from '@sveltejs/kit';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import * as masterDataService from '$lib/server/services/master-data.service.js';
import { mapToDb } from '$lib/server/utils/mapping.js';

function getStatus(message: string) {
	if (message === 'Unauthorized') return 401;
	if (message.includes('not found')) return 404;
	if (message.includes('Unsupported')) return 404;
	return 400;
}

function getMaster(event: RequestEvent) {
	return event.params.master ?? '';
}

export async function PUT(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const cuid = event.params.cuid;
		if (!cuid) return json({ error: 'Master data CUID is required' }, { status: 400 });
		
		let body = await event.request.json();
		body = mapToDb(body);
		body.updated_by = event.locals.user?.id;
		
		const updatedMasterData = await masterDataService.updateMasterData(getMaster(event), cuid, body);
		return json({
			data: { cuid: updatedMasterData.id, message: 'Successfully updated' }
		});
	} catch (error) {
		if (error instanceof ValidationError) {
			return json({ error: error.message, field: error.field }, { status: 409 });
		}
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}
