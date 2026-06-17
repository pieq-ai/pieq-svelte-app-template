import { db } from '$lib/server/db.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		
		const { cuid } = event.params;
		if (!cuid) {
			return new Response('Not Found', { status: 404 });
		}

		const request = await db.leaveRequest.findUnique({
			where: { cuid }
		});

		if (!request || !request.document_data || !request.file_name) {
			return new Response('Document Not Found', { status: 404 });
		}

		const email = event.locals.user?.email || '';
		const currentEmployee = await db.employment.findFirst({
			where: { official_email: email }
		});

		if (!currentEmployee) {
			return new Response('Unauthorized', { status: 401 });
		}

		const currentEmployeeCuid = currentEmployee.employee_cuid;

		// Authorization: Owner or Reporting Manager or Admin/HR
		const isOwner = request.employee_cuid === currentEmployeeCuid;
		
		let isManager = false;
		if (!isOwner) {
			const requesterEmployment = await db.employment.findFirst({
				where: { employee_cuid: request.employee_cuid }
			});
			if (requesterEmployment?.reporting_manager_cuid === currentEmployeeCuid) {
				isManager = true;
			}
		}

		if (!isOwner && !isManager) {
			return new Response('Forbidden', { status: 403 });
		}

		const headers = new Headers();
		headers.set('Content-Type', request.mime_type || 'application/octet-stream');
		headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(request.file_name)}"`);
		headers.set('Content-Length', request.document_data.length.toString());

		return new Response(request.document_data, {
			status: 200,
			headers
		});
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : 400;
		return new Response(message, { status });
	}
}
