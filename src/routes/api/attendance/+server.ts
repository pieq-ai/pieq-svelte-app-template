import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getEmployeeHistory } from '$lib/server/services/attendance.service.js';
import { successResponse, errorResponse } from '$lib/server/response.js';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const employee_cuid = url.searchParams.get('employee_cuid');
		if (!employee_cuid) {
			return errorResponse('Employee CUID is required', 400);
		}

		const records = await getEmployeeHistory(employee_cuid);

		const formattedRecords = records.map((rec) => ({
			cuid: rec.cuid,
			employee_cuid: rec.employee_cuid,
			attendance_date: rec.attendance_date.toISOString().split('T')[0],
			check_in_time: rec.check_in_time ? rec.check_in_time.toISOString() : null,
			check_out_time: rec.check_out_time ? rec.check_out_time.toISOString() : null,
			work_duration_minutes: rec.work_duration_minutes,
			attendance_status: rec.attendance_status,
			attendance_source_cuid: rec.attendance_source_cuid,
			remarks: rec.remarks,
			created_at: rec.created_at.toISOString(),
			updated_at: rec.updated_at.toISOString()
		}));

		return successResponse(formattedRecords);
	} catch (error) {
		console.error('GET /api/attendance failed', error);
		return errorResponse('Failed to retrieve attendance history', 500);
	}
};
