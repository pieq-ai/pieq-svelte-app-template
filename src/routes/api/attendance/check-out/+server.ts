import { requirePermission } from '$lib/server/guards/permission.guard';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	checkOut,
	AttendanceValidationError
} from '$lib/server/services/attendance.service.js';
import { resolveEmployee } from '$lib/server/services/leave.service.js';
import { validatePayloadKeys, trimStringFields } from '$lib/server/validation.js';
import { errorResponse, successResponse } from '$lib/server/response.js';


export const PUT: RequestHandler = async ({ request, locals }) => {
	requirePermission(locals.user, 'dashboard:view');
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return json({ error: { general: 'Request body must be valid JSON' } }, { status: 400 });
	}

	const allowedKeys = ['latitude', 'longitude', 'attendance_record_cuid', 'check_out_time'];
	const validation = validatePayloadKeys(body, allowedKeys);
	if (validation) {
		return json({ error: { general: validation.error } }, { status: 400 });
	}

	const { latitude, longitude, attendance_record_cuid, check_out_time } = trimStringFields(body) as any;

	const lat = Number(latitude);
	const lng = Number(longitude);

	if (
		latitude === null || latitude === undefined ||
		longitude === null || longitude === undefined ||
		Number.isNaN(lat) || Number.isNaN(lng) ||
		!Number.isFinite(lat) || !Number.isFinite(lng) ||
		lat < -90 || lat > 90 ||
		lng < -180 || lng > 180 ||
		(lat === 0 && lng === 0)
	) {
		return json({ error: { general: 'Invalid GPS coordinates provided.' } }, { status: 400 });
	}

	if (!locals.user?.email) {
		return json({ error: { general: 'Employee email not found' } }, { status: 403 });
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

		const record = await checkOut(
			employee_cuid,
			userId,
			{
				latitude: lat,
				longitude: lng
			},
			attendance_record_cuid,
			check_out_time
		);
		return successResponse({
			message: 'Checked out successfully',
			cuid: record.cuid
		}, 200);
	} catch (error: any) {
		if (error instanceof AttendanceValidationError) {
			const isConflict = error.message.toLowerCase().includes('already') || error.message.toLowerCase().includes('no open check-in');
			return json({ data: { error: { [error.field]: error.message } } }, { status: isConflict ? 409 : 400 });
		}

		console.error('PUT /api/attendance/check-out failed', error);
		return errorResponse('Failed to check out', 500);
	}
};
