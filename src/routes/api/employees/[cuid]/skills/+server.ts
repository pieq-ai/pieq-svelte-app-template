import type { RequestEvent } from '@sveltejs/kit';
import * as skillService from '$lib/server/services/skill.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { sendList, sendUpdated, handleError } from '$lib/server/utils/response.js';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const employee_cuid = event.params.cuid;
		if (!employee_cuid) throw new Error('CUID2 parameter is missing');

		const skills = await skillService.getSkillsByEmployeeCuid(employee_cuid);
		return sendList(skills);
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
        body = body.map((skill: any) => ({ ...skill, updated_by: user_id }));

		await skillService.replaceSkills(employee_cuid, body);
		return sendUpdated(employee_cuid, 'Successfully updated skills records');
	} catch (error) {
		return handleError(error);
	}
}
