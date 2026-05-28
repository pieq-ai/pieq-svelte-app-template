<script lang="ts">
	import { onMount } from 'svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Edit2Icon from '@lucide/svelte/icons/edit-2';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import {
		Badge,
		Button,
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		Input,
		Label,
		TableRow,
		TableCell,
		StatusBadge,
		SearchBar,
		Pagination,
		MasterTable,
		MasterFormModal,
		ConfirmDialog
	} from '$lib/components';

	import type {
		SalaryComponent,
		SalaryComponentType
	} from '$lib/types/salary-component';
	import { validateComponentName } from '$lib/validators/salary-component';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { toast } from '$lib/toast.svelte';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { scale } from 'svelte/transition';

	let items = $state<SalaryComponent[]>([]);
	let totalItems = $state(0);
	let totalPages = $state(1);

	let isLoading = $state(false);

	let searchQuery = $state('');
	let filterType = $state<'all' | SalaryComponentType>('all');
	// 'all' | 'true' | 'false' maps to undefined | true | false for the API
	let filterActive = $state<'all' | 'true' | 'false'>('all');

	let page = $state(1);
	let pageSize = $state(10);

	let sortBy = $state('component_name');
	let sortOrder = $state<'asc' | 'desc'>('asc');

	let isModalOpen = $state(false);
	let isSubmitting = $state(false);

	let editingId = $state<string | null>(null);

	let formName = $state('');
	let formType = $state<SalaryComponentType>('earning');
	let formIsTaxable = $state(false);
	let formIsActive = $state(true);

	let isConfirmOpen = $state(false);
	let isConfirming = $state(false);
	let deactivatingId = $state<string | null>(null);

	let earningsCount = $state(0);
	let deductionsCount = $state(0);

	let totalCount = $derived(totalItems);

	let previousFilters = '';

	const headers = [
		{
			key: 'component_name',
			label: 'Component Name',
			sortable: true
		},
		{
			key: 'component_type',
			label: 'Type',
			sortable: true
		},
		{
			key: 'is_taxable',
			label: 'Taxable'
		},
		{
			key: 'is_active',
			label: 'Status',
			sortable: true
		},
		{
			key: 'actions',
			label: 'Actions'
		}
	];

	async function loadComponents() {
		try {
			isLoading = true;

			const params = new SvelteURLSearchParams();

			if (searchQuery)
				params.set('search', searchQuery);

			if (filterType !== 'all')
				params.set(
					'component_type',
					filterType
				);

			if (filterActive !== 'all')
				params.set(
					'is_active',
					filterActive
				);

			params.set('page', page.toString());
			params.set(
				'pageSize',
				pageSize.toString()
			);

			params.set('sortBy', sortBy);
			params.set(
				'sortOrder',
				sortOrder
			);

			const res = await fetch(
				`/api/salary-components?${params}`
			);

			const json = await res.json();

			if (!json.success)
				throw new Error(
					json.message
				);

			items = json.data.items;
			totalItems = json.data.total;
			totalPages =
				json.data.totalPages;
		} catch (e) {
			console.error(e);
			toast.error(
				e instanceof Error
					? e.message
					: 'Failed loading salary components'
			);
		} finally {
			isLoading = false;
		}
	}

	async function loadStats() {
		try {
			const res = await fetch(
				'/api/salary-components?pageSize=9999'
			);

			const json = await res.json();

			if (!json.success) return;

			const all =
				json.data.items || [];

			earningsCount =
				all.filter(
					(x: SalaryComponent) =>
						x.component_type ===
							'earning' &&
						x.is_active === true
				).length;

			deductionsCount =
				all.filter(
					(x: SalaryComponent) =>
						x.component_type ===
							'deduction' &&
						x.is_active === true
				).length;
		} catch (e) {
			console.error(e);
		}
	}

	$effect(() => {
		const currentFilters =
			`${searchQuery}-${filterType}-${filterActive}`;

		if (
			previousFilters &&
			previousFilters !==
				currentFilters
		) {
			page = 1;
		}

		previousFilters =
			currentFilters;

		loadComponents();
	});

	onMount(async () => {
		await Promise.all([
			loadComponents(),
			loadStats()
		]);
	});

	function handleOpenCreate() {
		editingId = null;

		formName = '';
		formType = 'earning';
		formIsActive = true;
		formIsTaxable = false;

		isModalOpen = true;
	}

	function handleOpenEdit(
		component: SalaryComponent
	) {
		editingId =
			component.id;

		formName =
			component.component_name;

		formType =
			component.component_type;

		formIsActive =
			component.is_active;

		formIsTaxable =
			component.is_taxable;

		isModalOpen = true;
	}

	async function handleFormSubmit(
		e: SubmitEvent
	) {
		e.preventDefault();

		const trimmedName = formName.trim();
		formName = trimmedName;

		const nameError = validateComponentName(trimmedName);
		if (nameError) {
			toast.error(nameError);
			return;
		}

		try {
			isSubmitting = true;

			const payload = {
				component_name:
					trimmedName,
				component_type:
					formType,
				is_active:
					formIsActive,
				is_taxable:
					formIsTaxable
			};

			const res =
				await fetch(
					editingId
						? `/api/salary-components/${editingId}`
						: '/api/salary-components',
					{
						method:
							editingId
								? 'PUT'
								: 'POST',
						headers: {
							'Content-Type':
								'application/json'
						},
						body:
							JSON.stringify(
								payload
							)
					}
				);

			const json =
				await res.json();

			if (!json.success)
				throw new Error(
					json.message
				);

			await Promise.all([
				loadComponents(),
				loadStats()
			]);

			toast.success(
				editingId
					? 'Salary Component updated successfully'
					: 'Salary Component created successfully'
			);
			isModalOpen = false;
		} catch (e) {
			toast.error(
				e instanceof Error
					? e.message
					: 'Failed to save salary component'
			);
		} finally {
			isSubmitting = false;
		}
	}

	function handleTriggerDeactivate(
		id: string
	) {
		deactivatingId = id;
		isConfirmOpen = true;
	}

	async function handleDeactivateConfirm() {
		if (!deactivatingId)
			return;

		try {
			isConfirming = true;

			const res =
				await fetch(
					`/api/salary-components/${deactivatingId}`,
					{
						method:
							'DELETE'
					}
				);

			const json =
				await res.json();

			if (!json.success)
				throw new Error(
					json.message
				);

			await Promise.all([
				loadComponents(),
				loadStats()
			]);

			toast.success('Salary Component deactivated successfully');
			isConfirmOpen = false;
		} catch (e) {
			toast.error(
				e instanceof Error
					? e.message
					: 'Failed to deactivate salary component'
			);
			console.error(e);
		}
	}

	let activeDropdown = $state<string | null>(null);

	function toggleDropdown(name: string, e: MouseEvent) {
		e.stopPropagation();
		if (activeDropdown === name) {
			activeDropdown = null;
		} else {
			activeDropdown = name;
		}
	}

	function closeAllDropdowns() {
		activeDropdown = null;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			activeDropdown = null;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} onclick={closeAllDropdowns} />

