import { requirePermission } from '$lib/server/guards/permission.guard';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	getAttendanceRecordByCuid,
	updateAttendanceRecord,
	deleteAttendanceRecord,
	AttendanceValidationError,
	AttendanceMultiValidationError
} from '$lib/server/services/attendance-record.service.js';
import { validatePayloadKeys, trimStringFields } from '$lib/server/validation.js';
import {
	successResponse,
	errorResponse,
	updateSuccessResponse,
	deleteSuccessResponse
} from '$lib/server/response.js';

export const GET: RequestHandler = async ({ params }) => {
	const { cuid } = params;

	try {
		const record = await getAttendanceRecordByCuid(cuid);
		if (!record) {
			return errorResponse('Attendance record not found', 404);
		}
		const formatted = {
			cuid: record.cuid,
			employee_cuid: record.employee_cuid,
			date: record.date.toISOString().split('T')[0],
			check_in_time: record.check_in_time ? record.check_in_time.toISOString() : null,
			check_out_time: record.check_out_time ? record.check_out_time.toISOString() : null,
			work_duration_minutes: record.work_duration_minutes,
			status: record.status,
			attendance_source_cuid: record.attendance_source_cuid,
			remarks: record.remarks
		};
		return successResponse(formatted);
	} catch (error) {
		console.error(`GET /api/attendance-records/${cuid} failed`, error);
		return errorResponse('Failed to retrieve attendance record', 500);
	}
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const { cuid } = params;
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return json({ error: { general: 'Request body must be valid JSON' } }, { status: 400 });
	}

	const allowedKeys = [
		'employee_cuid',
		'date',
		'check_in_time',
		'check_out_time',
		'status',
		'attendance_source_cuid',
		'remarks'
	];

	const validation = validatePayloadKeys(body, allowedKeys);
	if (validation) {
		return json({ error: { general: validation.error } }, { status: 400 });
	}

	const trimmedBody = trimStringFields(body) as any;

	try {
		let userId: string | null = null;
		try {
			const session = await locals.auth();
			userId = session?.user?.id ?? null;
		} catch (authError) {
			console.warn('Failed to retrieve session from locals.auth():', authError);
		}

		const record = await updateAttendanceRecord(cuid, {
			...trimmedBody,
			updated_by: userId
		});

		return updateSuccessResponse('Attendance record', record.cuid);
	} catch (error: any) {
		const isMultiError =
			error instanceof AttendanceMultiValidationError ||
			(error !== null && typeof error === 'object' && 'name' in error && error.name === 'AttendanceMultiValidationError');

		if (isMultiError) {
			return json({ data: { error: (error as any).fields } }, { status: 400 });
		}
		if (error instanceof AttendanceValidationError) {
			return json({ data: { error: { [error.field]: error.message } } }, { status: 400 });
		}

		console.error(`PUT /api/attendance-records/${cuid} failed`, error);
		return errorResponse('Failed to update attendance record', 500);
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	const { cuid } = params;

	try {
		const record = await deleteAttendanceRecord(cuid);
		return deleteSuccessResponse('Attendance record', record.cuid);
	} catch (error) {
		console.error(`DELETE /api/attendance-records/${cuid} failed`, error);
		return errorResponse('Failed to delete attendance record', 500);
	}
};
