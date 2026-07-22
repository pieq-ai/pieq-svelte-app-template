<script lang="ts">
	import AuditFilters from './AuditFilters.svelte';
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

	let filteredAuditLogs = $derived.by(() => {
		let result = [...data.auditLogs];

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			result = result.filter(
				(log) =>
					log.entity_name?.toLowerCase().includes(q) ||
					log.entity_cuid?.toLowerCase().includes(q) ||
					log.field_name?.toLowerCase().includes(q) ||
					log.performed_by?.toLowerCase().includes(q)
			);
		}

		if (selectedEntity !== 'all') {
			result = result.filter((log) => log.entity_name === selectedEntity);
		}

		if (selectedAction !== 'all') {
			result = result.filter((log) => log.action_type === selectedAction);
		}

		if (selectedStatus !== 'all') {
			result = result.filter((log) => log.status === selectedStatus);
		}

		if (fromDate) {
			const fromTime = new Date(fromDate).getTime();
			result = result.filter((log) => new Date(log.created_at).getTime() >= fromTime);
		}

		if (toDate) {
			const toTime = new Date(toDate).getTime() + 86400000;
			result = result.filter((log) => new Date(log.created_at).getTime() <= toTime);
		}

		return result;
	});

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
