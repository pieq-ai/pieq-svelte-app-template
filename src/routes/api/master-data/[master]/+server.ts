import { json } from '@sveltejs/kit';
import { ValidationError } from '$lib/server/utils/errors.js';
import type { RequestEvent } from '@sveltejs/kit';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import * as masterDataService from '$lib/server/services/master-data.service.js';
import { mapToDb, toMasterDataDTO } from '$lib/server/utils/mapping.js';

function getStatus(message: string) {
	if (message === 'Unauthorized') return 401;
	if (message.includes('not found')) return 404;
	if (message.includes('Unsupported')) return 404;
	return 400;
}

function getMaster(event: RequestEvent) {
	return event.params.master ?? '';
}

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requirePermission(event.locals.user, 'dashboard:view');
		const url = new URL(event.request.url);
		const search = url.searchParams.get('search') ?? undefined;
		const countryCuid = url.searchParams.get('countryCuid') ?? undefined;

		return json({
			data: (await masterDataService.getMasterData(getMaster(event), search, countryCuid)).map(toMasterDataDTO)
		});
	} catch (error) {
		if (error instanceof ValidationError) {
			return json({ error: error.message, field: error.field }, { status: 409 });
		}
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}

export async function POST(event: RequestEvent) {
	try {
		permissionGuard.requirePermission(event.locals.user, 'dashboard:view');
		let body = await event.request.json();
		body = mapToDb(body);
		body.created_by = event.locals.user?.id;
		const newMasterData = await masterDataService.createMasterData(getMaster(event), body);
		return json(
			{ data: { cuid: newMasterData.id, message: 'Successfully created' } },
			{ status: 201 }
		);
	} catch (error) {
		if (error instanceof ValidationError) {
			return json({ error: error.message, field: error.field }, { status: 409 });
		}
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}
