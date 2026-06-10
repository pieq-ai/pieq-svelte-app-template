<script lang="ts">
	import { onMount } from 'svelte';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';

	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import PlusIcon from '@lucide/svelte/icons/plus';
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
		ConfirmModal,
		CrudModal,
		TableActions,
		FilterDropdown,
		StatusDropdown,
		Pagination,
		SearchInput
	} from '$lib/components';

	interface Designation {
		cuid: string;
		designation_name: string;
		status: boolean;
	}

	let designationsList = $state<Designation[]>([]);
	let isLoading = $state(true);
	let loadError = $state('');

	let searchQuery = $state('');
	let statusFilter = $state<'all' | boolean>('all');
	let sortColumn = $state('designation_name');
	let sortDirection = $state<'asc' | 'desc' | null>(null);

	let currentPage = $state(1);
	let pageSize = $state(10);

	// Shared Form State
	let editingDesignation = $state<Designation | null>(null);
	let formDesignationName = $state('');
	let formDesignationStatus = $state<boolean>(true);
	let isSubmitting = $state(false);
	let isModalOpen = $state(false);
	let isNameTouched = $state(false);
	let backendError = $state('');
	let designationNameInput = $state<HTMLInputElement | null>(null);

	const dirtyChecker = createDirtyChecker<{ designation_name: string; status: boolean }>();
	let isDirty = $derived(isModalOpen && dirtyChecker.isDirty({ designation_name: formDesignationName.trim(), status: formDesignationStatus }));

	// Deletion State
	let itemToDelete = $state<Designation | null>(null);
	let isDeleting = $state(false);

	function getValidationError(name: string): string {
		const trimmed = name.trim();
		if (trimmed === '') {
			return 'Designation name is required';
		}
		const regex = /^[A-Za-z0-9]+(?:\s[A-Za-z0-9]+)*$/;
		if (!regex.test(trimmed)) {
			return 'Designation can contain only letters, numbers, and spaces. Special characters are not allowed.';
		}
		return '';
	}

	let nameValidationError = $derived(isNameTouched ? getValidationError(formDesignationName) : '');

	let filteredDesignations = $derived.by(() => {
		let result = [...designationsList];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(designation) =>
					designation.designation_name.toLowerCase().includes(query)
			);
		}

		if (statusFilter !== 'all') {
			result = result.filter((designation) => designation.status === statusFilter);
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

	let totalCount = $derived(designationsList.length);
	let paginatedDesignations = $derived(filteredDesignations.slice((currentPage - 1) * pageSize, currentPage * pageSize));
	let activeCount = $derived(designationsList.filter((d) => d.status === true).length);
	let inactiveCount = $derived(designationsList.filter((d) => d.status === false).length);

	async function loadDesignations() {
		isLoading = true;
		loadError = '';

		try {
			const response = await fetch('/api/designations');
			const resData = await response.json();

			if (response.ok) {
				designationsList = resData.data ?? [];
			} else {
				loadError = resData.error || 'Failed to load designations.';
				toast.error(loadError);
			}
		} catch (err) {
			loadError = 'An error occurred while loading designations.';
			toast.error(loadError);
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadDesignations();
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
		editingDesignation = null;
		formDesignationName = '';
		formDesignationStatus = true;
		isNameTouched = false;
		backendError = '';
		dirtyChecker.snapshot({ designation_name: '', status: true });
		isModalOpen = true;
	}

	function openEditModal(designation: Designation) {
		editingDesignation = designation;
		formDesignationName = designation.designation_name;
		formDesignationStatus = designation.status;
		isNameTouched = false;
		backendError = '';
		dirtyChecker.snapshot({ designation_name: designation.designation_name, status: designation.status });
		isModalOpen = true;
	}

	async function handleSaveDesignation(e: Event) {
		e.preventDefault();
		if (editingDesignation && !isDirty) return;
		isNameTouched = true;

		const validationError = getValidationError(formDesignationName);
		if (validationError) {
			designationNameInput?.focus();
			return;
		}

		isSubmitting = true;

		try {
			const response = await fetch(
				editingDesignation ? `/api/designations/${editingDesignation.cuid}` : '/api/designations',
				{
					method: editingDesignation ? 'PUT' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ designation_name: formDesignationName.trim(), status: formDesignationStatus })
				}
			);
			const resData = await response.json();

			if (response.ok && resData.data) {
				await loadDesignations();
				toast.success(editingDesignation ? 'Designation updated successfully' : 'Designation created successfully');
				isModalOpen = false;
			} else if (response.status === 409 && resData.field === 'designation_name') {
				backendError = resData.error;
				designationNameInput?.focus();
			} else {
				toast.error(resData.error || 'Failed to save designation.');
			}
		} catch (err) {
			toast.error('An error occurred. Please try again.');
			console.error(err);
		} finally {
			isSubmitting = false;
		}
	}

	async function confirmDelete() {
		if (!itemToDelete) return;
		isDeleting = true;

		try {
			const response = await fetch(`/api/designations/${itemToDelete.cuid}`, {
				method: 'DELETE'
			});
			const resData = await response.json();

			if (response.ok && resData.data) {
				await loadDesignations();
				toast.success('Designation deactivated successfully');
				itemToDelete = null;
			} else {
				toast.error(resData.error || 'Failed to deactivate designation.');
			}
		} catch (err) {
			console.error(err);
			toast.error('An error occurred while deactivating the designation.');
		} finally {
			isDeleting = false;
		}
	}
