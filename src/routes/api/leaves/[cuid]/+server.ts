import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as leaveService from '$lib/server/services/leave.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

export async function POST(event: RequestEvent) {
	try {
		permissionGuard.requirePermission(event.locals.user, 'leave:view');
		const cuid = event.params.cuid || '';

		const email = event.locals.user?.email || '';
		if (!email) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		const result = await leaveService.withdrawLeave(email, cuid, event.locals.user?.id);

		return json({ data: result });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : 400;
		return json({ error: message }, { status });
	}
}

export async function DELETE(event: RequestEvent) {
	permissionGuard.requirePermission(event.locals.user, 'leave:view');
	return POST(event);
}
