import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as leaveService from '$lib/server/services/leave.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { ValidationError } from '$lib/server/utils/errors.js';

export async function POST(event: RequestEvent) {
	try {
		permissionGuard.requirePermission(event.locals.user, 'leave:view');
		const cuid = event.params.cuid || '';

		const body = await event.request.json();
		const { action } = body;

		const email = event.locals.user?.email || '';
		if (!email) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		const resolved = await leaveService.resolveEmployee(email);
		const manager = resolved.employee;
		if (!manager) {
			throw new Error('Manager record not found.');
		}

		let result;
		const approverActorCuid = manager.cuid;
		if (action === 'approve') {
			result = await leaveService.approveLeaveRequest(cuid, approverActorCuid);
		} else if (action === 'reject') {
			result = await leaveService.rejectLeaveRequest(cuid, approverActorCuid);
		} else {
			throw new Error('Invalid action.');
		}

		return json({ data: result });
	} catch (error: any) {
		if (error instanceof ValidationError) {
			return json({ error: error.message, field: error.field }, { status: 400 });
		}
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : 400;
		return json({ error: message }, { status });
	}
}
