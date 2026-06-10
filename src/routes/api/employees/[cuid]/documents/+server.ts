import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as documentService from '$lib/server/services/document.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const employee_cuid = event.params.cuid;
		if (!employee_cuid) throw new Error('CUID2 parameter is missing');

		const documents = await documentService.getDocumentsByEmployeeCuid(employee_cuid);
		return json({ data: documents });
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body = body.map((doc: any) => ({ ...doc, updated_by: user_id }));

		const documents = await documentService.replaceDocuments(employee_cuid, body);
		return json({ data: documents, message: 'Successfully updated documents' });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}
