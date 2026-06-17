import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import * as leaveService from '$lib/server/services/leave.service.js';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const cutoff = await leaveService.getPayrollCutoffDay();
		return json({ data: { payrollCutoffDay: cutoff } });
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

		const { employee } = await leaveService.resolveEmployee(email);
		if (!employee) {
			return json({ error: 'Employee not found' }, { status: 404 });
		}

		const { isManager } = await leaveService.getEmployeeLeaveDetails(email, new Date().getFullYear());
		if (!isManager) {
			return json({ error: 'Unauthorized: Only managers can modify payroll cutoff settings' }, { status: 403 });
		}

		const body = await event.request.json();
		const cutoffDay = parseInt(body.payrollCutoffDay, 10);
		if (isNaN(cutoffDay) || cutoffDay < 1 || cutoffDay > 28) {
			return json({ error: 'Invalid payroll cutoff day. Must be between 1 and 28.' }, { status: 400 });
		}

		await db.systemSetting.upsert({
			where: { key: 'payroll_cutoff_day' },
			update: { value: String(cutoffDay) },
			create: {
				key: 'payroll_cutoff_day',
				value: String(cutoffDay)
			}
		});

		return json({ data: { payrollCutoffDay: cutoffDay } });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : 400;
		return json({ error: message }, { status });
	}
}
