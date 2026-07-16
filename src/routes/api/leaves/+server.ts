import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as leaveService from '$lib/server/services/leave.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { ValidationError } from '$lib/server/utils/errors.js';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requirePermission(event.locals.user, 'leave:view');
		const year = new Date().getFullYear();

		const email = event.locals.user?.email || '';
		if (!email) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		const details = await leaveService.getEmployeeLeaveDetails(email, year);

		return json({ data: details });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : 400;
		return json({ error: message }, { status });
	}
}

export async function POST(event: RequestEvent) {
	try {
		permissionGuard.requirePermission(event.locals.user, 'leave:view');

		const body = await event.request.json();

		const email = event.locals.user?.email || '';
		if (!email) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		const newRequest = await leaveService.applyLeave(email, {
			leaveTypeCuid: body.leaveTypeCuid,
			startDate: body.startDate,
			endDate: body.endDate,
			isHalfDay: body.isHalfDay,
			halfDaySession: body.halfDaySession,
			reason: body.reason,
			document: body.document || null,
			expectedDeliveryDate: body.expectedDeliveryDate,
			isMiscarriage: body.isMiscarriage,
			childBirthDate: body.childBirthDate
		}, event.locals.user?.id);

		return json({ data: newRequest }, { status: 201 });
	} catch (error) {
		if (error instanceof ValidationError) {
			return json({ error: error.message, field: error.field }, { status: 400 });
		}
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : 400;
		return json({ error: message }, { status });
	}
}
