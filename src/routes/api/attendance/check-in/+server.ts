import { requirePermission } from '$lib/server/guards/permission.guard';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	checkIn,
	AttendanceValidationError
} from '$lib/server/services/attendance.service.js';
import { resolveEmployee } from '$lib/server/services/leave.service.js';
import { validatePayloadKeys, trimStringFields } from '$lib/server/validation.js';
import { errorResponse, successResponse } from '$lib/server/response.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return json({ error: { general: 'Request body must be valid JSON' } }, { status: 400 });
	}

	const allowedKeys = ['attendance_source_cuid', 'latitude', 'longitude'];
	const validation = validatePayloadKeys(body, allowedKeys);
	if (validation) {
		return json({ error: { general: validation.error } }, { status: 400 });
	}

	const { attendance_source_cuid, latitude, longitude } = trimStringFields(body) as any;

	if (!locals.user?.email) {
		return json({ error: { general: 'Unauthorized' } }, { status: 401 });
	}

	let employee_cuid: string;
	try {
		const { employee } = await resolveEmployee(locals.user.email);
		employee_cuid = employee.cuid;
	} catch (e) {
		return json({ error: { general: 'Employee record not found for the authenticated user.' } }, { status: 403 });
	}

	try {
		let userId: string | null = null;
		try {
			const session = await locals.auth();
			userId = session?.user?.id ?? null;
		} catch (authError) {
			console.warn('Failed to retrieve session from locals.auth():', authError);
		}

		const record = await checkIn(employee_cuid, attendance_source_cuid, userId, {
			latitude: Number(latitude),
			longitude: Number(longitude)
		});
		return successResponse({
			message: 'Checked in successfully',
			cuid: record.cuid
		}, 201);
	} catch (error: any) {
		if (error instanceof AttendanceValidationError) {
			const isConflict = error.message.toLowerCase().includes('already') || error.message.toLowerCase().includes('please check out first');
			return json({ data: { error: { [error.field]: error.message } } }, { status: isConflict ? 409 : 400 });
		}

		console.error('POST /api/attendance/check-in failed', error);
		return errorResponse('Failed to check in', 500);
	}
};
