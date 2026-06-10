import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as educationService from '$lib/server/services/education.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const employee_cuid = event.params.cuid;
		if (!employee_cuid) throw new Error('CUID2 parameter is missing');

		const educations = await educationService.getEducationsByEmployeeCuid(employee_cuid);
		return json({ data: educations });
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
        if (!Array.isArray(body)) {
            body = [body];
        }
        
        const user_id = event.locals.user?.id;
        body = body.map((edu: any) => ({ ...edu, updated_by: user_id }));

		const educations = await educationService.replaceEducations(employee_cuid, body);
		return json({ data: educations, message: 'Successfully updated educations' });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}
