import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as leaveService from '$lib/server/services/leave.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

export async function POST(event: RequestEvent) {
	try {
		permissionGuard.requirePermission(event.locals.user, 'leave:view');
		const cuid = event.params.cuid || '';

		const body = await event.request.json();

		// Prefer employeeCuid from body (employee dropdown pattern, same as Attendance page).
		// Fall back to the logged-in user's email for backwards compatibility.
		const employeeCuid = body.employeeCuid || '';

		let result;
		if (employeeCuid) {
			result = await leaveService.withdrawLeaveByCuid(employeeCuid, cuid, event.locals.user?.id);
		} else {
			const email = event.locals.user?.email || '';
			result = await leaveService.withdrawLeave(email, cuid, event.locals.user?.id);
		}

		return json({ data: result });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : 400;
		return json({ error: message }, { status });
	}
}

export async function DELETE(event: RequestEvent) {
	
		requirePermission(event.locals.user, 'leave:view');
return POST(event);
}