</script>

<svelte:head>
	<title>HRMS Designation Directory</title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-0">
	<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl wrap-break-word">Designation Directory</h1>
		</div>
		<Button
			type="button"
			class="bg-[#F45310] text-white hover:bg-[#F45310]/90"
			onclick={openCreateModal}
		>
			<PlusIcon class="size-4" />
			Add Designation
		</Button>
	</div>

	<div class="grid gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Total Designations</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#262626] tabular-nums">{totalCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Active Designations</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#F45310] tabular-nums">{activeCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Inactive Designations</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#800020] tabular-nums">{inactiveCount}</CardTitle>
			</CardHeader>
		</Card>
	</div>

	<div class="space-y-3">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<SearchInput id="search_designations" name="search_designations" bind:value={searchQuery} oninput={() => (currentPage = 1)} placeholder="Search by designation name..." />
			<FilterDropdown value={statusFilter} onChange={(value) => { statusFilter = value; currentPage = 1; }} />
		</div>

		<Card class="py-0">
			<Table>
				<TableHeader class="bg-muted">
					<TableRow>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('designation_name')}>
								Designation Name
							{#if sortColumn === 'designation_name' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortColumn === 'designation_name' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead class="text-center font-bold text-foreground text-[15px] whitespace-nowrap">
							<Button variant="ghost" size="sm" class="h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('status')}>
								Status
							{#if sortColumn === 'status' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortColumn === 'status' && sortDirection === 'desc'}
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
							<TableCell colspan={3} class="py-8 text-center text-muted-foreground">
								<LoaderCircleIcon class="mx-auto mb-2 size-6 animate-spin" />
								Loading designations...
							</TableCell>
						</TableRow>
					{:else if filteredDesignations.length === 0}
						<TableRow>
							<TableCell colspan={3} class="py-8 text-center text-muted-foreground">
								{UI_CONSTANTS.EMPTY_STATE_MESSAGE}
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedDesignations as designation (designation.cuid)}
							<TableRow 
								onclick={(e) => {
									if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
									openEditModal(designation);
								}} 
								class="cursor-pointer"
							>
								<TableCell>
									<div class="flex flex-col">
										<span class="font-semibold">{designation.designation_name}</span>
									</div>
								</TableCell>
								<TableCell class="text-center">
									<Badge variant={designation.status === true ? 'default' : 'secondary'}>{designation.status ? 'Active' : 'Inactive'}</Badge>
								</TableCell>
								<TableCell class="text-right">
									<TableActions
										canEdit={true}
										onEdit={() => openEditModal(designation)}
									/>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</Card>
		<Pagination bind:currentPage={currentPage} pageSize={pageSize} totalItems={filteredDesignations.length} />
	</div>
</div>

<CrudModal
	open={isModalOpen}
	title={editingDesignation ? 'Edit Designation' : 'Create Designation'}
	isDirty={isDirty}
	isSubmitting={isSubmitting}
	onClose={() => (isModalOpen = false)}
>
	{#snippet children({ cancel })}
		<form class="space-y-3" onsubmit={handleSaveDesignation}>
			<div class="space-y-2">
				<Label for="designation_name">Designation Name</Label>
				<Input
					id="designation_name"
					name="designation_name"
					bind:ref={designationNameInput}
					bind:value={formDesignationName}
					class={nameValidationError || backendError ? 'border-destructive' : ''}
					placeholder="e.g. Senior HR Manager"
					oninput={() => { backendError = ''; }}
				/>
				{#if nameValidationError || backendError}
					<p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{nameValidationError || backendError}</p>
				{/if}
			</div>
			{#if editingDesignation}
				<StatusDropdown id="designation_status" name="designation_status" value={formDesignationStatus} onChange={(val) => (formDesignationStatus = val)} />
			{/if}
			<div class="flex items-center justify-end gap-3 pt-4">
				<Button type="button" variant="outline" onclick={cancel} disabled={isSubmitting}>{UI_CONSTANTS.BUTTON_CANCEL}</Button>
				<Button type="submit" class="bg-[#F45310] text-white hover:bg-[#F45310]/90" disabled={isSubmitting || (!!editingDesignation && !isDirty)}>
					{isSubmitting ? UI_CONSTANTS.BUTTON_SAVING : (editingDesignation ? UI_CONSTANTS.BUTTON_UPDATE : UI_CONSTANTS.BUTTON_SAVE)}
				</Button>
			</div>
		</form>
	{/snippet}
</CrudModal>

<ConfirmModal
	open={!!itemToDelete}
	title="Deactivate Designation"
	description={`Are you sure you want to deactivate ${itemToDelete?.designation_name}?`}
	confirmLabel="Deactivate"
	isSubmitting={isDeleting}
	onCancel={() => (itemToDelete = null)}
	onConfirm={confirmDelete}
/>
