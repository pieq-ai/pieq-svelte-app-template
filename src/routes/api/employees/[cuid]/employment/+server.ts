import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as employmentService from '$lib/server/services/employment.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { mapToDb } from '$lib/server/utils/mapping.js';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const employee_cuid = event.params.cuid;
		if (!employee_cuid) throw new Error('CUID2 parameter is missing');

		const employment = await employmentService.getEmploymentByEmployeeCuid(employee_cuid);
		return json({ data: employment });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
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

		const employment = await employmentService.upsertEmployment(employee_cuid, body);
		return json({ data: employment, message: 'Successfully updated employment details' });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}
