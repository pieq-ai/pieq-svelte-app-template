import type { RequestEvent } from '@sveltejs/kit';
import * as employmentService from '$lib/server/services/employment.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { mapToDb } from '$lib/server/utils/mapping.js';
import { sendItem, sendUpdated, handleError } from '$lib/server/utils/response.js';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const employee_cuid = event.params.cuid;
		if (!employee_cuid) throw new Error('CUID2 parameter is missing');

		const employment = await employmentService.getEmploymentByEmployeeCuid(employee_cuid);
		return sendItem(employment);
	} catch (error) {
		return handleError(error);
	}
}

export async function PUT(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const employee_cuid = event.params.cuid;
		if (!employee_cuid) throw new Error('CUID2 parameter is missing');

		let body = await event.request.json();
		body = mapToDb(body);
		body.updated_by = event.locals.user?.id;

		await employmentService.upsertEmployment(employee_cuid, body);
		return sendUpdated(employee_cuid, 'Successfully updated employment details');
	} catch (error) {
		return handleError(error);
	}
}
