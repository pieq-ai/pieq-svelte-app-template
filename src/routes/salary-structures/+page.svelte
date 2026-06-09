<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import EyeIcon from '@lucide/svelte/icons/eye';
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
		CardContent,
		Input,
		Label,
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
		CrudModal,
		TableActions,
		FilterDropdown,
		StatusDropdown,
		Pagination,
		SearchInput
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
	let sortDirection = $state<'asc' | 'desc' | null>('desc');

	let currentPage = $state(1);
	let pageSize = $state(10);

	// ─── Modal state ─────────────────────────────────────────────────────────────

	type ModalMode = 'create' | 'edit' | 'view' | null;
	let modalMode = $state<ModalMode>(null);
	let editingStructure = $state<SalaryStructure | null>(null);
	let isSubmitting = $state(false);
	let backendError = $state('');

	// ─── Form state ───────────────────────────────────────────────────────────────

	interface FormItem {
		id: number; // ephemeral local ID for keyed #each
		salary_component_cuid: string;
		amount: string; // kept as string for input binding; parsed on submit
	}

	let formEmployeeCuid = $state('');
	let formEffectiveFrom = $state('');
	let formEffectiveTo = $state('');
	let formIsActive = $state(true);
	let formItems = $state<FormItem[]>([]);
	let nextItemId = $state(0);

	// Field-level validation errors
	let fieldErrors = $state<Record<string, string>>({});

	// ─── Dirty checking ──────────────────────────────────────────────────────────

	interface DirtySnapshot {
		employee_cuid: string;
		effective_from: string;
		effective_to: string;
		is_active: boolean;
		components: string; // JSON snapshot of components
	}

	const dirtyChecker = createDirtyChecker<DirtySnapshot>();

	let isDirty = $derived(
		modalMode === 'edit' &&
			dirtyChecker.isDirty({
				employee_cuid: formEmployeeCuid,
				effective_from: formEffectiveFrom,
				effective_to: formEffectiveTo,
				is_active: formIsActive,
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

	function getComponentName(cuid: string): string {
		return componentsList.find((c) => c.cuid === cuid)?.component_name ?? cuid;
	}

	let filteredStructures = $derived.by(() => {
		let result = [...structuresList];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter((s) => {
				const empName = getEmployeeName(s.employee_cuid).toLowerCase();
				return empName.includes(query) || s.employee_cuid.toLowerCase().includes(query);
			});
		}

		if (statusFilter !== 'all') {
			result = result.filter((s) => s.is_active === statusFilter);
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
				} else if (sortColumn === 'is_active') {
					valA = String(a.is_active);
					valB = String(b.is_active);
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
	let activeCount = $derived(structuresList.filter((s) => s.is_active).length);
	let inactiveCount = $derived(structuresList.filter((s) => !s.is_active).length);
	let paginatedStructures = $derived(
		filteredStructures.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

	// ─── Fetch helpers ────────────────────────────────────────────────────────────

	/** Initial page load — fetches structures, employees, and components once. */
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

	/**
	 * Post-mutation refresh — only re-fetches the structures list.
	 * Employees and components are static reference data; no need to reload them
	 * after a save or deactivate.
	 */
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
		formIsActive = true;
		formItems = [];
		nextItemId = 0;
		backendError = '';
		fieldErrors = {};
	}

	function openCreateModal() {
		editingStructure = null;
		resetForm();
		addItemRow();
		dirtyChecker.snapshot({
			employee_cuid: '',
			effective_from: '',
			effective_to: '',
			is_active: true,
			components: buildSnapshotItems()
		});
		modalMode = 'create';
	}

	function openEditModal(s: SalaryStructure) {
		editingStructure = s;
		formEmployeeCuid = s.employee_cuid;
		formEffectiveFrom = s.effective_from;
		formEffectiveTo = s.effective_to ?? '';
		formIsActive = s.is_active;
		formItems = s.components.map((item) => ({
			id: nextItemId++,
			salary_component_cuid: item.salary_component_cuid,
			amount: String(item.amount)
		}));
		backendError = '';
		fieldErrors = {};
		dirtyChecker.snapshot({
			employee_cuid: s.employee_cuid,
			effective_from: s.effective_from,
			effective_to: s.effective_to ?? '',
			is_active: s.is_active,
			components: JSON.stringify(
				s.components.map((i) => ({
					salary_component_cuid: i.salary_component_cuid,
					amount: String(i.amount)
				}))
			)
		});
		modalMode = 'edit';
	}

	function openViewModal(s: SalaryStructure) {
		editingStructure = s;
		modalMode = 'view';
	}

	function closeModal() {
		modalMode = null;
		editingStructure = null;
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

	// ─── Client-side form validation ──────────────────────────────────────────────

	function validateForm(): boolean {
		const errors: Record<string, string> = {};

		if (!formEmployeeCuid) {
			errors['employee_cuid'] = 'Employee is required';
		}

		const efError = validateEffectiveFrom(formEffectiveFrom);
		if (efError) errors['effective_from'] = efError;

		// Cross-field: effective_to must be after effective_from
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
		if (modalMode === 'edit' && !isDirty) return;

		if (!validateForm()) return;

		isSubmitting = true;
		backendError = '';

		const payload = {
			employee_cuid: formEmployeeCuid,
			effective_from: formEffectiveFrom,
			effective_to: formEffectiveTo || null,
			is_active: formIsActive,
			components: formItems.map((item) => ({
				salary_component_cuid: item.salary_component_cuid,
				amount: parseFloat(item.amount)
			}))
		};

		try {
			const response = await fetch(
				modalMode === 'edit' && editingStructure
					? `/api/salary-structures/salaryStructureCuid=${editingStructure.cuid}`
					: '/api/salary-structures',
				{
					method: modalMode === 'edit' ? 'PUT' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				}
			);

			const resData = await response.json();

			if (response.ok && resData.data) {
				await loadStructures();
				toast.success(
					modalMode === 'edit'
						? 'Salary Structure updated successfully'
						: 'Salary Structure created successfully'
				);
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

	// ─── Deactivate handler ───────────────────────────────────────────────────────

	async function handleDeactivate(s: SalaryStructure) {
		if (!confirm(`Deactivate salary structure for ${getEmployeeName(s.employee_cuid)}?`)) return;

		try {
			const response = await fetch(
				`/api/salary-structures/salaryStructureCuid=${s.cuid}`,
				{ method: 'DELETE' }
			);
			const resData = await response.json();

			if (response.ok) {
				await loadStructures();
				toast.success('Salary Structure deactivated successfully');
			} else {
				toast.error(resData.message || 'Failed to deactivate salary structure.');
			}
		} catch (err) {
			toast.error('An error occurred. Please try again.');
			console.error(err);
		}
	}

	// ─── Sort icon helper ─────────────────────────────────────────────────────────

	function sortIcon(col: string) {
		if (sortColumn !== col) return 'none';
		return sortDirection === 'asc' ? 'asc' : sortDirection === 'desc' ? 'desc' : 'none';
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
							<Button variant="ghost" size="sm" class="h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('is_active')}>
								Status
								{#if sortIcon('is_active') === 'asc'}<ArrowUpIcon class="ml-2 size-4" />
								{:else if sortIcon('is_active') === 'desc'}<ArrowDownIcon class="ml-2 size-4" />
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
									openViewModal(s);
								}}
								class="cursor-pointer"
							>
								<TableCell>
									<span class="font-semibold">{getEmployeeName(s.employee_cuid)}</span>
									<span class="block text-xs text-muted-foreground">{s.employee_cuid}</span>
								</TableCell>
								<TableCell>{s.effective_from}</TableCell>
								<TableCell>{s.effective_to ?? '—'}</TableCell>
								<TableCell>
									<span class="text-sm text-muted-foreground">{s.components.length} component{s.components.length === 1 ? '' : 's'}</span>
								</TableCell>
								<TableCell class="text-center">
									<Badge variant={s.is_active ? 'default' : 'secondary'}>
										{s.is_active ? 'Active' : 'Inactive'}
									</Badge>
								</TableCell>
								<TableCell class="text-right">
									<div class="flex items-center justify-end gap-1">
										<Button
											variant="ghost"
											size="icon-sm"
											class="h-7 w-7 text-muted-foreground hover:text-foreground"
											aria-label="View"
											onclick={() => openViewModal(s)}
										>
											<EyeIcon class="size-4" />
										</Button>
										<TableActions
											canEdit={true}
											onEdit={() => openEditModal(s)}
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

<!-- ─── Create / Edit Modal ─────────────────────────────────────────────────── -->

<CrudModal
	open={modalMode === 'create' || modalMode === 'edit'}
	title={modalMode === 'edit' ? 'Edit Salary Structure' : 'Create Salary Structure'}
	isDirty={isDirty}
	isSubmitting={isSubmitting}
	onClose={closeModal}
>
	{#snippet children({ cancel })}
		<form class="space-y-4" onsubmit={handleSave}>

			<!-- Employee dropdown -->
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
							{#each employeesList as emp (emp.cuid)}
								<DropdownMenu.Item
									onclick={() => { formEmployeeCuid = emp.cuid; delete fieldErrors['employee_cuid']; fieldErrors = { ...fieldErrors }; }}
									class="justify-between cursor-pointer {formEmployeeCuid === emp.cuid ? 'bg-accent text-accent-foreground' : ''}"
								>
									<span>{emp.name} <span class="text-xs text-muted-foreground">({emp.employee_id})</span></span>
									{#if formEmployeeCuid === emp.cuid}<CheckIcon class="size-4" />{/if}
								</DropdownMenu.Item>
							{/each}
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
					<Input
						id="effective_from"
						name="effective_from"
						type="date"
						bind:value={formEffectiveFrom}
						class={fieldErrors['effective_from'] ? 'border-destructive focus-visible:ring-destructive/30' : ''}
						oninput={() => { delete fieldErrors['effective_from']; fieldErrors = { ...fieldErrors }; }}
					/>
					{#if fieldErrors['effective_from']}
						<p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{fieldErrors['effective_from']}</p>
					{/if}
				</div>
				<div class="space-y-2">
					<Label for="effective_to">Effective To <span class="text-muted-foreground text-xs">(optional)</span></Label>
					<Input
						id="effective_to"
						name="effective_to"
						type="date"
						bind:value={formEffectiveTo}
						class={fieldErrors['effective_to'] ? 'border-destructive focus-visible:ring-destructive/30' : ''}
						oninput={() => { delete fieldErrors['effective_to']; fieldErrors = { ...fieldErrors }; }}
					/>
					{#if fieldErrors['effective_to']}
						<p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{fieldErrors['effective_to']}</p>
					{/if}
				</div>
			</div>

			<!-- Status -->
			<StatusDropdown id="structure_status" name="structure_status" value={formIsActive} onChange={(val) => (formIsActive = val)} />

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
													? (componentsList.find((c) => c.cuid === item.salary_component_cuid)?.component_name ?? item.salary_component_cuid)
													: 'Select component...'}
												<ChevronDownIcon class="ml-2 size-4 opacity-50" />
											</Button>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Content class="w-[220px] max-h-60 overflow-y-auto">
										<DropdownMenu.Group>
											{#each componentsList as comp (comp.cuid)}
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
					disabled={isSubmitting || (modalMode === 'edit' && !isDirty)}
				>
					{isSubmitting ? UI_CONSTANTS.BUTTON_SAVING : UI_CONSTANTS.BUTTON_SAVE}
				</Button>
			</div>
		</form>
	{/snippet}
</CrudModal>

<!-- ─── View Modal ──────────────────────────────────────────────────────────── -->

{#if modalMode === 'view' && editingStructure}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-[#262626]/70 px-4 py-6"
		onclick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
	>
		<Card class="relative w-full max-w-lg max-h-[90vh] overflow-y-auto" onclick={(e) => e.stopPropagation()}>
			<CardHeader class="flex-col items-start gap-1 pr-12">
				<div class="flex items-center gap-2">
					<CardTitle>Salary Structure</CardTitle>
					<Badge variant={editingStructure.is_active ? 'default' : 'secondary'}>
						{editingStructure.is_active ? 'Active' : 'Inactive'}
					</Badge>
				</div>
				<CardDescription>{getEmployeeName(editingStructure.employee_cuid)}</CardDescription>
			</CardHeader>
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				class="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
				aria-label="Close"
				onclick={closeModal}
			>
				✕
			</Button>
			<CardContent class="space-y-4">
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<p class="text-muted-foreground text-xs uppercase tracking-wide mb-1">Employee</p>
						<p class="font-medium">{getEmployeeName(editingStructure.employee_cuid)}</p>
						<p class="text-xs text-muted-foreground">{editingStructure.employee_cuid}</p>
					</div>
					<div>
						<p class="text-muted-foreground text-xs uppercase tracking-wide mb-1">Status</p>
						<Badge variant={editingStructure.is_active ? 'default' : 'secondary'}>
							{editingStructure.is_active ? 'Active' : 'Inactive'}
						</Badge>
					</div>
					<div>
						<p class="text-muted-foreground text-xs uppercase tracking-wide mb-1">Effective From</p>
						<p class="font-medium">{editingStructure.effective_from}</p>
					</div>
					<div>
						<p class="text-muted-foreground text-xs uppercase tracking-wide mb-1">Effective To</p>
						<p class="font-medium">{editingStructure.effective_to ?? '—'}</p>
					</div>
				</div>

				<div>
					<p class="text-muted-foreground text-xs uppercase tracking-wide mb-2">Components</p>
					<div class="rounded-lg border overflow-hidden">
						<Table>
							<TableHeader class="bg-muted">
								<TableRow>
									<TableHead class="text-xs font-semibold">Component</TableHead>
									<TableHead class="text-xs font-semibold text-right">Amount</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each editingStructure.components as item (item.cuid)}
									<TableRow>
										<TableCell class="text-sm">{getComponentName(item.salary_component_cuid)}</TableCell>
										<TableCell class="text-sm text-right font-mono">{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
									</TableRow>
								{:else}
									<TableRow>
										<TableCell colspan={2} class="text-center text-muted-foreground text-sm py-4">No components</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					</div>
				</div>

				<div class="flex justify-end gap-2 pt-2">
					<Button type="button" variant="outline" onclick={closeModal}>Close</Button>
					<Button
						type="button"
						class="bg-[#F45310] text-white hover:bg-[#F45310]/90"
						onclick={() => openEditModal(editingStructure!)}
					>
						Edit
					</Button>
					{#if editingStructure.is_active}
						<Button
							type="button"
							class="bg-[#800020] text-white hover:bg-[#800020]/90"
							onclick={() => { handleDeactivate(editingStructure!); closeModal(); }}
						>
							Deactivate
						</Button>
					{/if}
				</div>
			</CardContent>
		</Card>
	</div>
{/if}
