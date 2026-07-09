import { requirePermission } from '$lib/server/guards/permission.guard';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getEmployeeHistory, getPendingCheckOuts } from '$lib/server/services/attendance.service.js';
import { successResponse, errorResponse } from '$lib/server/response.js';
import { resolveEmployee } from '$lib/server/services/leave.service.js';
import { db } from '$lib/server/db.js';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const email = locals.user?.email || '';
		if (!email) {
			return errorResponse('Unauthorized', 401);
		}
		
		const { employee, employment } = await resolveEmployee(email);
		const employee_cuid = employee.cuid;
		if (!employee_cuid) {
			return errorResponse('Employee record not found', 404);
		}

		let augmentedEmployee = { 
			...employee, 
			location_cuid: employment.location_cuid, 
			latitude: null, 
			longitude: null,
			date_of_joining: employment.date_of_joining,
			relieving_date: employment.relieving_date
		};

		if (employment.location_cuid) {
			const loc = await db.companyLocation.findUnique({
				where: { cuid: employment.location_cuid }
			});
			if (loc) {
				augmentedEmployee.latitude = loc.latitude ? Number(loc.latitude) : null;
				augmentedEmployee.longitude = loc.longitude ? Number(loc.longitude) : null;
			}
		}

		const [records, pendingRecords] = await Promise.all([
			getEmployeeHistory(employee_cuid),
			getPendingCheckOuts(employee_cuid)
		]);

		const pendingCuids = new Set(pendingRecords.map((r) => r.cuid));

		const formattedRecords = records.map((rec) => ({
			cuid: rec.cuid,
			date: rec.date.toISOString().split('T')[0],
			check_in_time: rec.check_in_time ? rec.check_in_time.toISOString() : null,
			check_out_time: rec.check_out_time ? rec.check_out_time.toISOString() : null,
			work_duration_minutes: rec.work_duration_minutes,
			status: rec.status,
			isPendingCheckout: pendingCuids.has(rec.cuid)
		}));

		return successResponse({ 
			records: formattedRecords, 
			pendingRecords,
			employee: augmentedEmployee
		});
	} catch (error) {
		console.error('GET /api/attendance/me failed', error);
		return errorResponse('Failed to retrieve attendance history', 500);
	}
};
