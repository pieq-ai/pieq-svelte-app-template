import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as leaveService from '$lib/server/services/leave.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { db } from '$lib/server/db.js';
import { ValidationError } from '$lib/server/utils/errors.js';

export async function POST(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const email = event.locals.user?.email || '';
		const cuid = event.params.cuid || '';

		const { employee: manager } = await leaveService.resolveEmployee(email);
		if (!manager) {
			throw new Error('Manager record not found.');
		}

		const body = await event.request.json();
		const { action } = body;

		const leaveRequest = await leaveService.getLeaveRequestByCuid(cuid);
		if (!leaveRequest) {
			throw new Error('Leave request not found.');
		}

		// Verify subordinate relationship
		const targetEmployment = await db.employment.findFirst({
			where: { employee_cuid: leaveRequest.employee_cuid }
		});

		if (!targetEmployment || targetEmployment.reporting_manager_cuid !== manager.cuid) {
			throw new Error('Unauthorized: You can only approve/reject requests from your direct reports.');
		}

		let result;
		if (action === 'approve') {
			result = await leaveService.approveLeaveRequest(cuid, manager.emp_code);
		} else if (action === 'reject') {
			result = await leaveService.rejectLeaveRequest(cuid, manager.emp_code);
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
