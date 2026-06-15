<script lang="ts">
	import { slide } from 'svelte/transition';
	import { invalidateAll } from '$app/navigation';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import CheckIcon from '@lucide/svelte/icons/check';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import {
		Badge,
		Button,
		Card,
		CardDescription,
		CardHeader,
		CardTitle,
		Input,
		Label,
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
		DatePicker,
		ConfirmModal,
		CrudModal,
		Pagination,
		TableActions,
		MasterDataDropdown,
		SearchableDropdown
	} from '$lib/components';
	import { toast } from '$lib/toast';
	import { UI_CONSTANTS } from '$lib/constants';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let currentPage = $state(1);
	const pageSize = 10;
	let searchQuery = $state('');

	// Filters
	let filterEmployeeCuid = $state('all');
	let filterDate = $state('');
	let filterStatus = $state('all');
	let filterSourceCuid = $state('all');

	// Sorting
	let sortKey = $state<string | null>('attendance_date');
	let sortDirection = $state<'asc' | 'desc' | null>('desc');

	// Modal States
	let isFormModalOpen = $state(false);
	let isConfirmOpen = $state(false);
	let isSubmitting = $state(false);

	// Record to Edit/Delete
	let editCuid = $state<string | null>(null);
	let activeDeleteCuid = $state<string | null>(null);

	// Form local state
	let formEmployeeCuid = $state('');
	let formAttendanceDate = $state('');
	let formCheckInTime = $state('');
	let formCheckOutTime = $state('');
	let formAttendanceStatus = $state('Present');
	let formAttendanceSourceCuid = $state('');
	let formRemarks = $state('');

	let errors = $state<Record<string, string>>({});
	let submissionAttempted = $state(false);

	// Dropdown Options
	const statusOptions = [
		{ value: 'Present', label: 'Present' },
		{ value: 'Absent', label: 'Absent' },
		{ value: 'Late', label: 'Late' },
		{ value: 'Half Day', label: 'Half Day' },
		{ value: 'On Leave', label: 'On Leave' }
	];

	let employeeFilterOptions = $derived([
		{ value: 'all', label: 'All Employees' },
		...data.employees.map((emp: any) => ({
			value: emp.uuid,
			label: emp.name
		}))
	]);

	let employeeFormOptions = $derived(
		data.employees.map((emp: any) => ({
			id: emp.uuid,
			label: emp.name
		}))
	);

	let statusFilterOptions = [
		{ value: 'all', label: 'All Statuses' },
		...statusOptions
	];

	let sourceFilterOptions = $derived([
		{ value: 'all', label: 'All Sources' },
		...data.sources.map((src: any) => ({
			value: src.id,
			label: src.label
		}))
	]);

	// Formatters
	function formatDate(dateString: string | Date): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			timeZone: 'UTC'
		});
	}

	function formatDisplayTime(timeStr: string | null) {
		if (!timeStr) return '--';
		const date = new Date(timeStr);
		if (isNaN(date.getTime())) return '--';
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		});
	}

	function formatDuration(minutes: number | null) {
		if (minutes === null || minutes === undefined) return '--';
		const hrs = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hrs > 0) {
			return `${hrs}h ${mins}m`;
		}
		return `${mins}m`;
	}

	function getEmployeeName(uuid: string): string {
		const emp = data.employees.find((e: any) => e.uuid === uuid);
		return emp ? emp.name : 'Unknown';
	}

	function getSourceName(cuid: string | null): string {
		if (!cuid) return '--';
		const src = data.sources.find((s: any) => s.id === cuid);
		return src ? src.label : cuid;
	}

	// Status badge mapping
	function getStatusBadgeClass(status: string): string {
		switch (status) {
			case 'Present':
				return 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20';
			case 'Absent':
				return 'bg-destructive/10 text-destructive border border-destructive/20';
			case 'Late':
				return 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20';
			case 'Half Day':
				return 'bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/20';
			case 'On Leave':
				return 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20';
			default:
				return '';
		}
	}

	// Local validation
	function getFormErrors() {
		const errs: Record<string, string> = {};
		if (!formEmployeeCuid) errs.employee_cuid = 'Employee is required';
		if (!formAttendanceDate) errs.attendance_date = 'Attendance date is required';
		if (!formAttendanceStatus) errs.attendance_status = 'Status is required';

		if (formCheckInTime && formCheckOutTime) {
			const checkIn = new Date(formCheckInTime);
			const checkOut = new Date(formCheckOutTime);
			if (checkOut < checkIn) {
				errs.check_out_time = 'Check out time cannot be before check in time';
			}
		}
		return errs;
	}

	// CRUD Ops
	function openAddModal() {
		editCuid = null;
		formEmployeeCuid = '';
		formAttendanceDate = new Date().toISOString().split('T')[0];
		formCheckInTime = '';
		formCheckOutTime = '';
		formAttendanceStatus = 'Present';
		formAttendanceSourceCuid = '';
		formRemarks = '';
		errors = {};
		submissionAttempted = false;
		isFormModalOpen = true;
	}

	function openEditModal(record: any) {
		editCuid = record.cuid;
		formEmployeeCuid = record.employee_cuid;
		formAttendanceDate = record.attendance_date;
		
		// Convert ISO to datetime-local string (YYYY-MM-DDTHH:mm)
		if (record.check_in_time) {
			const d = new Date(record.check_in_time);
			const localISO = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
			formCheckInTime = localISO;
		} else {
			formCheckInTime = '';
		}

		if (record.check_out_time) {
			const d = new Date(record.check_out_time);
			const localISO = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
			formCheckOutTime = localISO;
		} else {
			formCheckOutTime = '';
		}

		formAttendanceStatus = record.attendance_status;
		formAttendanceSourceCuid = record.attendance_source_cuid || '';
		formRemarks = record.remarks || '';
		errors = {};
		submissionAttempted = false;
		isFormModalOpen = true;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		submissionAttempted = true;

		const formErrors = getFormErrors();
		if (Object.keys(formErrors).length > 0) {
			errors = formErrors;
			return;
		}

		isSubmitting = true;

		const payload = {
			employee_cuid: formEmployeeCuid,
			attendance_date: formAttendanceDate,
			check_in_time: formCheckInTime ? new Date(formCheckInTime).toISOString() : null,
			check_out_time: formCheckOutTime ? new Date(formCheckOutTime).toISOString() : null,
			attendance_status: formAttendanceStatus,
			attendance_source_cuid: formAttendanceSourceCuid || null,
			remarks: formRemarks || null
		};

		try {
			const url = editCuid ? `/api/attendance-records/${editCuid}` : '/api/attendance-records';
			const res = await fetch(url, {
				method: editCuid ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const body = await res.json();

			if (res.ok) {
				toast.success(body.data?.message || 'Attendance record saved');
				isFormModalOpen = false;
				await invalidateAll();
			} else {
				if (body.data?.error && typeof body.data.error === 'object') {
					errors = body.data.error;
				} else {
					toast.error(body.data?.error || 'Action failed');
				}
			}
		} catch (error) {
			console.error(error);
			toast.error('An unexpected error occurred');
		} finally {
			isSubmitting = false;
		}
	}

	async function handleDelete() {
		if (!activeDeleteCuid) return;
		isSubmitting = true;

		try {
			const res = await fetch(`/api/attendance-records/${activeDeleteCuid}`, {
				method: 'DELETE'
			});

			const body = await res.json();
			if (res.ok) {
				toast.success(body.data?.message || 'Record deleted successfully');
				isConfirmOpen = false;
				activeDeleteCuid = null;
				await invalidateAll();
			} else {
				toast.error(body.data?.error || 'Failed to delete record');
			}
		} catch (error) {
			console.error(error);
			toast.error('An unexpected error occurred');
		} finally {
			isSubmitting = false;
		}
	}

	function handleSort(key: string) {
		currentPage = 1;
		if (sortKey !== key) {
			sortKey = key;
			sortDirection = 'asc';
		} else if (sortDirection === 'asc') {
			sortDirection = 'desc';
		} else {
			sortKey = null;
			sortDirection = null;
		}
	}

	// Derived filtering & sorting logic
	let filteredRecords = $derived.by(() => {
		let result = [...data.records];

		// Search
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter((rec) =>
				getEmployeeName(rec.employee_cuid).toLowerCase().includes(q)
			);
		}

		// Filters
		if (filterEmployeeCuid !== 'all') {
			result = result.filter((rec) => rec.employee_cuid === filterEmployeeCuid);
		}

		if (filterDate) {
			result = result.filter((rec) => rec.attendance_date === filterDate);
		}

		if (filterStatus !== 'all') {
			result = result.filter((rec) => rec.attendance_status === filterStatus);
		}

		if (filterSourceCuid !== 'all') {
			result = result.filter((rec) => rec.attendance_source_cuid === filterSourceCuid);
		}

		// Sorting
		if (sortKey && sortDirection) {
			result.sort((a, b) => {
				let valA = a[sortKey as keyof typeof a];
				let valB = b[sortKey as keyof typeof b];

				if (sortKey === 'employee_name') {
					valA = getEmployeeName(a.employee_cuid);
					valB = getEmployeeName(b.employee_cuid);
				}

				if (typeof valA === 'string' && typeof valB === 'string') {
					return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
				}

				if (valA === null || valA === undefined) return 1;
				if (valB === null || valB === undefined) return -1;

				if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
				if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
				return 0;
			});
		}

		return result;
	});

	let paginatedRecords = $derived(
		filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

	$effect(() => {
		// Reset page on search or filter change
		/* eslint-disable @typescript-eslint/no-unused-expressions */
		searchQuery;
		filterEmployeeCuid;
		filterDate;
		filterStatus;
		filterSourceCuid;
		/* eslint-enable @typescript-eslint/no-unused-expressions */
		currentPage = 1;
	});
</script>

<svelte:head>
	<title>Attendance Records</title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-0">
	<!-- Header -->
	<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl wrap-break-word">Attendance Records</h1>
		</div>
		<Button
			type="button"
			class="bg-[#F45310] text-white hover:bg-[#F45310]/90 border-0 font-semibold"
			onclick={openAddModal}
		>
			<PlusIcon class="size-4" />
			Add Record
		</Button>
	</div>

	<!-- Filters & Search -->
	<div class="space-y-3">
		<div class="flex flex-col gap-4 lg:flex-row lg:items-center">
			<div class="relative flex-1 min-w-0">
				<SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
				<Input
					type="search"
					placeholder="Search by employee name..."
					bind:value={searchQuery}
					class="pl-9 pr-9"
				/>
				{#if searchQuery}
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						class="absolute top-1/2 right-1 -translate-y-1/2"
						aria-label="Clear search"
						onclick={() => (searchQuery = '')}
					>
						<XIcon class="size-4" />
					</Button>
				{/if}
			</div>

			<div class="grid grid-cols-2 md:grid-cols-4 gap-3 w-full lg:w-auto shrink-0">
				<!-- Employee Filter -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" class="h-9 justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring outline-none" {...props}>
								<span class="truncate pr-1">
									{employeeFilterOptions.find(o => o.value === filterEmployeeCuid)?.label || 'Employee'}
								</span>
								<FilterIcon class="size-3.5 opacity-50 shrink-0" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-48 max-h-60 overflow-y-auto">
						<DropdownMenu.Group>
							{#each employeeFilterOptions as opt}
								<DropdownMenu.Item onclick={() => filterEmployeeCuid = opt.value} class="justify-between cursor-pointer {filterEmployeeCuid === opt.value ? 'bg-accent text-accent-foreground font-semibold' : ''}">
									<span class="truncate">{opt.label}</span>
									{#if filterEmployeeCuid === opt.value}<CheckIcon class="size-4 shrink-0" />{/if}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>

				<!-- Date Filter -->
				<div class="w-full">
					<DatePicker
						placeholder="Filter Date"
						bind:value={filterDate}
					/>
				</div>

				<!-- Status Filter -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" class="h-9 justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring outline-none" {...props}>
								<span class="truncate pr-1">
									{statusFilterOptions.find(o => o.value === filterStatus)?.label || 'Status'}
								</span>
								<FilterIcon class="size-3.5 opacity-50 shrink-0" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-44">
						<DropdownMenu.Group>
							{#each statusFilterOptions as opt}
								<DropdownMenu.Item onclick={() => filterStatus = opt.value} class="justify-between cursor-pointer {filterStatus === opt.value ? 'bg-accent text-accent-foreground font-semibold' : ''}">
									<span>{opt.label}</span>
									{#if filterStatus === opt.value}<CheckIcon class="size-4 shrink-0" />{/if}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>

				<!-- Source Filter -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" class="h-9 justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring outline-none" {...props}>
								<span class="truncate pr-1">
									{sourceFilterOptions.find(o => o.value === filterSourceCuid)?.label || 'Source'}
								</span>
								<FilterIcon class="size-3.5 opacity-50 shrink-0" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-48 max-h-60 overflow-y-auto">
						<DropdownMenu.Group>
							{#each sourceFilterOptions as opt}
								<DropdownMenu.Item onclick={() => filterSourceCuid = opt.value} class="justify-between cursor-pointer {filterSourceCuid === opt.value ? 'bg-accent text-accent-foreground font-semibold' : ''}">
									<span class="truncate">{opt.label}</span>
									{#if filterSourceCuid === opt.value}<CheckIcon class="size-4 shrink-0" />{/if}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</div>

		<!-- Table Card -->
		<Card>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="font-bold">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold" onclick={() => handleSort('employee_name')}>
								Employee
								{#if sortKey === 'employee_name' && sortDirection === 'asc'}
									<ArrowUpIcon class="ml-1 size-3.5" />
								{:else if sortKey === 'employee_name' && sortDirection === 'desc'}
									<ArrowDownIcon class="ml-1 size-3.5" />
								{:else}
									<ArrowUpDownIcon class="ml-1 size-3.5" />
								{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold" onclick={() => handleSort('attendance_date')}>
								Date
								{#if sortKey === 'attendance_date' && sortDirection === 'asc'}
									<ArrowUpIcon class="ml-1 size-3.5" />
								{:else if sortKey === 'attendance_date' && sortDirection === 'desc'}
									<ArrowDownIcon class="ml-1 size-3.5" />
								{:else}
									<ArrowUpDownIcon class="ml-1 size-3.5" />
								{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold">Check In</TableHead>
						<TableHead class="font-bold">Check Out</TableHead>
						<TableHead class="font-bold">Work Duration</TableHead>
						<TableHead class="font-bold">Status</TableHead>
						<TableHead class="font-bold">Source</TableHead>
						<TableHead class="font-bold">Updated At</TableHead>
						<TableHead class="text-right font-bold">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if filteredRecords.length === 0}
						<TableRow>
							<TableCell colspan={9} class="py-12 text-center text-muted-foreground font-medium">
								No attendance records found
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedRecords as rec (rec.cuid)}
							<TableRow class="hover:bg-muted/50 cursor-pointer" onclick={(e) => {
								const target = e.target as HTMLElement;
								if (target.closest('button') || target.closest('a')) return;
								openEditModal(rec);
							}}>
								<TableCell class="font-semibold">{getEmployeeName(rec.employee_cuid)}</TableCell>
								<TableCell>{formatDate(rec.attendance_date)}</TableCell>
								<TableCell>{formatDisplayTime(rec.check_in_time)}</TableCell>
								<TableCell>{formatDisplayTime(rec.check_out_time)}</TableCell>
								<TableCell>{formatDuration(rec.work_duration_minutes)}</TableCell>
								<TableCell>
									<Badge class={`border-none px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(rec.attendance_status)}`}>
										{rec.attendance_status}
									</Badge>
								</TableCell>
								<TableCell>{getSourceName(rec.attendance_source_cuid)}</TableCell>
								<TableCell>{formatDate(rec.updated_at)}</TableCell>
								<TableCell class="text-right">
									<TableActions
										onEdit={() => openEditModal(rec)}
										customActions={[
											{
												label: 'Delete',
												icon: Trash2Icon,
												class: 'focus:bg-[#800020]/10 text-destructive',
												onClick: () => {
													activeDeleteCuid = rec.cuid;
													isConfirmOpen = true;
												}
											}
										]}
									/>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</Card>

		<Pagination totalItems={filteredRecords.length} bind:currentPage={currentPage} pageSize={pageSize} />
	</div>
</div>

<!-- Add/Edit Modal -->
<CrudModal
	open={isFormModalOpen}
	title={editCuid ? 'Edit Attendance Record' : 'Create Attendance Record'}
	isDirty={true}
	onClose={() => isFormModalOpen = false}
>
	{#snippet children({ cancel })}
		<form method="POST" action="" onsubmit={handleSubmit} class="space-y-4" novalidate>
			<!-- Employee Selector -->
			<div class="space-y-2">
				<SearchableDropdown
					label="Employee *"
					options={employeeFormOptions}
					value={formEmployeeCuid}
					placeholder="Select employee..."
					onSelect={(val) => {
						formEmployeeCuid = val;
						errors.employee_cuid = '';
					}}
				/>
				{#if errors.employee_cuid}
					<p class="text-xs font-semibold text-destructive mt-0.5">{errors.employee_cuid}</p>
				{/if}
			</div>

			<!-- Date Selector -->
			<div class="space-y-2">
				<Label for="modal_date" class={errors.attendance_date ? 'text-destructive font-semibold' : ''}>Attendance Date *</Label>
				<DatePicker
					id="modal_date"
					name="attendance_date"
					bind:value={formAttendanceDate}
					onchange={() => {
						errors.attendance_date = '';
					}}
				/>
				{#if errors.attendance_date}
					<p class="text-xs font-semibold text-destructive mt-0.5">{errors.attendance_date}</p>
				{/if}
			</div>

			<!-- Timestamps Row -->
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="modal_check_in" class={errors.check_in_time ? 'text-destructive font-semibold' : ''}>Check In Time</Label>
					<Input
						id="modal_check_in"
						name="check_in_time"
						type="datetime-local"
						bind:value={formCheckInTime}
						oninput={() => errors.check_in_time = ''}
						class={errors.check_in_time ? 'border-destructive' : ''}
					/>
					{#if errors.check_in_time}
						<p class="text-xs font-semibold text-destructive mt-0.5">{errors.check_in_time}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="modal_check_out" class={errors.check_out_time ? 'text-destructive font-semibold' : ''}>Check Out Time</Label>
					<Input
						id="modal_check_out"
						name="check_out_time"
						type="datetime-local"
						bind:value={formCheckOutTime}
						oninput={() => errors.check_out_time = ''}
						class={errors.check_out_time ? 'border-destructive' : ''}
					/>
					{#if errors.check_out_time}
						<p class="text-xs font-semibold text-destructive mt-0.5">{errors.check_out_time}</p>
					{/if}
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<!-- Status Selector -->
				<div class="space-y-2">
					<Label for="modal_status">Status *</Label>
					<select
						id="modal_status"
						bind:value={formAttendanceStatus}
						class="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
					>
						{#each statusOptions as opt}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
				</div>

				<!-- Source Selector -->
				<div class="space-y-2">
					<MasterDataDropdown
						master="attendance-sources"
						label="Attendance Source"
						value={formAttendanceSourceCuid}
						onSelect={(val) => {
							formAttendanceSourceCuid = val;
						}}
						placeholder="Select source..."
					/>
				</div>
			</div>

			<!-- Remarks -->
			<div class="space-y-2">
				<Label for="modal_remarks">Remarks</Label>
				<textarea
					id="modal_remarks"
					name="remarks"
					bind:value={formRemarks}
					rows="3"
					placeholder="Add administrative remarks..."
					class="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 outline-none min-h-20"
				></textarea>
			</div>

			<!-- Form Actions -->
			<div class="flex items-center justify-end gap-3 pt-4 border-t border-border">
				<Button
					type="button"
					variant="outline"
					onclick={cancel}
					disabled={isSubmitting}
				>
					{UI_CONSTANTS.BUTTON_CANCEL}
				</Button>
				<Button
					type="submit"
					class="bg-[#F45310] text-white hover:bg-[#F45310]/90 border-none font-semibold"
					disabled={isSubmitting}
				>
					{isSubmitting ? UI_CONSTANTS.BUTTON_SAVING : (editCuid ? UI_CONSTANTS.BUTTON_UPDATE : UI_CONSTANTS.BUTTON_SAVE)}
				</Button>
			</div>
		</form>
	{/snippet}
</CrudModal>

<!-- Delete Confirmation Modal -->
<ConfirmModal
	open={isConfirmOpen}
	title="Delete Attendance Record"
	description="Are you sure you want to delete this attendance record? This action cannot be undone."
	confirmLabel="Delete"
	isSubmitting={isSubmitting}
	onCancel={() => {
		isConfirmOpen = false;
		activeDeleteCuid = null;
	}}
	onConfirm={handleDelete}
/>
