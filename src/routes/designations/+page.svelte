<script lang="ts">
	import { onMount } from 'svelte';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import SearchIcon from '@lucide/svelte/icons/search';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { toast } from '$lib/toast';

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
		FilterDropdown
	} from '$lib/components';

	interface Designation {
		cuid2: string;
		designation_name: string;
		status: boolean;
	}

	let designationsList = $state<Designation[]>([]);
	let isLoading = $state(true);
	let loadError = $state('');

	let searchQuery = $state('');
	let statusFilter = $state<'all' | boolean>('all');
	let sortColumn = $state('designation_name');
	let sortDirection = $state<'asc' | 'desc'>('asc');

	// Shared Form State
	let editingDesignation = $state<Designation | null>(null);
	let formDesignationName = $state('');
	let formDesignationStatus = $state<boolean>(true);
	let isSubmitting = $state(false);
	let isModalOpen = $state(false);
	let isNameTouched = $state(false);

	// Deletion State
	let itemToDelete = $state<Designation | null>(null);
	let isDeleting = $state(false);

	function getValidationError(name: string): string {
		const trimmed = name.trim();
		if (trimmed === '') {
			return 'Designation name is required';
		}
		const regex = /^[A-Za-z ]+$/;
		if (!regex.test(trimmed)) {
			return 'Only letters and spaces are allowed';
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
					designation.designation_name.toLowerCase().includes(query) ||
					designation.cuid2.toLowerCase().includes(query)
			);
		}

		if (statusFilter !== 'all') {
			result = result.filter((designation) => designation.status === statusFilter);
		}

		result.sort((a, b) => {
			const valA = a[sortColumn as keyof typeof a];
			const valB = b[sortColumn as keyof typeof b];

			return sortDirection === 'asc'
				? String(valA).localeCompare(String(valB))
				: String(valB).localeCompare(String(valA));
		});

		return result;
	});

	let totalCount = $derived(designationsList.length);
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
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	}

	function sortIndicator(column: string) {
		if (sortColumn !== column) return '';
		return sortDirection === 'asc' ? ' ↑' : ' ↓';
	}

	function openCreateModal() {
		editingDesignation = null;
		formDesignationName = '';
		formDesignationStatus = true;
		isNameTouched = false;
		isModalOpen = true;
	}

	function openEditModal(designation: Designation) {
		editingDesignation = designation;
		formDesignationName = designation.designation_name;
		formDesignationStatus = designation.status;
		isNameTouched = false;
		isModalOpen = true;
	}

	async function handleSaveDesignation(e: Event) {
		e.preventDefault();
		isNameTouched = true;

		const validationError = getValidationError(formDesignationName);
		if (validationError) {
			toast.error(validationError);
			return;
		}

		isSubmitting = true;

		try {
			const response = await fetch(
				editingDesignation ? `/api/designations?cuid2=${editingDesignation.cuid2}` : '/api/designations',
				{
					method: editingDesignation ? 'PUT' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ designation_name: formDesignationName.trim(), status: formDesignationStatus })
				}
			);
			const resData = await response.json();

			if (response.ok && resData.data) {
				designationsList = editingDesignation
					? designationsList.map((d) => (d.cuid2 === editingDesignation?.cuid2 ? resData.data : d))
					: [resData.data, ...designationsList];
				toast.success(editingDesignation ? 'Designation updated successfully' : 'Designation created successfully');
				isModalOpen = false;
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
			const response = await fetch(`/api/designations?cuid2=${itemToDelete.cuid2}`, {
				method: 'DELETE'
			});
			const resData = await response.json();

			if (response.ok && resData.data) {
				designationsList = designationsList.map((d) => (d.cuid2 === itemToDelete?.cuid2 ? resData.data : d));
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

<div class="mx-auto max-w-5xl space-y-8 px-1 py-4">
	<div class="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-1">
			<Badge variant="secondary" class="uppercase">HRMS Module</Badge>
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Designation Directory</h1>
			<p class="text-muted-foreground">
				Manage enterprise job titles used by employment records and reporting structures.
			</p>
		</div>
		<Button
			type="button"
			class="bg-[#C2652A] text-white hover:bg-[#8C3C3C]"
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
				<CardTitle class="text-4xl font-bold tabular-nums">{totalCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Active Designations</CardDescription>
				<CardTitle class="text-4xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{activeCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Inactive Designations</CardDescription>
				<CardTitle class="text-4xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{inactiveCount}</CardTitle>
			</CardHeader>
		</Card>
	</div>

	<div class="space-y-4">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<div class="relative flex-1">
				<SearchIcon class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input bind:value={searchQuery} class="pl-9" placeholder="Search by designation name or CUID2..." />
			</div>
			<FilterDropdown value={statusFilter} onChange={(value) => (statusFilter = value)} />
		</div>

		<Card>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>
							<Button variant="ghost" size="sm" class="-ml-2 h-8" onclick={() => handleSort('designation_name')}>
								Designation Name{sortIndicator('designation_name')}
							</Button>
						</TableHead>
						<TableHead class="w-28">
							<Button variant="ghost" size="sm" class="-ml-2 h-8" onclick={() => handleSort('status')}>
								Status{sortIndicator('status')}
							</Button>
						</TableHead>
						<TableHead class="w-24 text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if isLoading}
						<TableRow>
							<TableCell colspan={3} class="py-12 text-center text-muted-foreground">
								<LoaderCircleIcon class="mx-auto mb-2 size-6 animate-spin" />
								Loading designations...
							</TableCell>
						</TableRow>
					{:else if filteredDesignations.length === 0}
						<TableRow>
							<TableCell colspan={3} class="py-12 text-center text-muted-foreground">
								No designations match the criteria.
							</TableCell>
						</TableRow>
					{:else}
						{#each filteredDesignations as designation (designation.cuid2)}
							<TableRow>
								<TableCell>
									<div class="flex flex-col">
										<span class="font-semibold">{designation.designation_name}</span>
										<span class="mt-0.5 font-mono text-[10px] leading-none text-muted-foreground">{designation.cuid2}</span>
									</div>
								</TableCell>
								<TableCell>
									<Badge variant={designation.status === true ? 'default' : 'secondary'}>{designation.status ? 'Active' : 'Inactive'}</Badge>
								</TableCell>
								<TableCell class="text-right">
									<TableActions
										canEdit={true}
										canDelete={designation.status === true}
										editLabel="Edit designation"
										deleteLabel="Deactivate designation"
										onEdit={() => openEditModal(designation)}
										onDelete={() => (itemToDelete = designation)}
									/>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</Card>
		<p class="text-xs text-muted-foreground">
			Showing {filteredDesignations.length} of {totalCount} entries
		</p>
	</div>
</div>

<CrudModal
	open={isModalOpen}
	title={editingDesignation ? 'Edit Designation' : 'Create Designation'}
	description="Register a job title for assignment in employee employment records."
	onClose={() => (isModalOpen = false)}
>
	<form class="space-y-4" onsubmit={handleSaveDesignation}>
		<div class="space-y-2">
			<Label for="designation_name">Designation Name</Label>
			<Input
				id="designation_name"
				bind:value={formDesignationName}
				class={nameValidationError ? 'border-destructive' : ''}
				placeholder="e.g. Senior HR Manager"
				oninput={() => (isNameTouched = true)}
			/>
			{#if nameValidationError}
				<p class="text-xs text-destructive">{nameValidationError}</p>
			{/if}
		</div>
		{#if editingDesignation}
			<div class="space-y-2">
				<Label for="designation_status">Status</Label>
				<select id="designation_status" bind:value={formDesignationStatus} class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
					<option value={true}>Active</option>
					<option value={false}>Inactive</option>
				</select>
			</div>
		{/if}
		<Button type="submit" class="w-full bg-[#C2652A] text-white hover:bg-[#8C3C3C]" disabled={isSubmitting}>
			{isSubmitting ? 'Saving...' : (editingDesignation ? 'Save Designation' : 'Create Designation')}
		</Button>
	</form>
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
