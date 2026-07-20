<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import {
		Badge,
		Button,
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
		Pagination,
		SearchInput,
		FilterDropdown,
		CrudModal,
		DatePicker
	} from '$lib/components';
	import { UI_CONSTANTS } from '$lib/constants';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	interface AuditLog {
		cuid: string;
		entity_name: string;
		entity_cuid: string;
		action_type: string;
		status: string;
		field_name: string | null;
		performed_by: string | null;
		performed_by_type: string;
		ip_address: string | null;
		user_agent: string | null;
		remarks: string | null;
		request_id: string;
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
			actorType: string;
			fromDate: string;
			toDate: string;
			sortColumn: string;
			sortDirection: 'asc' | 'desc' | null;
		};
	}>();

	let searchQuery = $state('');
	let selectedEntity = $state('all');
	let selectedAction = $state('all');
	let selectedStatus = $state('all');
	let selectedActorType = $state('all');
	let fromDate = $state('');
	let toDate = $state('');

	let currentPage = $state(1);
	let pageSize = $state(10);
	let sortColumn = $state('created_at');
	let sortDirection = $state<'asc' | 'desc' | null>('desc');

	// Slide drawer state
	let isDrawerOpen = $state(false);
	let selectedLogDetails = $state<any>(null);
	let isDetailLoading = $state(false);

	$effect(() => {
		searchQuery = data.search;
		selectedEntity = data.entity || 'all';
		selectedAction = data.action || 'all';
		selectedStatus = data.status || 'all';
		selectedActorType = data.actorType || 'all';
		fromDate = data.fromDate;
		toDate = data.toDate;
		currentPage = data.currentPage;
		pageSize = data.pageSize;
		sortColumn = data.sortColumn;
		sortDirection = data.sortDirection;
	});

	$effect(() => {
		if (currentPage !== data.currentPage) {
			updateQueryParams({ page: currentPage });
		}
	});

	function updateQueryParams(newParams: Record<string, string | number | undefined | null>) {
		const query = new SvelteURLSearchParams($page.url.searchParams);
		for (const [key, val] of Object.entries(newParams)) {
			if (val === undefined || val === null || val === '' || val === 'all') {
				query.delete(key);
			} else {
				query.set(key, String(val));
			}
		}
		if (!('page' in newParams)) {
			query.set('page', '1');
		}
		goto(`?${query.toString()}`, { keepFocus: true, noScroll: true });
	}

	let searchTimer: ReturnType<typeof setTimeout>;
	function handleSearchInput(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			updateQueryParams({ search: val });
		}, 400);
	}

	function handleSort(column: string) {
		let direction: 'asc' | 'desc' | null = 'asc';
		if (sortColumn === column) {
			if (sortDirection === 'asc') direction = 'desc';
			else if (sortDirection === 'desc') direction = null;
		}
		updateQueryParams({ sortColumn: column, sortDirection: direction });
	}

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

	const entityOptions = [
		{ label: 'All Entities', value: 'all' },
		{ label: 'Employee', value: 'Employee' },
		{ label: 'Employment', value: 'Employment' },
		{ label: 'Leave', value: 'Leave' },
		{ label: 'Attendance', value: 'Attendance' },
		{ label: 'SalaryStructure', value: 'SalaryStructure' },
		{ label: 'Payroll', value: 'Payroll' },
		{ label: 'Shift', value: 'Shift' },
		{ label: 'ShiftAssignment', value: 'ShiftAssignment' },
		{ label: 'Holiday', value: 'Holiday' },
		{ label: 'Notification', value: 'Notification' },
		{ label: 'Document', value: 'Document' },
		{ label: 'Department', value: 'Department' },
		{ label: 'Designation', value: 'Designation' },
		{ label: 'Role', value: 'Role' },
		{ label: 'SystemRole', value: 'SystemRole' }
	];

	const actionOptions = [
		{ label: 'All Actions', value: 'all' },
		{ label: 'create', value: 'create' },
		{ label: 'update', value: 'update' },
		{ label: 'delete', value: 'delete' },
		{ label: 'approve', value: 'approve' },
		{ label: 'reject', value: 'reject' },
		{ label: 'login', value: 'login' },
		{ label: 'logout', value: 'logout' }
	];

	const statusOptions = [
		{ label: 'All Statuses', value: 'all' },
		{ label: 'SUCCESS', value: 'SUCCESS' },
		{ label: 'FAILED', value: 'FAILED' },
		{ label: 'PARTIAL', value: 'PARTIAL' }
	];

	const actorTypeOptions = [
		{ label: 'All Actor Types', value: 'all' },
		{ label: 'USER', value: 'USER' },
		{ label: 'SYSTEM', value: 'SYSTEM' },
		{ label: 'CRON', value: 'CRON' },
		{ label: 'API', value: 'API' }
	];

	function isInteractive(target: HTMLElement | null, rowElement: HTMLElement): boolean {
		let curr = target;
		while (curr && curr !== rowElement) {
			const tagName = curr.tagName.toLowerCase();
			if (
				tagName === 'a' ||
				tagName === 'button' ||
				tagName === 'input' ||
				tagName === 'select' ||
				tagName === 'textarea' ||
				curr.getAttribute('role') === 'button'
			) {
				return true;
			}
			curr = curr.parentElement;
		}
		return false;
	}

	function onTableClick(cuid: string, event: MouseEvent) {
		const target = event.target as HTMLElement;
		const row = event.currentTarget as HTMLElement;
		if (isInteractive(target, row)) return;
		handleRowClick(cuid);
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

	<!-- Filters & Searching -->
	<div class="space-y-3">
		<div class="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 items-end">
			<div class="col-span-1 sm:col-span-2">
				<SearchInput
					id="search_audits"
					name="search_audits"
					value={searchQuery}
					oninput={handleSearchInput}
					placeholder="Search remarks, request ID..."
				/>
			</div>

			<FilterDropdown
				value={selectedEntity}
				onChange={(val) => updateQueryParams({ entity_name: val })}
				options={entityOptions}
			/>

			<FilterDropdown
				value={selectedAction}
				onChange={(val) => updateQueryParams({ action_type: val })}
				options={actionOptions}
			/>

			<FilterDropdown
				value={selectedStatus}
				onChange={(val) => updateQueryParams({ status: val })}
				options={statusOptions}
			/>

			<FilterDropdown
				value={selectedActorType}
				onChange={(val) => updateQueryParams({ performed_by_type: val })}
				options={actorTypeOptions}
			/>
		</div>

		<div class="flex flex-wrap items-center gap-4 bg-muted/40 p-3 rounded-lg border border-border">
			<div class="flex items-center gap-2">
				<span class="text-xs font-semibold text-muted-foreground whitespace-nowrap">From Date:</span>
				<div class="w-40">
					<DatePicker
						placeholder="From Date"
						bind:value={fromDate}
						isFilter={true}
						onchange={() => updateQueryParams({ fromDate })}
					/>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<span class="text-xs font-semibold text-muted-foreground whitespace-nowrap">To Date:</span>
				<div class="w-40">
					<DatePicker
						placeholder="To Date"
						bind:value={toDate}
						isFilter={true}
						onchange={() => updateQueryParams({ toDate })}
					/>
				</div>
			</div>
			{#if fromDate || toDate || searchQuery || selectedEntity !== 'all' || selectedAction !== 'all' || selectedStatus !== 'all' || selectedActorType !== 'all'}
				<Button
					variant="ghost"
					size="sm"
					class="text-xs text-hrms-destructive font-medium hover:bg-hrms-destructive/5"
					onclick={() => goto('?')}
				>
					Clear Filters
				</Button>
			{/if}
		</div>

		<Card class="py-0 overflow-x-auto">
			<Table>
				<TableHeader class="bg-muted">
					<TableRow>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('created_at')}>
								Timestamp
								{#if sortColumn === 'created_at' && sortDirection === 'asc'}
									<ArrowUpIcon class="ml-2 size-4" />
								{:else if sortColumn === 'created_at' && sortDirection === 'desc'}
									<ArrowDownIcon class="ml-2 size-4" />
								{:else}
									<ArrowUpDownIcon class="ml-2 size-4" />
								{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('entity_name')}>
								Entity
								{#if sortColumn === 'entity_name' && sortDirection === 'asc'}
									<ArrowUpIcon class="ml-2 size-4" />
								{:else if sortColumn === 'entity_name' && sortDirection === 'desc'}
									<ArrowDownIcon class="ml-2 size-4" />
								{:else}
									<ArrowUpDownIcon class="ml-2 size-4" />
								{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">Entity CUID</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">Action</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">Status</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('performed_by')}>
								Performed By
								{#if sortColumn === 'performed_by' && sortDirection === 'asc'}
									<ArrowUpIcon class="ml-2 size-4" />
								{:else if sortColumn === 'performed_by' && sortDirection === 'desc'}
									<ArrowDownIcon class="ml-2 size-4" />
								{:else}
									<ArrowUpDownIcon class="ml-2 size-4" />
								{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">Actor Type</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">Field</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">IP Address</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">Remarks</TableHead>
						<TableHead class="text-right font-bold text-foreground text-[15px] whitespace-nowrap">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if data.auditLogs.length === 0}
						<TableRow>
							<TableCell colspan={11} class="py-8 text-center text-muted-foreground">
								{UI_CONSTANTS.EMPTY_STATE_MESSAGE}
							</TableCell>
						</TableRow>
					{:else}
						{#each data.auditLogs as log (log.cuid)}
							<TableRow onclick={(e) => onTableClick(log.cuid, e)} class="cursor-pointer hover:bg-muted/50">
								<TableCell class="font-medium text-xs whitespace-nowrap">
									{new Date(log.created_at).toLocaleString()}
								</TableCell>
								<TableCell class="font-semibold">{log.entity_name}</TableCell>
								<TableCell class="font-mono text-[11px] max-w-[120px] truncate" title={log.entity_cuid}>
									{log.entity_cuid}
								</TableCell>
								<TableCell class="capitalize">
									<Badge variant="outline" class="font-mono font-medium text-[10px] uppercase">
										{log.action_type}
									</Badge>
								</TableCell>
								<TableCell>
									{#if log.status === 'SUCCESS'}
										<span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
											SUCCESS
										</span>
									{:else if log.status === 'FAILED'}
										<span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
											FAILED
										</span>
									{:else}
										<span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-700 border border-amber-500/20">
											PARTIAL
										</span>
									{/if}
								</TableCell>
								<TableCell class="font-medium max-w-[160px] truncate" title={log.performed_by_name || log.performed_by || 'SYSTEM'}>
									{log.performed_by_name || log.performed_by || 'SYSTEM'}
								</TableCell>
								<TableCell>
									<Badge variant="secondary" class="font-mono text-[10px]">
										{log.performed_by_type}
									</Badge>
								</TableCell>
								<TableCell class="font-mono text-[11px] max-w-[120px] truncate">
									{log.field_name || '-'}
								</TableCell>
								<TableCell class="font-mono text-xs">{log.ip_address || '-'}</TableCell>
								<TableCell class="max-w-[200px] truncate text-muted-foreground" title={log.remarks || ''}>
									{log.remarks || '-'}
								</TableCell>
								<TableCell class="text-right">
									<Button variant="ghost" size="icon-sm" onclick={() => handleRowClick(log.cuid)} title="View Details">
										<EyeIcon class="size-4" />
									</Button>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</Card>

		<Pagination
			bind:currentPage={currentPage}
			pageSize={pageSize}
			totalItems={data.total}
		/>
	</div>
</div>

<!-- Row Details Drawer -->
<CrudModal
	open={isDrawerOpen}
	title="Audit Log Details"
	centered={false}
	onClose={() => (isDrawerOpen = false)}
>
	{#if isDetailLoading}
		<div class="flex h-[300px] flex-col items-center justify-center text-muted-foreground">
			<LoaderCircleIcon class="mb-2 size-8 animate-spin" />
			Loading audit details...
		</div>
	{:else if selectedLogDetails}
		<div class="space-y-6 text-sm pb-8">
			<div>
				<h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Context Metadata</h3>
				<div class="grid grid-cols-2 gap-x-4 gap-y-2.5 bg-muted/30 p-4 rounded-lg border border-border font-mono text-xs">
					<span class="text-muted-foreground">Timestamp:</span>
					<span class="font-semibold">{new Date(selectedLogDetails.created_at).toLocaleString()}</span>

					<span class="text-muted-foreground">Request ID:</span>
					<span class="font-semibold text-[11px] break-all">{selectedLogDetails.request_id}</span>

					<span class="text-muted-foreground">Actor:</span>
					<span class="font-semibold break-all">{selectedLogDetails.performed_by_name || selectedLogDetails.performed_by || 'SYSTEM'} ({selectedLogDetails.performed_by_type})</span>

					<span class="text-muted-foreground">IP Address:</span>
					<span class="font-semibold">{selectedLogDetails.ip_address || '-'}</span>

					<span class="text-muted-foreground">User Agent:</span>
					<span class="font-semibold break-all text-[11px] font-sans leading-relaxed">{selectedLogDetails.user_agent || '-'}</span>
				</div>
			</div>

			<div>
				<h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Operation Target</h3>
				<div class="grid grid-cols-2 gap-x-4 gap-y-2.5 bg-muted/30 p-4 rounded-lg border border-border">
					<span class="text-muted-foreground">Entity:</span>
					<span class="font-semibold">{selectedLogDetails.entity_name}</span>

					<span class="text-muted-foreground">Target CUID:</span>
					<span class="font-mono text-xs font-semibold text-[11px] break-all">{selectedLogDetails.entity_cuid}</span>

					<span class="text-muted-foreground">Action Type:</span>
					<span class="font-semibold capitalize">{selectedLogDetails.action_type}</span>

					<span class="text-muted-foreground">Status:</span>
					<span>
						{#if selectedLogDetails.status === 'SUCCESS'}
							<span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">SUCCESS</span>
						{:else if selectedLogDetails.status === 'FAILED'}
							<span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">FAILED</span>
						{:else}
							<span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-700 border border-amber-500/20">PARTIAL</span>
						{/if}
					</span>
				</div>
			</div>

			{#if selectedLogDetails.field_name}
				<div>
					<h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Field Changes</h3>
					<div class="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border border-border font-mono text-xs">
						<span class="text-muted-foreground col-span-2">Modified Field: <span class="text-foreground font-bold">{selectedLogDetails.field_name}</span></span>
						
						<div class="space-y-1">
							<span class="text-xs text-muted-foreground">Previous Value:</span>
							<div class="bg-card p-2 rounded border border-border max-h-[250px] overflow-auto whitespace-pre-wrap break-all text-[11px]">
								{selectedLogDetails.old_value?.value !== undefined ? (typeof selectedLogDetails.old_value.value === 'object' ? JSON.stringify(selectedLogDetails.old_value.value, null, 2) : selectedLogDetails.old_value.value) : '-'}
							</div>
						</div>

						<div class="space-y-1">
							<span class="text-xs text-muted-foreground">New Value:</span>
							<div class="bg-card p-2 rounded border border-border max-h-[250px] overflow-auto whitespace-pre-wrap break-all text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
								{selectedLogDetails.new_value?.value !== undefined ? (typeof selectedLogDetails.new_value.value === 'object' ? JSON.stringify(selectedLogDetails.new_value.value, null, 2) : selectedLogDetails.new_value.value) : '-'}
							</div>
						</div>
					</div>
				</div>
			{/if}

			{#if selectedLogDetails.remarks}
				<div>
					<h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Remarks</h3>
					<p class="bg-muted/30 p-3 rounded-lg border border-border leading-relaxed text-foreground/90">
						{selectedLogDetails.remarks}
					</p>
				</div>
			{/if}
		</div>
	{/if}
</CrudModal>
