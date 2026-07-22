<script lang="ts">
	import {
		Button,
		SearchInput,
		FilterDropdown,
		DatePicker
	} from '$lib/components';

	interface Props {
		searchQuery: string;
		selectedEntity: string;
		selectedAction: string;
		selectedStatus: string;
		fromDate: string;
		toDate: string;
		onPageReset: () => void;
		onReset: () => void;
	}

	let {
		searchQuery = $bindable(),
		selectedEntity = $bindable(),
		selectedAction = $bindable(),
		selectedStatus = $bindable(),
		fromDate = $bindable(),
		toDate = $bindable(),
		onPageReset,
		onReset
	}: Props = $props();

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

	let hasActiveFilters = $derived(
		!!(fromDate || toDate || searchQuery || selectedEntity !== 'all' || selectedAction !== 'all' || selectedStatus !== 'all')
	);
</script>

<div class="rounded-lg border border-border bg-card p-3.5 shadow-2xs space-y-3">
	<div class="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-6 xl:grid-cols-7 items-center">
		<div class="col-span-1 sm:col-span-2 md:col-span-2 xl:col-span-2">
			<SearchInput
				id="search_audits"
				name="search_audits"
				bind:value={searchQuery}
				oninput={onPageReset}
				placeholder="Search entity name, CUID..."
			/>
		</div>

		<div class="col-span-1 sm:col-span-1 md:col-span-2 xl:col-span-1">
			<FilterDropdown
				value={selectedEntity}
				onChange={(val) => { selectedEntity = val; onPageReset(); }}
				options={entityOptions}
				triggerClass="w-full"
			/>
		</div>

		<div class="col-span-1 sm:col-span-1 md:col-span-2 xl:col-span-1">
			<FilterDropdown
				value={selectedAction}
				onChange={(val) => { selectedAction = val; onPageReset(); }}
				options={actionOptions}
				triggerClass="w-full"
			/>
		</div>

		<div class="col-span-1 sm:col-span-1 md:col-span-2 xl:col-span-1">
			<FilterDropdown
				value={selectedStatus}
				onChange={(val) => { selectedStatus = val; onPageReset(); }}
				options={statusOptions}
				triggerClass="w-full"
			/>
		</div>

		<div class="col-span-1 sm:col-span-1 md:col-span-2 xl:col-span-1">
			<DatePicker
				placeholder="From Date"
				bind:value={fromDate}
				isFilter={true}
				onchange={onPageReset}
			/>
		</div>

		<div class="col-span-1 sm:col-span-1 md:col-span-2 xl:col-span-1">
			<DatePicker
				placeholder="To Date"
				bind:value={toDate}
				isFilter={true}
				onchange={onPageReset}
			/>
		</div>
	</div>

	{#if hasActiveFilters}
		<div class="flex items-center justify-end pt-2 border-t border-border/60">
			<Button
				variant="ghost"
				size="sm"
				class="text-xs text-hrms-destructive font-medium hover:bg-hrms-destructive/5 h-7"
				onclick={onReset}
			>
				Clear Filters
			</Button>
		</div>
	{/if}
</div>
