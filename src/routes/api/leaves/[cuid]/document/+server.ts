import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import * as leaveService from '$lib/server/services/leave.service.js';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		
		const { cuid } = event.params;
		if (!cuid) {
			return new Response('Not Found', { status: 404 });
		}

		const email = event.locals.user?.email || '';
		const doc = await leaveService.getLeaveDocument(cuid, email);

		const headers = new Headers();
		headers.set('Content-Type', doc.mimeType || 'application/octet-stream');
		headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(doc.fileName)}"`);
		headers.set('Content-Length', doc.documentData.length.toString());

		return new Response(doc.documentData, {
			status: 200,
			headers
		});
	} catch (error: any) {
		const message = error.message;
		let status = 400;
		if (message === 'Document not found') {
			status = 404;
		} else if (message === 'Unauthorized') {
			status = 401;
		} else if (message === 'Forbidden') {
			status = 403;
		}
		return new Response(message, { status });
	}
}
