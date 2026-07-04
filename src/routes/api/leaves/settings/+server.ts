import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import * as leaveService from '$lib/server/services/leave.service.js';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const cutoff = await leaveService.getPayrollCutoffDay();
		return json({ data: { payroll_cutoff: cutoff } });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : 400;
		return json({ error: message }, { status });
	}
}

export async function POST(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const email = event.locals.user?.email || '';
		const roles = event.locals.roles || [];

		let isAllowed = false;
		if (roles.includes('admin')) {
			isAllowed = true;
		} else {
			try {
				const { employee } = await leaveService.resolveEmployee(email);
				if (employee) {
					const { isManager } = await leaveService.getEmployeeLeaveDetails(email, new Date().getFullYear());
					if (isManager) {
						isAllowed = true;
					}
				}
			} catch (err) {
				// employee or manager resolve failed
			}
		}

		if (!isAllowed) {
			return json({ error: 'Unauthorized: Only managers and admins can modify payroll cutoff settings' }, { status: 403 });
		}

		const body = await event.request.json();
		const cutoffDay = parseInt(body.payroll_cutoff, 10);
		if (isNaN(cutoffDay) || cutoffDay < 1 || cutoffDay > 28) {
			return json({ error: 'Invalid payroll cutoff day. Must be between 1 and 28.' }, { status: 400 });
		}

		await leaveService.setPayrollCutoffDay(cutoffDay, event.locals.user?.id);

		return json({ data: { payroll_cutoff: cutoffDay } });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : 400;
		return json({ error: message }, { status });
	}
}

