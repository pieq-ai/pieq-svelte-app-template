import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as leaveService from '$lib/server/services/leave.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { ValidationError } from '$lib/server/utils/errors.js';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const year = new Date().getFullYear();

		// Prefer employeeCuid query param (employee dropdown pattern, same as Attendance page).
		// Fall back to the logged-in user's email for backwards compatibility.
		const employeeCuid = event.url.searchParams.get('employeeCuid') || '';

		let details;
		if (employeeCuid) {
			details = await leaveService.getEmployeeLeaveDetailsByCuid(employeeCuid, year);
		} else {
			const email = event.locals.user?.email || '';
			details = await leaveService.getEmployeeLeaveDetails(email, year);
		}

		return json({ data: details });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : 400;
		return json({ error: message }, { status });
	}
}

export async function POST(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);

		const body = await event.request.json();

		// Prefer employeeCuid from body (employee dropdown pattern, same as Attendance page).
		// Fall back to the logged-in user's email for backwards compatibility.
		const employeeCuid = body.employeeCuid || '';

		let newRequest;
		if (employeeCuid) {
			newRequest = await leaveService.applyLeaveByCuid(employeeCuid, {
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
			});
		} else {
			const email = event.locals.user?.email || '';
			newRequest = await leaveService.applyLeave(email, {
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
			});
		}

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
