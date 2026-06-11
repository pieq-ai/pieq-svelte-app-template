import type { RequestEvent } from '@sveltejs/kit';
import * as experienceService from '$lib/server/services/experience.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { sendList, sendUpdated, handleError } from '$lib/server/utils/response.js';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const employee_cuid = event.params.cuid;
		if (!employee_cuid) throw new Error('CUID2 parameter is missing');

		const experiences = await experienceService.getExperiencesByEmployeeCuid(employee_cuid);
		return sendList(experiences);
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
        if (!Array.isArray(body)) {
            body = [body];
        }
        
        const user_id = event.locals.user?.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body = body.map((exp: any) => ({ ...exp, updated_by: user_id }));

		await experienceService.replaceExperiences(employee_cuid, body);
		return sendUpdated(employee_cuid, 'Successfully updated experience records');
	} catch (error) {
		return handleError(error);
	}
}
