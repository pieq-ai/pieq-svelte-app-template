import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import * as auditService from '$lib/server/services/audit.service.js';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requirePermission(event.locals.user, 'audit:view');

		const url = new URL(event.request.url);
		const page = parseInt(url.searchParams.get('page') || '1', 10);
		const limit = parseInt(url.searchParams.get('limit') || '50', 10);
		const search = url.searchParams.get('search') || undefined;
		const entity_name = url.searchParams.get('entity_name') || undefined;
		const action_type = url.searchParams.get('action_type') || undefined;
		const status = url.searchParams.get('status') || undefined;
		const performed_by = url.searchParams.get('performed_by') || undefined;
		const fromDateStr = url.searchParams.get('fromDate') || undefined;
		const toDateStr = url.searchParams.get('toDate') || undefined;

		const fromDate = fromDateStr ? new Date(fromDateStr) : undefined;
		const toDate = toDateStr ? new Date(toDateStr) : undefined;

		const skip = (page - 1) * limit;
		const take = limit;

		const filters = {
			skip,
			take,
			search,
			entity_name,
			action_type,
			status,
			performed_by,
			fromDate,
			toDate
		};

		const result = await auditService.getAuditLogs(filters);

		// Serialize BigInt IDs
		const serializedItems = result.items.map((item: any) => ({
			...item,
			id: item.id.toString()
		}));

		return json({
			data: serializedItems,
			total: result.total,
			page,
			limit
		});
	} catch (err: any) {
		const status = err.status ?? 500;
		return json({ error: err.body?.message || err.message }, { status });
	}
}
