import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, url }) => {
	const page = url.searchParams.get('page') || '1';
	const limit = url.searchParams.get('limit') || '10';
	const search = url.searchParams.get('search') || '';
	const entity = url.searchParams.get('entity_name') || '';
	const action = url.searchParams.get('action_type') || '';
	const status = url.searchParams.get('status') || '';
	const performer = url.searchParams.get('performed_by') || '';
	const actorType = url.searchParams.get('performed_by_type') || '';
	const fromDate = url.searchParams.get('fromDate') || '';
	const toDate = url.searchParams.get('toDate') || '';

	const sortColumn = url.searchParams.get('sortColumn') || 'created_at';
	const sortDirection = url.searchParams.get('sortDirection') || 'desc';

	const params = new URLSearchParams();
	params.set('page', page);
	params.set('limit', limit);
	if (search) params.set('search', search);
	if (entity) params.set('entity_name', entity);
	if (action) params.set('action_type', action);
	if (status) params.set('status', status);
	if (performer) params.set('performed_by', performer);
	if (actorType) params.set('performed_by_type', actorType);
	if (fromDate) params.set('fromDate', fromDate);
	if (toDate) params.set('toDate', toDate);
	if (sortColumn) params.set('sortColumn', sortColumn);
	if (sortDirection) params.set('sortDirection', sortDirection);

	const response = await fetch(`/api/audit-logs?${params.toString()}`);
	let auditLogs = [];
	let total = 0;

	if (response.ok) {
		const json = await response.json();
		auditLogs = json.data || [];
		total = json.total || 0;
	}

	return {
		auditLogs,
		total,
		currentPage: parseInt(page, 10),
		pageSize: parseInt(limit, 10),
		search,
		entity,
		action,
		status,
		performer,
		actorType,
		fromDate,
		toDate,
		sortColumn,
		sortDirection
	};
};
