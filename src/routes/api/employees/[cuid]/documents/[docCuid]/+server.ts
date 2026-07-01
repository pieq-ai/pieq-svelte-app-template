import type { RequestEvent } from '@sveltejs/kit';
import * as documentService from '$lib/server/services/document.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { handleError } from '$lib/server/utils/response.js';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requirePermission(event.locals.user, 'employee:view');
		const docCuid = event.params.docCuid;
		if (!docCuid) throw new Error('Document CUID2 parameter is missing');

		const doc = await documentService.getDocumentByCuid(docCuid);
		if (!doc.document) {
			return new Response('Document content is empty', { status: 404 });
		}

		const headers: Record<string, string> = {
			'Content-Type': doc.mime_type || 'application/octet-stream',
			'Content-Length': doc.document.length.toString()
		};

		const fileName = doc.file_name || 'document';
		headers['Content-Disposition'] = `inline; filename="${encodeURIComponent(fileName)}"`;

		return new Response(doc.document, {
			status: 200,
			headers
		});
	} catch (error) {
		return handleError(error);
	}
}
