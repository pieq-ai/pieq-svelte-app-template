import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as leaveService from '$lib/server/services/leave.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

export async function POST(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const email = event.locals.user?.email || '';
		const cuid = event.params.cuid || '';

		const result = await leaveService.withdrawLeave(email, cuid);
		return json({ data: result });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : 400;
		return json({ error: message }, { status });
	}
}

export async function DELETE(event: RequestEvent) {
	return POST(event);
}
