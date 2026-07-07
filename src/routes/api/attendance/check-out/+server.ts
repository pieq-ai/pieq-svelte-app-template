import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	checkOut,
	AttendanceValidationError
} from '$lib/server/services/attendance.service.js';
import { validatePayloadKeys, trimStringFields } from '$lib/server/validation.js';
import { errorResponse, successResponse } from '$lib/server/response.js';

export const PUT: RequestHandler = async ({ request, locals }) => {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return json({ error: { general: 'Request body must be valid JSON' } }, { status: 400 });
	}

	const allowedKeys = ['employee_cuid', 'latitude', 'longitude', 'attendance_record_cuid', 'check_out_time'];
	const validation = validatePayloadKeys(body, allowedKeys);
	if (validation) {
		return json({ error: { general: validation.error } }, { status: 400 });
	}

	const { employee_cuid, latitude, longitude, attendance_record_cuid, check_out_time } = trimStringFields(body) as any;

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
				latitude: Number(latitude),
				longitude: Number(longitude)
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
