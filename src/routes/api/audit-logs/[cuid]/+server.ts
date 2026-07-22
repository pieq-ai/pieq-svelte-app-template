import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import * as auditService from '$lib/server/services/audit.service.js';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requirePermission(event.locals.user, 'audit:view');

		const cuid = event.params.cuid;
		if (!cuid) {
			return json({ error: 'Audit log CUID is required' }, { status: 400 });
		}

		const logEntry = await auditService.getAuditLogByCuid(cuid);
		if (!logEntry) {
			return json({ error: 'Audit log entry not found' }, { status: 404 });
		}

		return json({
			data: {
				...logEntry,
				id: logEntry.id.toString()
			}
		});
	} catch (err: any) {
		const status = err.status ?? 500;
		return json({ error: err.body?.message || err.message }, { status });
	}
}
