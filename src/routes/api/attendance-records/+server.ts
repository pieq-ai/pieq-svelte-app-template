import { requirePermission } from '$lib/server/guards/permission.guard';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	createAttendanceRecord,
	listAttendanceRecords,
	AttendanceValidationError,
	AttendanceMultiValidationError
} from '$lib/server/services/attendance-record.service.js';
import { validatePayloadKeys, trimStringFields } from '$lib/server/validation.js';
import { successResponse, errorResponse, createSuccessResponse } from '$lib/server/response.js';

export const GET: RequestHandler = async ({ url, locals }) => {
	requirePermission(locals.user, 'attendance:view');
	try {
		const employee_cuid = url.searchParams.get('employee_cuid') ?? undefined;
		const date = url.searchParams.get('date') ?? undefined;
		const status = url.searchParams.get('status') ?? undefined;
		const attendance_source_cuid = url.searchParams.get('attendance_source_cuid') ?? undefined;

		const records = await listAttendanceRecords({
			employee_cuid,
			date,
			status,
			attendance_source_cuid
		});

		// Format bigints or dates if needed, but prisma does this or we can map them
		const formattedRecords = records.map((rec) => ({
			cuid: rec.cuid,
			employee_cuid: rec.employee_cuid,
			date: rec.date.toISOString().split('T')[0],
			check_in_time: rec.check_in_time ? rec.check_in_time.toISOString() : null,
			check_out_time: rec.check_out_time ? rec.check_out_time.toISOString() : null,
			work_duration_minutes: rec.work_duration_minutes,
			status: rec.status,
			attendance_source_cuid: rec.attendance_source_cuid,
			remarks: rec.remarks
		}));

		return successResponse(formattedRecords);
	} catch (error) {
		console.error('GET /api/attendance-records failed', error);
		return errorResponse('Failed to list attendance records', 500);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	requirePermission(locals.user, 'attendance:create');
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

		const record = await createAttendanceRecord({
			...trimmedBody,
			created_by: userId,
			updated_by: userId
		});

		return createSuccessResponse('Attendance record', record.cuid);
	} catch (error: any) {
		const isMultiError =
			error instanceof AttendanceMultiValidationError ||
			(error !== null && typeof error === 'object' && 'name' in error && error.name === 'AttendanceMultiValidationError');

		if (isMultiError) {
			const fields = (error as any).fields;
			const isConflict = Object.values(fields).some((msg: any) => String(msg).toLowerCase().includes('already exists'));
			return json({ data: { error: fields } }, { status: isConflict ? 409 : 400 });
		}
		if (error instanceof AttendanceValidationError) {
			const isConflict = error.message.toLowerCase().includes('already exists');
			return json({ data: { error: { [error.field]: error.message } } }, { status: isConflict ? 409 : 400 });
		}

		console.error('POST /api/attendance-records failed', error);
		return errorResponse('Failed to create attendance record', 500);
	}
};
