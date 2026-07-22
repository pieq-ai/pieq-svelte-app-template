<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import AuditFilters from './AuditFilters.svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import AuditTable from './AuditTable.svelte';
	import AuditDetailDrawer from './AuditDetailDrawer.svelte';

	interface AuditLog {
		cuid: string;
		entity_name: string;
		entity_cuid: string;
		action_type: string;
		status: string;
		field_name: string | null;
		performed_by: string | null;
		created_at: string;
	}

	let { data } = $props<{
		data: {
			auditLogs: AuditLog[];
			total: number;
			currentPage: number;
			pageSize: number;
			search: string;
			entity: string;
			action: string;
			status: string;
			performer: string;
			fromDate: string;
			toDate: string;
		};
	}>();

	let searchQuery = $state('');
	let selectedEntity = $state('all');
	let selectedAction = $state('all');
	let selectedStatus = $state('all');
	let fromDate = $state('');
	let toDate = $state('');

	let currentPage = $state(1);
	const pageSize = 10;

	// Drawer state
	let isDrawerOpen = $state(false);
	let selectedLogDetails = $state<any>(null);
	let isDetailLoading = $state(false);

	function resetFilters() {
		searchQuery = '';
		selectedEntity = 'all';
		selectedAction = 'all';
		selectedStatus = 'all';
		fromDate = '';
		toDate = '';
		currentPage = 1;
	}

	// Keep states in sync with loader data when browser URL changes (e.g. back/forward)
	$effect(() => {
		searchQuery = data.search || '';
		selectedEntity = data.entity || 'all';
		selectedAction = data.action || 'all';
		selectedStatus = data.status || 'all';
		fromDate = data.fromDate || '';
		toDate = data.toDate || '';
		currentPage = data.currentPage || 1;
	});

	// Sync states to URL search parameters reactively
	$effect(() => {
		const params = new SvelteURLSearchParams($page.url.searchParams);

		if (currentPage > 1) {
			params.set('page', String(currentPage));
		} else {
			params.delete('page');
		}

		if (searchQuery.trim()) {
			params.set('search', searchQuery.trim());
		} else {
			params.delete('search');
		}

		if (selectedEntity !== 'all') {
			params.set('entity_name', selectedEntity);
		} else {
			params.delete('entity_name');
		}

		if (selectedAction !== 'all') {
			params.set('action_type', selectedAction);
		} else {
			params.delete('action_type');
		}

		if (selectedStatus !== 'all') {
			params.set('status', selectedStatus);
		} else {
			params.delete('status');
		}

		if (fromDate) {
			params.set('fromDate', fromDate);
		} else {
			params.delete('fromDate');
		}

		if (toDate) {
			params.set('toDate', toDate);
		} else {
			params.delete('toDate');
		}

		const newQueryString = params.toString();
		const currentQueryString = $page.url.searchParams.toString();

		if (newQueryString !== currentQueryString) {
			goto(`?${newQueryString}`, { keepFocus: true, noScroll: true });
		}
	});

	let filteredAuditLogs = $derived(data.auditLogs);

	async function handleRowClick(cuid: string) {
		isDrawerOpen = true;
		isDetailLoading = true;
		selectedLogDetails = null;
		try {
			const res = await fetch(`/api/audit-logs/${cuid}`);
			if (res.ok) {
				const json = await res.json();
				selectedLogDetails = json.data;
			}
		} catch (err) {
			console.error('Failed to load audit log details', err);
		} finally {
			isDetailLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Audit History</title>
</svelte:head>

<div class="w-full space-y-4 px-1 py-0">
	<div class="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl wrap-break-word">Audit History</h1>
			<p class="text-sm text-muted-foreground">View and trace configurations and transactions modifications across the HRMS</p>
		</div>
	</div>

	<AuditFilters
		bind:searchQuery
		bind:selectedEntity
		bind:selectedAction
		bind:selectedStatus
		bind:fromDate
		bind:toDate
		onPageReset={() => (currentPage = 1)}
		onReset={resetFilters}
	/>

	<AuditTable
		logs={filteredAuditLogs}
		total={data.total}
		bind:currentPage
		pageSize={pageSize}
		onRowClick={handleRowClick}
	/>
</div>

<AuditDetailDrawer
	open={isDrawerOpen}
	loading={isDetailLoading}
	log={selectedLogDetails}
	onClose={() => (isDrawerOpen = false)}
/>
