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

		// Prefer managerEmployeeCuid from body (employee dropdown pattern, same as Attendance page).
		// Fall back to resolving via the logged-in user's email for backwards compatibility.
		const managerEmployeeCuid = body.managerEmployeeCuid || '';

		let manager;
		if (managerEmployeeCuid) {
			// Use the selected manager employee's cuid directly
			manager = { emp_code: managerEmployeeCuid, cuid: managerEmployeeCuid };
		} else {
			const email = event.locals.user?.email || '';
			const resolved = await leaveService.resolveEmployee(email);
			manager = resolved.employee;
			if (!manager) {
				throw new Error('Manager record not found.');
			}
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
