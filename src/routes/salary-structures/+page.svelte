<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import CheckIcon from '@lucide/svelte/icons/check';

	import { toast } from '$lib/toast';
	import { createDirtyChecker } from '$lib/utils';
	import { UI_CONSTANTS } from '$lib/constants';
	import { validateEffectiveFrom, validateEffectiveDateRange, validateAmount } from '$lib/validators/salary-structure';

	import {
		Badge,
		Button,
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		Input,
		Label,
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
		CrudModal,
		FilterDropdown,
		Pagination,
		SearchInput,
		DatePicker,
		TableActions
	} from '$lib/components';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	import type { SalaryStructure } from '$lib/types/salary-structure';
	import type { SalaryComponentDto } from '$lib/server/serializers/salary-component.serializer';

	// ─── Data state ──────────────────────────────────────────────────────────────

	interface MockEmployee {
		cuid: string;
		employee_id: string;
		name: string;
	}

	let structuresList = $state<SalaryStructure[]>([]);
	let employeesList = $state<MockEmployee[]>([]);
	let componentsList = $state<SalaryComponentDto[]>([]);
	let isLoading = $state(true);
	let loadError = $state('');

	// ─── Filter / sort / page state ──────────────────────────────────────────────

	let searchQuery = $state('');
	let statusFilter = $state<'all' | boolean>('all');
	let sortColumn = $state('effective_from');
	let sortDirection = $state<'asc' | 'desc' | null>(null);

	let currentPage = $state(1);
	let pageSize = $state(10);

	// ─── Create Modal state ───────────────────────────────────────────────────────

	let isCreateOpen = $state(false);
	let isSubmitting = $state(false);
	let backendError = $state('');

	// ─── Form state ───────────────────────────────────────────────────────────────

	interface FormItem {
		id: number;
		salary_component_cuid: string;
		amount: string;
	}

	let formEmployeeCuid = $state('');
	let formEffectiveFrom = $state<string | null>('');
	let formEffectiveTo = $state<string | null>('');
	let formItems = $state<FormItem[]>([]);
	let nextItemId = $state(0);
	let fieldErrors = $state<Record<string, string>>({});

	// ─── Dirty checking ──────────────────────────────────────────────────────────

	interface DirtySnapshot {
		employee_cuid: string;
		effective_from: string | null;
		effective_to: string | null;
		components: string;
	}

	const dirtyChecker = createDirtyChecker<DirtySnapshot>();

	let isDirty = $derived(
		isCreateOpen &&
			dirtyChecker.isDirty({
				employee_cuid: formEmployeeCuid,
				effective_from: formEffectiveFrom,
				effective_to: formEffectiveTo,
				components: JSON.stringify(
					formItems.map((i) => ({
						salary_component_cuid: i.salary_component_cuid,
						amount: i.amount
					}))
				)
			})
	);

	// ─── Derived computed values ──────────────────────────────────────────────────

	function getEmployeeName(cuid: string): string {
		return employeesList.find((e) => e.cuid === cuid)?.name ?? cuid;
	}

	function getEmployeeId(cuid: string): string {
		return employeesList.find((e) => e.cuid === cuid)?.employee_id ?? '';
	}

	function isStructureActive(s: { status: boolean; effective_from: string; effective_to: string | null }) {
		const d = new Date();
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		const todayStr = `${year}-${month}-${day}`;

		if (todayStr < s.effective_from) return false;
		if (s.effective_to !== null && todayStr > s.effective_to) return false;
		if (!s.status && s.effective_to === null) return false;
		return true;
	}

	/**
	 * Employees that currently have NO Active salary structure — eligible for Add Structure.
	 */
	let eligibleEmployees = $derived(
		employeesList.filter(
			(emp) => !structuresList.some((s) => s.employee_cuid === emp.cuid && s.status === true)
		)
	);

	let filteredStructures = $derived.by(() => {
		let result = [...structuresList];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter((s) => {
				const empName = getEmployeeName(s.employee_cuid).toLowerCase();
				const empId = getEmployeeId(s.employee_cuid).toLowerCase();
				return empName.includes(query) || empId.includes(query);
			});
		}

		if (statusFilter !== 'all') {
			result = result.filter((s) => isStructureActive(s) === statusFilter);
		}

		if (sortDirection && sortColumn) {
			result.sort((a, b) => {
				let valA: string;
				let valB: string;

				if (sortColumn === 'employee') {
					valA = getEmployeeName(a.employee_cuid);
					valB = getEmployeeName(b.employee_cuid);
				} else if (sortColumn === 'effective_from') {
					valA = a.effective_from;
					valB = b.effective_from;
				} else if (sortColumn === 'status') {
					valA = String(isStructureActive(a));
					valB = String(isStructureActive(b));
				} else {
					valA = String(a[sortColumn as keyof typeof a] ?? '');
					valB = String(b[sortColumn as keyof typeof b] ?? '');
				}

				return sortDirection === 'asc'
					? valA.localeCompare(valB)
					: valB.localeCompare(valA);
			});
		}

		return result;
	});

	let totalCount = $derived(structuresList.length);
	let activeCount = $derived(structuresList.filter(isStructureActive).length);
	let inactiveCount = $derived(structuresList.filter((s) => !isStructureActive(s)).length);
	let paginatedStructures = $derived(
		filteredStructures.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

	// ─── Fetch helpers ────────────────────────────────────────────────────────────

	async function loadAll() {
		isLoading = true;
		loadError = '';
		try {
			const [structRes, empRes, compRes] = await Promise.all([
				fetch('/api/salary-structures'),
				fetch('/api/salary-structures/employees'),
				fetch('/api/salary-structures/components')
			]);

			const [structData, empData, compData] = await Promise.all([
				structRes.json(),
				empRes.json(),
				compRes.json()
			]);

			if (structRes.ok) {
				structuresList = structData.data ?? [];
			} else {
				loadError = structData.message || 'Failed to load salary structures.';
				toast.error(loadError);
			}

			if (empRes.ok) employeesList = empData.data ?? [];
			if (compRes.ok) componentsList = compData.data ?? [];
		} catch (err) {
			loadError = 'An error occurred while loading data.';
			toast.error(loadError);
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	async function loadStructures() {
		try {
			const res = await fetch('/api/salary-structures');
			const data = await res.json();
			if (res.ok) {
				structuresList = data.data ?? [];
			} else {
				toast.error(data.message || 'Failed to reload salary structures.');
			}
		} catch (err) {
			toast.error('An error occurred while reloading.');
			console.error(err);
		}
	}

	onMount(() => {
		loadAll();
	});

	// ─── Sorting ──────────────────────────────────────────────────────────────────

	function handleSort(column: string) {
		if (sortColumn === column) {
			if (sortDirection === 'asc') sortDirection = 'desc';
			else if (sortDirection === 'desc') sortDirection = null;
			else sortDirection = 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	}

	// ─── Modal helpers ────────────────────────────────────────────────────────────

	function buildSnapshotItems() {
		return JSON.stringify(
			formItems.map((i) => ({
				salary_component_cuid: i.salary_component_cuid,
				amount: i.amount
			}))
		);
	}

	function resetForm() {
		formEmployeeCuid = '';
		formEffectiveFrom = '';
		formEffectiveTo = '';
		formItems = [];
		nextItemId = 0;
		backendError = '';
		fieldErrors = {};
	}

	function openCreateModal() {
		resetForm();
		addItemRow();
		dirtyChecker.snapshot({
			employee_cuid: '',
			effective_from: '',
			effective_to: '',
			components: buildSnapshotItems()
		});
		isCreateOpen = true;
	}

	function closeModal() {
		isCreateOpen = false;
	}

	// ─── Item row management ──────────────────────────────────────────────────────

	function addItemRow() {
		formItems = [...formItems, { id: nextItemId++, salary_component_cuid: '', amount: '' }];
	}

	function removeItemRow(id: number) {
		formItems = formItems.filter((item) => item.id !== id);
	}

	function getUsedComponentCuids(excludeId: number): Set<string> {
		return new Set(
			formItems
				.filter((item) => item.id !== excludeId && item.salary_component_cuid)
				.map((item) => item.salary_component_cuid)
		);
	}

	/** Only show Active components for new assignments. */
	let activeComponents = $derived(componentsList.filter((c) => c.status));

	// ─── Client-side form validation ──────────────────────────────────────────────

	function validateForm(): boolean {
		const errors: Record<string, string> = {};

		if (!formEmployeeCuid) {
			errors['employee_cuid'] = 'Employee is required';
		}

		const efError = validateEffectiveFrom(formEffectiveFrom);
		if (efError) errors['effective_from'] = efError;

		if (!efError && formEffectiveTo) {
			const rangeError = validateEffectiveDateRange(formEffectiveFrom, formEffectiveTo);
			if (rangeError) errors['effective_to'] = rangeError;
		}

		if (formItems.length === 0) {
			errors['components'] = 'At least one component is required';
		}

		const seenCuids = new SvelteSet<string>();
		formItems.forEach((item, i) => {
			if (!item.salary_component_cuid) {
				errors[`items[${i}].salary_component_cuid`] = 'Component is required';
			} else if (seenCuids.has(item.salary_component_cuid)) {
				errors[`items[${i}].salary_component_cuid`] = 'Duplicate component';
			} else {
				seenCuids.add(item.salary_component_cuid);
			}

			const amountNum = parseFloat(item.amount);
			const amtError = validateAmount(isNaN(amountNum) ? undefined : amountNum);
			if (item.amount === '') {
				errors[`items[${i}].amount`] = 'Amount is required';
			} else if (amtError) {
				errors[`items[${i}].amount`] = amtError;
			}
		});

		fieldErrors = errors;
		return Object.keys(errors).length === 0;
	}

	// ─── Submit handler ───────────────────────────────────────────────────────────

	async function handleSave(e: Event) {
		e.preventDefault();
		if (!validateForm()) return;

		isSubmitting = true;
		backendError = '';

		const payload = {
			employee_cuid: formEmployeeCuid,
			effective_from: formEffectiveFrom,
			effective_to: formEffectiveTo || null,
			components: formItems.map((item) => ({
				salary_component_cuid: item.salary_component_cuid,
				amount: parseFloat(item.amount)
			}))
		};

		try {
			const response = await fetch('/api/salary-structures', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const resData = await response.json();

			if (response.ok && resData.data) {
				await loadStructures();
				toast.success('Salary Structure created successfully');
				closeModal();
			} else {
				if (response.status === 400 || response.status === 409) {
					backendError = resData.message || resData.error || 'Validation failed';
				} else {
					toast.error(resData.message || resData.error || 'Failed to save salary structure.');
				}
			}
		} catch (err) {
			toast.error('An error occurred. Please try again.');
			console.error(err);
		} finally {
			isSubmitting = false;
		}
	}

	// ─── Edit Effective Dates Modal state ─────────────────────────────────────────

	let isEditDatesOpen = $state(false);
	let isSubmittingDates = $state(false);
	let editEffectiveFrom = $state<string | null>('');
	let editEffectiveTo = $state<string | null>('');
	let datesErrors = $state<Record<string, string>>({});
	let datesBackendError = $state('');
	let editingStructureForDates = $state<SalaryStructure | null>(null);

	let editingDatesEmployeeName = $derived(
		editingStructureForDates ? getEmployeeName(editingStructureForDates.employee_cuid) : ''
	);

	let isEditDatesDirty = $derived.by(() => {
		if (!editingStructureForDates) return false;
		return (
			editEffectiveFrom !== editingStructureForDates.effective_from ||
			editEffectiveTo !== editingStructureForDates.effective_to
		);
	});

	function openEditDatesModal(s: SalaryStructure) {
		editingStructureForDates = s;
		editEffectiveFrom = s.effective_from;
		editEffectiveTo = s.effective_to;
		datesErrors = {};
		datesBackendError = '';
		isEditDatesOpen = true;
	}

	function closeEditDates() {
		isEditDatesOpen = false;
		editingStructureForDates = null;
		editEffectiveFrom = '';
		editEffectiveTo = '';
		datesErrors = {};
		datesBackendError = '';
	}

	async function handleSaveDates(e: Event) {
		e.preventDefault();
		if (!editingStructureForDates) return;

		datesErrors = {};
		datesBackendError = '';

		// Validation
		const efError = validateEffectiveFrom(editEffectiveFrom);
		if (efError) {
			datesErrors['effective_from'] = efError;
		}

		const rangeError = validateEffectiveDateRange(editEffectiveFrom, editEffectiveTo);
		if (rangeError) {
			datesErrors['effective_to'] = rangeError;
		}

		if (Object.keys(datesErrors).length > 0) {
			return;
		}

		isSubmittingDates = true;

		try {
			const payload = {
				effective_from: editEffectiveFrom,
				effective_to: editEffectiveTo || null
			};

			const response = await fetch(`/api/salary-structures/${editingStructureForDates.cuid}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const resData = await response.json();

			if (response.ok) {
				toast.success('Effective dates updated successfully');
				closeEditDates();
				await loadAll();
			} else {
				datesBackendError = resData.message || 'Failed to update effective dates';
			}
		} catch {
			datesBackendError = 'An unexpected error occurred';
		} finally {
			isSubmittingDates = false;
		}
	}

	// ─── Sort icon helper ─────────────────────────────────────────────────────────

	function sortIcon(col: string) {
		if (sortColumn !== col) return 'none';
		return sortDirection === 'asc' ? 'asc' : sortDirection === 'desc' ? 'desc' : 'none';
	}

	function formatDateString(dateStr: string | null | undefined): string {
		if (!dateStr) return '';
		const parts = dateStr.split('-');
		if (parts.length === 3) {
			return `${parts[2]}/${parts[1]}/${parts[0]}`;
		}
		return dateStr;
	}
</script>

<svelte:head>
	<title>HRMS Salary Structures</title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-0">
	<!-- Page header -->
	<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl wrap-break-word">Salary Structures</h1>
		</div>
		<Button
			type="button"
			class="bg-[#F45310] text-white hover:bg-[#F45310]/90 border-0"
			onclick={openCreateModal}
		>
			<PlusIcon class="size-4" />
			Add Structure
		</Button>
	</div>

	<!-- Stats cards -->
	<div class="grid gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Total Structures</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#262626] tabular-nums">{totalCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Active</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#F45310] tabular-nums">{activeCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Inactive</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#800020] tabular-nums">{inactiveCount}</CardTitle>
			</CardHeader>
		</Card>
	</div>

	<!-- Filters + table -->
	<div class="space-y-3">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<SearchInput
				id="search_structures"
				name="search_structures"
				bind:value={searchQuery}
				oninput={() => (currentPage = 1)}
				placeholder="Search by employee name..."
			/>
			<FilterDropdown
				value={statusFilter}
				onChange={(value) => { statusFilter = value; currentPage = 1; }}
			/>
		</div>

		<Card class="py-0">
			<Table>
				<TableHeader class="bg-muted">
					<TableRow>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('employee')}>
								Employee
								{#if sortIcon('employee') === 'asc'}<ArrowUpIcon class="ml-2 size-4" />
								{:else if sortIcon('employee') === 'desc'}<ArrowDownIcon class="ml-2 size-4" />
								{:else}<ArrowUpDownIcon class="ml-2 size-4" />{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('effective_from')}>
								Effective From
								{#if sortIcon('effective_from') === 'asc'}<ArrowUpIcon class="ml-2 size-4" />
								{:else if sortIcon('effective_from') === 'desc'}<ArrowDownIcon class="ml-2 size-4" />
								{:else}<ArrowUpDownIcon class="ml-2 size-4" />{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">Effective To</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">Components</TableHead>
						<TableHead class="text-center font-bold text-foreground text-[15px] whitespace-nowrap">
							<Button variant="ghost" size="sm" class="h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('status')}>
								Status
								{#if sortIcon('status') === 'asc'}<ArrowUpIcon class="ml-2 size-4" />
								{:else if sortIcon('status') === 'desc'}<ArrowDownIcon class="ml-2 size-4" />
								{:else}<ArrowUpDownIcon class="ml-2 size-4" />{/if}
							</Button>
						</TableHead>
						<TableHead class="text-right font-bold text-foreground text-[15px] whitespace-nowrap">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if isLoading}
						<TableRow>
							<TableCell colspan={6} class="py-8 text-center text-muted-foreground">
								<LoaderCircleIcon class="mx-auto mb-2 size-6 animate-spin" />
								Loading structures...
							</TableCell>
						</TableRow>
					{:else if filteredStructures.length === 0}
						<TableRow>
							<TableCell colspan={6} class="py-8 text-center text-muted-foreground">
								{UI_CONSTANTS.EMPTY_STATE_MESSAGE}
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedStructures as s (s.cuid)}
							<TableRow
								onclick={(e) => {
									if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
									goto(resolve(`/salary-structures/${s.cuid}`));
								}}
								class="cursor-pointer"
							>
								<TableCell>
									<span class="font-semibold">{getEmployeeName(s.employee_cuid)}</span>
									{#if getEmployeeId(s.employee_cuid)}
										<span class="block text-xs text-muted-foreground">{getEmployeeId(s.employee_cuid)}</span>
									{/if}
								</TableCell>
								<TableCell>{formatDateString(s.effective_from)}</TableCell>
								<TableCell>{s.effective_to ? formatDateString(s.effective_to) : '-'}</TableCell>
								<TableCell>
									<span class="text-sm text-muted-foreground">{s.components.length} component{s.components.length === 1 ? '' : 's'}</span>
								</TableCell>
								<TableCell class="text-center">
									<Badge variant={isStructureActive(s) ? 'default' : 'secondary'}>
										{isStructureActive(s) ? 'Active' : 'Inactive'}
									</Badge>
								</TableCell>
								<TableCell class="text-right">
									<div
										class="flex items-center justify-end gap-1"
										onclick={(e) => e.stopPropagation()}
										onkeydown={(e) => e.stopPropagation()}
										role="presentation"
									>
										<TableActions
											canEdit={true}
											onEdit={() => openEditDatesModal(s)}
										/>
									</div>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</Card>
		<Pagination bind:currentPage pageSize={pageSize} totalItems={filteredStructures.length} />
	</div>
</div>

<!-- ─── Create / Add Structure Modal ─────────────────────────────────────────── -->

<CrudModal
	open={isCreateOpen}
	title="Add Salary Structure"
	isDirty={isDirty}
	isSubmitting={isSubmitting}
	onClose={closeModal}
>
	{#snippet children({ cancel })}
		<form class="space-y-4" onsubmit={handleSave}>

			<!-- Employee dropdown — only employees without an Active structure -->
			<div class="space-y-2">
				<Label for="employee_cuid">Employee</Label>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button
								id="employee_cuid"
								name="employee_cuid"
								variant="outline"
								class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-3 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 transition-[color,box-shadow] outline-none {fieldErrors['employee_cuid'] ? 'border-destructive' : ''}"
								{...props}
							>
								{formEmployeeCuid
									? (employeesList.find((e) => e.cuid === formEmployeeCuid)?.name ?? formEmployeeCuid)
									: 'Select employee...'}
								<ChevronDownIcon class="ml-2 size-4 opacity-50" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-[300px]">
						<DropdownMenu.Group>
							{#if eligibleEmployees.length === 0}
								<DropdownMenu.Item disabled class="text-muted-foreground text-sm">
									All employees already have an Active structure
								</DropdownMenu.Item>
							{:else}
								{#each eligibleEmployees as emp (emp.cuid)}
									<DropdownMenu.Item
										onclick={() => {
											formEmployeeCuid = emp.cuid;
											delete fieldErrors['employee_cuid'];
											fieldErrors = { ...fieldErrors };
										}}
										class="justify-between cursor-pointer {formEmployeeCuid === emp.cuid ? 'bg-accent text-accent-foreground' : ''}"
									>
										<span>{emp.name} <span class="text-xs text-muted-foreground">({emp.employee_id})</span></span>
										{#if formEmployeeCuid === emp.cuid}<CheckIcon class="size-4" />{/if}
									</DropdownMenu.Item>
								{/each}
							{/if}
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
				{#if fieldErrors['employee_cuid']}
					<p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{fieldErrors['employee_cuid']}</p>
				{/if}
			</div>

			<!-- Effective dates -->
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="effective_from">Effective From</Label>
					<DatePicker
						id="effective_from"
						name="effective_from"
						bind:value={formEffectiveFrom}
						class={fieldErrors['effective_from'] ? 'border-destructive' : ''}
						onChange={() => { delete fieldErrors['effective_from']; fieldErrors = { ...fieldErrors }; }}
					/>
					{#if fieldErrors['effective_from']}
						<p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{fieldErrors['effective_from']}</p>
					{/if}
				</div>
				<div class="space-y-2">
					<Label for="effective_to">Effective To <span class="text-muted-foreground text-xs">(optional)</span></Label>
					<DatePicker
						id="effective_to"
						name="effective_to"
						bind:value={formEffectiveTo}
						class={fieldErrors['effective_to'] ? 'border-destructive' : ''}
						onChange={() => { delete fieldErrors['effective_to']; fieldErrors = { ...fieldErrors }; }}
					/>
					{#if fieldErrors['effective_to']}
						<p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{fieldErrors['effective_to']}</p>
					{/if}
				</div>
			</div>

			<!-- Component items -->
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<Label>Salary Components</Label>
					<Button
						type="button"
						variant="outline"
						size="sm"
						class="h-7 gap-1 text-xs"
						onclick={addItemRow}
					>
						<PlusIcon class="size-3" /> Add Component
					</Button>
				</div>

				{#if fieldErrors['components']}
					<p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{fieldErrors['components']}</p>
				{/if}

				<div class="space-y-2 rounded-lg border bg-muted/20 p-3">
					{#if formItems.length === 0}
						<p class="text-sm text-muted-foreground text-center py-2">No components added yet.</p>
					{/if}

					{#each formItems as item (item.id)}
						{@const usedCuids = getUsedComponentCuids(item.id)}
						{@const itemIndex = formItems.findIndex((i) => i.id === item.id)}
						<div class="flex items-start gap-2">
							<!-- Component selector -->
							<div class="flex-1 space-y-1">
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										{#snippet child({ props })}
											<Button
												variant="outline"
												class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-3 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 transition-[color,box-shadow] outline-none {fieldErrors[`items[${itemIndex}].salary_component_cuid`] ? 'border-destructive' : ''}"
												{...props}
											>
												{item.salary_component_cuid
													? (activeComponents.find((c) => c.cuid === item.salary_component_cuid)?.component_name ?? item.salary_component_cuid)
													: 'Select component...'}
												<ChevronDownIcon class="ml-2 size-4 opacity-50" />
											</Button>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Content class="w-[220px] max-h-60 overflow-y-auto">
										<DropdownMenu.Group>
											{#each activeComponents as comp (comp.cuid)}
												<DropdownMenu.Item
													onclick={() => {
														item.salary_component_cuid = comp.cuid;
														delete fieldErrors[`items[${itemIndex}].salary_component_cuid`];
														fieldErrors = { ...fieldErrors };
													}}
													disabled={usedCuids.has(comp.cuid)}
													class="justify-between cursor-pointer {item.salary_component_cuid === comp.cuid ? 'bg-accent text-accent-foreground' : ''} {usedCuids.has(comp.cuid) ? 'opacity-40 cursor-not-allowed' : ''}"
												>
													<span class="truncate">{comp.component_name}</span>
													{#if item.salary_component_cuid === comp.cuid}<CheckIcon class="size-4 shrink-0" />{/if}
												</DropdownMenu.Item>
											{/each}
										</DropdownMenu.Group>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
								{#if fieldErrors[`items[${itemIndex}].salary_component_cuid`]}
									<p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{fieldErrors[`items[${itemIndex}].salary_component_cuid`]}</p>
								{/if}
							</div>

							<!-- Amount input -->
							<div class="w-32 space-y-1">
								<Input
									type="number"
									min="0"
									step="0.01"
									placeholder="Amount"
									bind:value={item.amount}
									class="h-9 {fieldErrors[`items[${itemIndex}].amount`] ? 'border-destructive focus-visible:ring-destructive/30' : ''}"
									oninput={() => {
										delete fieldErrors[`items[${itemIndex}].amount`];
										fieldErrors = { ...fieldErrors };
									}}
								/>
								{#if fieldErrors[`items[${itemIndex}].amount`]}
									<p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{fieldErrors[`items[${itemIndex}].amount`]}</p>
								{/if}
							</div>

							<!-- Remove button -->
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								class="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
								onclick={() => removeItemRow(item.id)}
								aria-label="Remove component"
								disabled={formItems.length <= 1}
							>
								<TrashIcon class="size-4" />
							</Button>
						</div>
					{/each}
				</div>
			</div>

			{#if backendError}
				<p class="text-xs rounded bg-destructive/10 px-3 py-2" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{backendError}</p>
			{/if}

			<div class="flex items-center justify-end gap-3 pt-4">
				<Button type="button" variant="outline" onclick={cancel} disabled={isSubmitting}>{UI_CONSTANTS.BUTTON_CANCEL}</Button>
				<Button
					type="submit"
					class="bg-[#F45310] text-white hover:bg-[#F45310]/90"
					disabled={isSubmitting}
				>
					{isSubmitting ? UI_CONSTANTS.BUTTON_SAVING : UI_CONSTANTS.BUTTON_SAVE}
				</Button>
			</div>
		</form>
	{/snippet}
</CrudModal>

<CrudModal
	open={isEditDatesOpen}
	title="Edit Effective Dates"
	isDirty={isEditDatesDirty}
	isSubmitting={isSubmittingDates}
	onClose={closeEditDates}
>
	<form class="space-y-4" onsubmit={handleSaveDates}>
		<div class="space-y-1">
			<p class="text-xs uppercase tracking-wide text-muted-foreground font-medium">Employee</p>
			<p class="font-semibold text-foreground">{editingDatesEmployeeName}</p>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div class="space-y-2">
				<Label for="edit_effective_from">Effective From</Label>
				<DatePicker
					id="edit_effective_from"
					name="effective_from"
					bind:value={editEffectiveFrom}
					class={datesErrors['effective_from'] ? 'border-destructive' : ''}
					onChange={() => { delete datesErrors['effective_from']; datesErrors = { ...datesErrors }; }}
				/>
				{#if datesErrors['effective_from']}
					<p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{datesErrors['effective_from']}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="edit_effective_to">Effective To <span class="text-muted-foreground text-xs">(optional)</span></Label>
				<DatePicker
					id="edit_effective_to"
					name="effective_to"
					bind:value={editEffectiveTo}
					class={datesErrors['effective_to'] ? 'border-destructive' : ''}
					onChange={() => { delete datesErrors['effective_to']; datesErrors = { ...datesErrors }; }}
				/>
				{#if datesErrors['effective_to']}
					<p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{datesErrors['effective_to']}</p>
				{/if}
			</div>
		</div>

		{#if datesBackendError}
			<p class="text-xs rounded bg-destructive/10 px-3 py-2" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{datesBackendError}</p>
		{/if}

		<div class="flex items-center justify-end gap-3 pt-4">
			<Button type="button" variant="outline" onclick={closeEditDates} disabled={isSubmittingDates}>{UI_CONSTANTS.BUTTON_CANCEL}</Button>
			<Button
				type="submit"
				class="bg-[#F45310] text-white hover:bg-[#F45310]/90"
				disabled={isSubmittingDates}
			>
				{isSubmittingDates ? UI_CONSTANTS.BUTTON_SAVING : UI_CONSTANTS.BUTTON_SAVE}
			</Button>
		</div>
	</form>
</CrudModal>
