<script lang="ts">
	import { onMount } from 'svelte';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';

	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { toast } from '$lib/toast';
	import { createDirtyChecker } from '$lib/utils';
	import { UI_CONSTANTS } from '$lib/constants';

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
		TableActions,
		FilterDropdown,
		StatusDropdown,
		Pagination,
		SearchInput
	} from '$lib/components';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	import type {
		SalaryComponent,
		SalaryComponentType
	} from '$lib/types/salary-component';
	import { validateComponentName } from '$lib/validators/salary-component';

	let componentsList = $state<SalaryComponent[]>([]);
	let isLoading = $state(true);
	let loadError = $state('');

	let searchQuery = $state('');
	let statusFilter = $state<'all' | boolean>('all');
	let typeFilter = $state<'all' | SalaryComponentType>('all');
	let sortColumn = $state('component_name');
	let sortDirection = $state<'asc' | 'desc' | null>(null);

	let currentPage = $state(1);
	let pageSize = $state(10);

	// Shared Form State
	let editingComp = $state<SalaryComponent | null>(null);
	let formName = $state('');
	let formType = $state<SalaryComponentType>('earning');
	let formIsTaxable = $state(false);
	let formIsActive = $state<boolean>(true);
	let isSubmitting = $state(false);
	let isModalOpen = $state(false);
	let backendError = $state('');
	let nameInput = $state<HTMLInputElement | null>(null);

	const dirtyChecker = createDirtyChecker<{
		component_name: string;
		component_type: SalaryComponentType;
		is_taxable: boolean;
		is_active: boolean;
	}>();

	let isDirty = $derived(
		isModalOpen && dirtyChecker.isDirty({
			component_name: formName.trim(),
			component_type: formType,
			is_taxable: formIsTaxable,
			is_active: formIsActive
		})
	);

	let filteredComponents = $derived.by(() => {
		let result = [...componentsList];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter((comp) =>
				comp.component_name.toLowerCase().includes(query)
			);
		}

		if (statusFilter !== 'all') {
			result = result.filter((comp) => comp.is_active === statusFilter);
		}

		if (typeFilter !== 'all') {
			result = result.filter((comp) => comp.component_type === typeFilter);
		}

		if (sortDirection && sortColumn) {
			result.sort((a, b) => {
				const valA = a[sortColumn as keyof typeof a];
				const valB = b[sortColumn as keyof typeof b];

				return sortDirection === 'asc'
					? String(valA).localeCompare(String(valB))
					: String(valB).localeCompare(String(valA));
			});
		}

		return result;
	});

	let totalCount = $derived(componentsList.length);
	let paginatedComponents = $derived(
		filteredComponents.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);
	let activeEarningsCount = $derived(
		componentsList.filter((c) => c.component_type === 'earning' && c.is_active).length
	);
	let activeDeductionsCount = $derived(
		componentsList.filter((c) => c.component_type === 'deduction' && c.is_active).length
	);

	async function loadComponents() {
		isLoading = true;
		loadError = '';
		try {
			const response = await fetch('/api/salary-components');
			const resData = await response.json();
			if (response.ok) {
				componentsList = resData.data ?? [];
			} else {
				loadError = resData.error || resData.message || 'Failed to load salary components.';
				toast.error(loadError);
			}
		} catch (err) {
			loadError = 'An error occurred while loading salary components.';
			toast.error(loadError);
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadComponents();
	});

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

	function openCreateModal() {
		editingComp = null;
		formName = '';
		formType = 'earning';
		formIsTaxable = false;
		formIsActive = true;
		backendError = '';
		dirtyChecker.snapshot({
			component_name: '',
			component_type: 'earning',
			is_taxable: false,
			is_active: true
		});
		isModalOpen = true;
	}

	function openEditModal(comp: SalaryComponent) {
		editingComp = comp;
		formName = comp.component_name;
		formType = comp.component_type;
		formIsTaxable = comp.is_taxable;
		formIsActive = comp.is_active;
		backendError = '';
		dirtyChecker.snapshot({
			component_name: comp.component_name,
			component_type: comp.component_type,
			is_taxable: comp.is_taxable,
			is_active: comp.is_active
		});
		isModalOpen = true;
	}

	async function handleSaveComponent(e: Event) {
		e.preventDefault();
		if (editingComp && !isDirty) return;

		const validationError = validateComponentName(formName);
		if (validationError) {
			backendError = validationError;
			nameInput?.focus();
			return;
		}

		isSubmitting = true;
		backendError = '';

		try {
			const payload = {
				component_name: formName.trim(),
				component_type: formType,
				is_taxable: formIsTaxable,
				is_active: formIsActive
			};

			const response = await fetch(
				editingComp
					? `/api/salary-components/${editingComp.cuid}`
					: '/api/salary-components',
				{
					method: editingComp ? 'PUT' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				}
			);
			const resData = await response.json();

			if (response.ok && resData.data) {
				await loadComponents();
				toast.success(editingComp ? 'Salary Component updated successfully' : 'Salary Component created successfully');
				isModalOpen = false;
			} else {
				if (response.status === 400 || response.status === 409) {
					backendError = resData.message || resData.error || 'Validation failed';
					nameInput?.focus();
				} else {
					toast.error(resData.message || resData.error || 'Failed to save salary component.');
				}
			}
		} catch (err) {
			toast.error('An error occurred. Please try again.');
			console.error(err);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>HRMS Salary Components</title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-0">
	<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl wrap-break-word">Salary Components</h1>
		</div>
		<Button
			type="button"
			class="bg-[#F45310] text-white hover:bg-[#F45310]/90 border-0"
			onclick={openCreateModal}
		>
			<PlusIcon class="size-4" />
			Add Component
		</Button>
	</div>

	<!-- Metrics Cards -->
	<div class="grid gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Total Components</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#262626] tabular-nums">{totalCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Active Earnings</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#F45310] tabular-nums">{activeEarningsCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Active Deductions</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#800020] tabular-nums">{activeDeductionsCount}</CardTitle>
			</CardHeader>
		</Card>
	</div>

	<div class="space-y-3">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<SearchInput id="search_components" name="search_components" bind:value={searchQuery} oninput={() => (currentPage = 1)} placeholder="Search component name..." />
			
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button variant="outline" class="h-9 w-[180px] justify-between border-input bg-background shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-3 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 transition-[color,box-shadow] outline-none" {...props}>
							{typeFilter === 'all' ? 'All Types' : typeFilter === 'earning' ? 'Earning' : 'Deduction'}
							<FilterIcon class="ml-2 size-4 opacity-50" />
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="w-[180px]">
					<DropdownMenu.Group>
						<DropdownMenu.Item onclick={() => { typeFilter = 'all'; currentPage = 1; }} class="justify-between cursor-pointer {typeFilter === 'all' ? 'bg-accent text-accent-foreground' : ''}">
							All Types
							{#if typeFilter === 'all'}<CheckIcon class="size-4" />{/if}
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => { typeFilter = 'earning'; currentPage = 1; }} class="justify-between cursor-pointer {typeFilter === 'earning' ? 'bg-accent text-accent-foreground' : ''}">
							Earning
							{#if typeFilter === 'earning'}<CheckIcon class="size-4" />{/if}
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => { typeFilter = 'deduction'; currentPage = 1; }} class="justify-between cursor-pointer {typeFilter === 'deduction' ? 'bg-accent text-accent-foreground' : ''}">
							Deduction
							{#if typeFilter === 'deduction'}<CheckIcon class="size-4" />{/if}
						</DropdownMenu.Item>
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<FilterDropdown value={statusFilter} onChange={(value) => { statusFilter = value; currentPage = 1; }} />
		</div>

		<Card class="py-0">
			<Table>
				<TableHeader class="bg-muted">
					<TableRow>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('component_name')}>
								Component Name
							{#if sortColumn === 'component_name' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortColumn === 'component_name' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('component_type')}>
								Type
							{#if sortColumn === 'component_type' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortColumn === 'component_type' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">Taxable</TableHead>
						<TableHead class="text-center font-bold text-foreground text-[15px] whitespace-nowrap">
							<Button variant="ghost" size="sm" class="h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('is_active')}>
								Status
							{#if sortColumn === 'is_active' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortColumn === 'is_active' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead class="text-right font-bold text-foreground text-[15px] whitespace-nowrap">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if isLoading}
						<TableRow>
							<TableCell colspan={5} class="py-8 text-center text-muted-foreground">
								<LoaderCircleIcon class="mx-auto mb-2 size-6 animate-spin" />
								Loading components...
							</TableCell>
						</TableRow>
					{:else if filteredComponents.length === 0}
						<TableRow>
							<TableCell colspan={5} class="py-8 text-center text-muted-foreground">
								{UI_CONSTANTS.EMPTY_STATE_MESSAGE}
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedComponents as comp (comp.cuid)}
							<TableRow 
								onclick={(e) => {
									if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
									openEditModal(comp);
								}} 
								class="cursor-pointer"
							>
								<TableCell>
									<span class="font-semibold">{comp.component_name}</span>
								</TableCell>
								<TableCell>
									<span class="capitalize">{comp.component_type}</span>
								</TableCell>
								<TableCell>
									<span>{comp.is_taxable ? "Taxable" : "Non-taxable"}</span>
								</TableCell>
								<TableCell class="text-center">
									<Badge variant={comp.is_active === true ? 'default' : 'secondary'}>{comp.is_active ? 'Active' : 'Inactive'}</Badge>
								</TableCell>
								<TableCell class="text-right">
									<TableActions
										canEdit={true}
										onEdit={() => openEditModal(comp)}
									/>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</Card>
		<Pagination bind:currentPage={currentPage} pageSize={pageSize} totalItems={filteredComponents.length} />
	</div>
</div>

<CrudModal
	open={isModalOpen}
	title={editingComp ? 'Edit Salary Component' : 'Create Salary Component'}
	isDirty={isDirty}
	isSubmitting={isSubmitting}
	onClose={() => (isModalOpen = false)}
>
	{#snippet children({ cancel })}
		<form class="space-y-4" onsubmit={handleSaveComponent}>
			<div class="space-y-2">
				<Label for="component_name">Component Name</Label>
				<Input
					id="component_name"
					name="component_name"
					bind:ref={nameInput}
					bind:value={formName}
					class={backendError ? 'border-destructive focus-visible:ring-destructive/30' : ''}
					placeholder="e.g. Basic Pay, HRA"
					oninput={() => { backendError = ''; }}
				/>
				{#if backendError}
					<p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{backendError}</p>
				{/if}
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="component_type">Component Type</Label>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button id="component_type" name="component_type" variant="outline" class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-3 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 transition-[color,box-shadow] outline-none" {...props}>
									{formType === 'earning' ? 'Earning' : 'Deduction'}
									<ChevronDownIcon class="ml-2 size-4 opacity-50" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-[200px]">
							<DropdownMenu.Group>
								<DropdownMenu.Item onclick={() => (formType = 'earning')} class="justify-between cursor-pointer {formType === 'earning' ? 'bg-accent text-accent-foreground' : ''}">
									Earning
									{#if formType === 'earning'}<CheckIcon class="size-4" />{/if}
								</DropdownMenu.Item>
								<DropdownMenu.Item onclick={() => (formType = 'deduction')} class="justify-between cursor-pointer {formType === 'deduction' ? 'bg-accent text-accent-foreground' : ''}">
									Deduction
									{#if formType === 'deduction'}<CheckIcon class="size-4" />{/if}
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
				
				<StatusDropdown id="component_status" name="component_status" value={formIsActive} onChange={(val) => (formIsActive = val)} />
			</div>

			<div class="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
				<input
					id="is_taxable"
					name="is_taxable"
					type="checkbox"
					bind:checked={formIsTaxable}
					class="size-4 rounded border-input accent-[#F45310] cursor-pointer"
				/>
				<div class="space-y-0.5">
					<Label for="is_taxable" class="cursor-pointer font-medium">Taxable Component</Label>
					<p class="text-xs text-muted-foreground">Indicates if income tax applies to this component</p>
				</div>
			</div>

			<div class="flex items-center justify-end gap-3 pt-4">
				<Button type="button" variant="outline" onclick={cancel} disabled={isSubmitting}>{UI_CONSTANTS.BUTTON_CANCEL}</Button>
				<Button type="submit" class="bg-[#F45310] text-white hover:bg-[#F45310]/90" disabled={isSubmitting || (!!editingComp && !isDirty)}>
					{isSubmitting ? UI_CONSTANTS.BUTTON_SAVING : UI_CONSTANTS.BUTTON_SAVE}
				</Button>
			</div>
		</form>
	{/snippet}
</CrudModal>
