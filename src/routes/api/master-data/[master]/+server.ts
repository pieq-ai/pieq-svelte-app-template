import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import * as masterDataService from '$lib/server/services/master-data.service.js';

function getStatus(message: string) {
	if (message === 'Unauthorized') return 401;
	if (message.includes('not found')) return 404;
	if (message.includes('Unsupported')) return 404;
	return 400;
}

function getMaster(event: RequestEvent) {
	return event.params.master ?? '';
}

function getCuid2(event: RequestEvent) {
	const url = new URL(event.request.url);
	const cuid2 = url.searchParams.get('cuid2');
	if (!cuid2) {
		throw new Error('Master data CUID2 is required as a query parameter');
	}
	return cuid2;
}

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const url = new URL(event.request.url);
		const search = url.searchParams.get('search') ?? undefined;
		const countryCuid2 = url.searchParams.get('countryCuid2') ?? undefined;

		return json({
			data: await masterDataService.getMasterData(getMaster(event), search, countryCuid2)
		});
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}

export async function POST(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const body = await event.request.json();
		return json(
			{ data: await masterDataService.createMasterData(getMaster(event), body) },
			{ status: 201 }
		);
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}

export async function PUT(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const body = await event.request.json();
		return json({
			data: await masterDataService.updateMasterData(getMaster(event), getCuid2(event), body)
		});
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}
