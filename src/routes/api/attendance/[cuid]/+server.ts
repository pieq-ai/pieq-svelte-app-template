import { requirePermission } from '$lib/server/guards/permission.guard';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getEmployeeHistory } from '$lib/server/services/attendance.service.js';
import { successResponse, errorResponse } from '$lib/server/response.js';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const employee_cuid = params.cuid;
		if (!employee_cuid) {
			return errorResponse('Employee CUID is required', 400);
		}

		const records = await getEmployeeHistory(employee_cuid);

		const formattedRecords = records.map((rec) => ({
			cuid: rec.cuid,
			date: rec.date.toISOString().split('T')[0],
			check_in_time: rec.check_in_time ? rec.check_in_time.toISOString() : null,
			check_out_time: rec.check_out_time ? rec.check_out_time.toISOString() : null,
			work_duration_minutes: rec.work_duration_minutes,
			status: rec.status
		}));

		return successResponse(formattedRecords);
	} catch (error) {
		console.error(`GET /api/attendance/${params.cuid} failed`, error);
		return errorResponse('Failed to retrieve attendance history', 500);
	}
};
