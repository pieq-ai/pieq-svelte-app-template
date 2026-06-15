import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	checkIn,
	AttendanceValidationError
} from '$lib/server/services/attendance.service.js';
import { validatePayloadKeys, trimStringFields } from '$lib/server/validation.js';
import { errorResponse, successResponse } from '$lib/server/response.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return json({ error: { general: 'Request body must be valid JSON' } }, { status: 400 });
	}

	const allowedKeys = ['employee_cuid', 'attendance_source_cuid'];
	const validation = validatePayloadKeys(body, allowedKeys);
	if (validation) {
		return json({ error: { general: validation.error } }, { status: 400 });
	}

	const { employee_cuid, attendance_source_cuid } = trimStringFields(body) as any;

	try {
		let userId: string | null = null;
		try {
			const session = await locals.auth();
			userId = session?.user?.id ?? null;
		} catch (authError) {
			console.warn('Failed to retrieve session from locals.auth():', authError);
		}

		const record = await checkIn(employee_cuid, attendance_source_cuid, userId);
		return successResponse({
			message: 'Checked in successfully',
			cuid: record.cuid
		}, 201);
	} catch (error: any) {
		if (error instanceof AttendanceValidationError) {
			return json({ data: { error: { [error.field]: error.message } } }, { status: 400 });
		}

		console.error('POST /api/attendance/check-in failed', error);
		return errorResponse('Failed to check in', 500);
	}
};