<svelte:head>
	<title>Salary Components | PieQ HRMS</title>
</svelte:head>

<div class="space-y-5">
	<!-- Page Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Salary Components</h1>
			<p class="mt-2 text-muted-foreground">
				Define and manage salary earning and deduction configurations.
			</p>
		</div>
		<Button
			onclick={handleOpenCreate}
			class="gap-2 bg-[#C2652A] text-white hover:bg-[#a8531f] border-0"
		>
			<PlusIcon class="size-4" />
			Create Component
		</Button>
	</div>

	<!-- Stats Grid -->
	<div class="grid gap-6 md:grid-cols-3">
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Total Components</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-3xl font-bold">{totalCount}</p>
				<p class="mt-1 text-xs text-muted-foreground">Registered salary masters</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Active Earnings</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-3xl font-bold">{earningsCount}</p>
				<p class="mt-1 text-xs text-muted-foreground">Additions to gross base salary</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Active Deductions</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-3xl font-bold">{deductionsCount}</p>
				<p class="mt-1 text-xs text-muted-foreground">Statutory and optional cutbacks</p>
			</CardContent>
		</Card>
	</div>



	<!-- Filter + Table Card -->
	<Card class="pt-1 gap-2">
		<!-- Toolbar -->
		<div class="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="w-full max-w-xs">
				<SearchBar bind:value={searchQuery} placeholder="Search component name..." />
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<!-- Filter Type Dropdown -->
				<div class="relative">
					<button
						type="button"
						onclick={(e) => toggleDropdown('filterType', e)}
						class="h-9 w-40 rounded-md border border-input bg-background pl-3 pr-8 text-sm focus:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 shadow-xs transition-[color,box-shadow] text-left flex items-center justify-between select-none cursor-pointer dark:bg-input/30"
					>
						<span>
							{filterType === 'all' ? 'All Types' : (filterType === 'earning' ? 'Earning' : 'Deduction')}
						</span>
						<span class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-70">
							<ChevronDownIcon class="size-4" />
						</span>
					</button>

					{#if activeDropdown === 'filterType'}
						<div
							transition:scale={{ start: 0.95, duration: 100 }}
							class="absolute left-0 mt-1.5 z-50 w-full min-w-[10rem] rounded-lg border border-slate-200 dark:border-slate-800 bg-background/95 backdrop-blur-md p-1 shadow-lg flex flex-col gap-0.5"
						>
							{#each [
								{ value: 'all', label: 'All Types' },
								{ value: 'earning', label: 'Earning' },
								{ value: 'deduction', label: 'Deduction' }
							] as opt (opt.value)}
								<button
									type="button"
									onclick={() => {
										filterType = opt.value as 'all' | SalaryComponentType;
										activeDropdown = null;
									}}
									class="w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors font-medium
										{filterType === opt.value
											? 'bg-[#C2652A]/10 text-[#C2652A] dark:bg-[#C2652A]/20'
											: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}"
								>
									{opt.label}
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Filter Active Dropdown -->
				<div class="relative">
					<button
						type="button"
						onclick={(e) => toggleDropdown('filterActive', e)}
						class="h-9 w-40 rounded-md border border-input bg-background pl-3 pr-8 text-sm focus:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 shadow-xs transition-[color,box-shadow] text-left flex items-center justify-between select-none cursor-pointer dark:bg-input/30"
					>
						<span>
							{filterActive === 'all' ? 'All Statuses' : (filterActive === 'true' ? 'Active' : 'Inactive')}
						</span>
						<span class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-70">
							<ChevronDownIcon class="size-4" />
						</span>
					</button>

					{#if activeDropdown === 'filterActive'}
						<div
							transition:scale={{ start: 0.95, duration: 100 }}
							class="absolute left-0 mt-1.5 z-50 w-full min-w-[10rem] rounded-lg border border-slate-200 dark:border-slate-800 bg-background/95 backdrop-blur-md p-1 shadow-lg flex flex-col gap-0.5"
						>
							{#each [
								{ value: 'all', label: 'All Statuses' },
								{ value: 'true', label: 'Active' },
								{ value: 'false', label: 'Inactive' }
							] as opt (opt.value)}
								<button
									type="button"
									onclick={() => {
										filterActive = opt.value as 'all' | 'true' | 'false';
										activeDropdown = null;
									}}
									class="w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors font-medium
										{filterActive === opt.value
											? 'bg-[#C2652A]/10 text-[#C2652A] dark:bg-[#C2652A]/20'
											: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}"
								>
									{opt.label}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Table -->
		<MasterTable
			{headers}
			items={items}
			isLoading={isLoading}
			bind:sortBy={sortBy}
			bind:sortOrder={sortOrder}
			emptyMessage="No salary components found matching your selection."
		>
			{#snippet itemSnippet(comp: SalaryComponent)}
				<TableRow class="hover:bg-muted/50 transition-colors">
					<TableCell class="font-medium">{comp.component_name}</TableCell>
					<TableCell>
						<Badge
							variant="secondary"
							class="uppercase text-[10px] tracking-wider {comp.component_type === 'earning'
								? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
								: 'bg-red-50 text-red-700 hover:bg-red-100'}"
						>
							{comp.component_type}
						</Badge>
					</TableCell>
					<TableCell>
						{#if comp.is_taxable}
							<Badge variant="outline" class="border-amber-200 bg-amber-50 text-amber-700 text-xs">
								Taxable
							</Badge>
						{:else}
							<span class="text-xs text-muted-foreground">Non-taxable</span>
						{/if}
					</TableCell>
					<TableCell>
						<StatusBadge is_active={comp.is_active} />
					</TableCell>
					<TableCell>
						<div class="flex items-center gap-1">
							<Button
								variant="ghost"
								size="icon-sm"
								class="h-8 w-8 text-muted-foreground hover:text-foreground"
								onclick={() => handleOpenEdit(comp)}
								title="Edit component"
							>
								<Edit2Icon class="size-3.5" />
							</Button>
							{#if comp.is_active}
								<Button
									variant="ghost"
									size="icon-sm"
									class="h-8 w-8 text-muted-foreground hover:text-destructive"
									onclick={() => handleTriggerDeactivate(comp.id)}
									title="Deactivate component"
								>
									<Trash2Icon class="size-3.5" />
								</Button>
							{/if}
						</div>
					</TableCell>
				</TableRow>
			{/snippet}
		</MasterTable>

		<!-- Pagination -->
		{#if totalItems > 0}
			<div class="border-t p-3">
				<Pagination
					bind:page={page}
					totalPages={totalPages}
					total={totalItems}
					pageSize={pageSize}
				/>
			</div>
		{/if}
	</Card>
</div>

<!-- Create / Edit Modal -->
<MasterFormModal
	isOpen={isModalOpen}
	title={editingId ? 'Edit Salary Component' : 'Create Salary Component'}
	isSubmitting={isSubmitting}
	onclose={() => (isModalOpen = false)}
	onsubmit={handleFormSubmit}
>
	<div class="space-y-4">
		<div class="space-y-2">
			<Label for="component_name">Component Name</Label>
			<Input
				id="component_name"
				type="text"
				bind:value={formName}
				placeholder="e.g. Basic Pay, HRA, Provident Fund"
				required
			/>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<!-- Component Type Custom Dropdown -->
			<div class="space-y-2 relative">
				<Label for="component_type">Component Type</Label>
				<button
					id="component_type"
					type="button"
					onclick={(e) => toggleDropdown('formType', e)}
					class="h-9 w-full rounded-md border border-input bg-background pl-3 pr-8 text-sm focus:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 shadow-xs transition-[color,box-shadow] text-left flex items-center justify-between select-none cursor-pointer dark:bg-input/30"
				>
					<span>{formType === 'earning' ? 'Earning' : 'Deduction'}</span>
					<span class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-70">
						<ChevronDownIcon class="size-4" />
					</span>
				</button>

				{#if activeDropdown === 'formType'}
					<div
						transition:scale={{ start: 0.95, duration: 100 }}
						class="absolute left-0 top-[4.25rem] z-50 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-background/95 backdrop-blur-md p-1 shadow-lg flex flex-col gap-0.5"
					>
						{#each [
							{ value: 'earning', label: 'Earning' },
							{ value: 'deduction', label: 'Deduction' }
						] as opt (opt.value)}
							<button
								type="button"
								onclick={() => {
									formType = opt.value as SalaryComponentType;
									activeDropdown = null;
								}}
								class="w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors font-medium
									{formType === opt.value
										? 'bg-[#C2652A]/10 text-[#C2652A] dark:bg-[#C2652A]/20'
										: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}"
							>
								{opt.label}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Status Custom Dropdown -->
			<div class="space-y-2 relative">
				<Label for="is_active">Status</Label>
				<button
					id="is_active"
					type="button"
					onclick={(e) => toggleDropdown('formIsActive', e)}
					class="h-9 w-full rounded-md border border-input bg-background pl-3 pr-8 text-sm focus:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 shadow-xs transition-all duration-200 text-left flex items-center justify-between select-none cursor-pointer dark:bg-input/30"
				>
					<span>{formIsActive ? 'Active' : 'Inactive'}</span>
					<span class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-70">
						<ChevronDownIcon class="size-4" />
					</span>
				</button>

				{#if activeDropdown === 'formIsActive'}
					<div
						transition:scale={{ start: 0.95, duration: 100 }}
						class="absolute left-0 top-[4.25rem] z-50 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-background/95 backdrop-blur-md p-1 shadow-lg flex flex-col gap-0.5"
					>
						{#each [
							{ value: true, label: 'Active' },
							{ value: false, label: 'Inactive' }
						] as opt (opt.value)}
							<button
								type="button"
								onclick={() => {
									formIsActive = opt.value;
									activeDropdown = null;
								}}
								class="w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors font-medium
									{formIsActive === opt.value
										? 'bg-[#C2652A]/10 text-[#C2652A] dark:bg-[#C2652A]/20'
										: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}"
							>
								{opt.label}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Taxable toggle -->
		<div class="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
			<input
				id="is_taxable"
				type="checkbox"
				bind:checked={formIsTaxable}
				class="size-4 rounded border-input accent-[#C2652A] cursor-pointer"
			/>
			<div class="space-y-0.5">
				<Label for="is_taxable" class="cursor-pointer font-medium">Taxable Component</Label>
				<p class="text-xs text-muted-foreground">Indicates if income tax applies to this component</p>
			</div>
		</div>


	</div>
</MasterFormModal>

<!-- Deactivation Confirm -->
<ConfirmDialog
	isOpen={isConfirmOpen}
	title="Deactivate Salary Component?"
	message="Are you sure you want to deactivate this salary component? Deactivating it will prevent future allocations, but won't affect legacy records."
	confirmText="Deactivate"
	cancelText="Cancel"
	isConfirming={isConfirming}
	onconfirm={handleDeactivateConfirm}
	oncancel={() => (isConfirmOpen = false)}
/>
