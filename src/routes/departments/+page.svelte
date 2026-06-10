<script lang="ts">
	import { onMount } from 'svelte';
	import { beforeNavigate, goto } from '$app/navigation';
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
		SearchInput,
		StatusBadge
	} from '$lib/components';

	interface Department {
		cuid: string;
		dept_name: string;
		status: boolean;
		updated_at: string;
	}

	let departmentsList = $state<Department[]>([]);
	let isLoading = $state(true);
	let loadError = $state('');

	let searchQuery = $state('');
	let statusFilter = $state<'all' | boolean>('all');
	let sortColumn = $state('dept_name');
	let sortDirection = $state<'asc' | 'desc' | null>(null);

	let currentPage = $state(1);
	let pageSize = $state(10);

	// Shared Form State
	let editingDept = $state<Department | null>(null);
	let formDeptName = $state('');
	let formDeptStatus = $state<boolean>(true);
	let isSubmitting = $state(false);
	let isModalOpen = $state(false);
	let errors = $state<Record<string, string>>({});
	let deptNameInput = $state<HTMLInputElement | null>(null);

	const dirtyChecker = createDirtyChecker<{ dept_name: string; status: boolean }>();
	let isDirty = $derived(isModalOpen && dirtyChecker.isDirty({ dept_name: formDeptName.trim(), status: formDeptStatus }));

	let isSubmitDisabled = $derived.by(() => {
		if (isSubmitting) return true;
		if (!formDeptName.trim()) return true;
		if (editingDept) {
			return !isDirty;
		}
		return false;
	});

	let isDiscardModalOpen = $state(false);
	let isNavigatingProgrammatically = $state(false);
	let pendingNavigation = $state<any>(null);

	function handleCloseRequest() {
		if (isDirty) {
			isDiscardModalOpen = true;
		} else {
			isModalOpen = false;
		}
	}

	function confirmDiscard() {
		isDiscardModalOpen = false;
		isModalOpen = false;
		formDeptName = '';
		formDeptStatus = true;
		errors = {};
		if (pendingNavigation) {
			isNavigatingProgrammatically = true;
			const target = pendingNavigation.to?.url;
			pendingNavigation = null;
			if (target) {
				goto(target.pathname + target.search);
			}
		}
	}

	beforeNavigate((navigation) => {
		if (!isModalOpen || !isDirty) {
			return;
		}

		if (isNavigatingProgrammatically) {
			return;
		}

		navigation.cancel();
		pendingNavigation = navigation;
		isDiscardModalOpen = true;
	});

	function getValidationError(name: string): string {
		const trimmed = name.trim();
		if (trimmed === '') {
			return 'Department name is required';
		}
		if (trimmed.length < 2) {
			return 'Minimum 2 characters required';
		}
		if (trimmed.length > 100) {
			return 'Maximum 100 characters allowed';
		}
		const regex = /^[A-Za-z\s]+$/;
		if (!regex.test(trimmed)) {
			return 'Only letters and spaces are allowed';
		}
		return '';
	}



	let filteredDepartments = $derived.by(() => {
		let result = [...departmentsList];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(dept) =>
					dept.dept_name.toLowerCase().includes(query)
			);
		}

		if (statusFilter !== 'all') {
			result = result.filter((dept) => dept.status === statusFilter);
		}

		if (sortDirection && sortColumn) {
			result.sort((a, b) => {
				const valA = a[sortColumn as keyof typeof a];
				const valB = b[sortColumn as keyof typeof b];

				return sortDirection === 'asc'
					? String(valA).localeCompare(String(valB))
					: String(valB).localeCompare(String(valA));
			});
		} else {
			result.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
		}

		return result;
	});

	let totalCount = $derived(departmentsList.length);
	let paginatedDepartments = $derived(filteredDepartments.slice((currentPage - 1) * pageSize, currentPage * pageSize));
	let activeCount = $derived(departmentsList.filter((d) => d.status === true).length);
	let inactiveCount = $derived(departmentsList.filter((d) => d.status === false).length);

	async function loadDepartments() {
		isLoading = true;
		loadError = '';
		try {
			const response = await fetch('/api/departments');
			const resData = await response.json();
			if (response.ok) {
				departmentsList = resData.data ?? [];
			} else {
				loadError = resData.error || 'Failed to load departments.';
				toast.error(loadError);
			}
		} catch (err) {
			loadError = 'An error occurred while loading departments.';
			toast.error(loadError);
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadDepartments();
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
		editingDept = null;
		formDeptName = '';
		formDeptStatus = true;
		errors = {};
		dirtyChecker.snapshot({ dept_name: '', status: true });
		isModalOpen = true;
	}

	function openEditModal(dept: Department) {
		editingDept = dept;
		formDeptName = dept.dept_name;
		formDeptStatus = dept.status;
		errors = {};
		dirtyChecker.snapshot({ dept_name: dept.dept_name, status: dept.status });
		isModalOpen = true;
	}

	async function handleSaveDepartment(e: Event) {
		e.preventDefault();
		if (editingDept && !isDirty) return;

		const validationError = getValidationError(formDeptName);
		if (validationError) {
			errors.dept_name = validationError;
			deptNameInput?.focus();
			return;
		}

		isSubmitting = true;
		errors = {};

		try {
			const response = await fetch(
				editingDept ? `/api/departments/${editingDept.cuid}` : '/api/departments',
				{
					method: editingDept ? 'PUT' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ dept_name: formDeptName.trim(), status: formDeptStatus })
				}
			);
			const resData = await response.json();

			if (response.ok && resData.data) {
				await loadDepartments();
				toast.success(editingDept ? 'Department updated successfully' : 'Department created successfully');
				isModalOpen = false;
			} else if (response.status === 409 && resData.field === 'dept_name') {
				errors.dept_name = resData.error;
				deptNameInput?.focus();
			} else {
				toast.error(resData.error || 'Failed to save department.');
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
	<title>Department </title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-0">
	<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl wrap-break-word">Department</h1>
		</div>
		<Button
			type="button"
			class="bg-[#F45310] text-white hover:bg-[#F45310]/90"
			onclick={openCreateModal}
		>
			<PlusIcon class="size-4" />
			Add Department
		</Button>
	</div>

	<!-- Metrics Cards -->
	<div class="grid gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Total Departments</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#262626] tabular-nums">{totalCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Active Departments</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#F45310] tabular-nums">{activeCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Inactive Departments</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#800020] tabular-nums">{inactiveCount}</CardTitle>
			</CardHeader>
		</Card>
	</div>

	<div class="space-y-3">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<SearchInput id="search_departments" name="search_departments" bind:value={searchQuery} oninput={() => (currentPage = 1)} placeholder="Search by department name..." />
			<FilterDropdown value={statusFilter} onChange={(value) => { statusFilter = value; currentPage = 1; }} />
		</div>

		<Card class="py-0">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8" onclick={() => handleSort('dept_name')}>
								Department Name
							{#if sortColumn === 'dept_name' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortColumn === 'dept_name' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead class="text-center">
							<Button variant="ghost" size="sm" class="h-8" onclick={() => handleSort('status')}>
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
						<TableHead class="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if isLoading}
						<TableRow>
							<TableCell colspan={3} class="py-8 text-center text-muted-foreground">
								<LoaderCircleIcon class="mx-auto mb-2 size-6 animate-spin" />
								Loading departments...
							</TableCell>
						</TableRow>
					{:else if filteredDepartments.length === 0}
						<TableRow>
							<TableCell colspan={3} class="py-8 text-center text-muted-foreground">
								{UI_CONSTANTS.EMPTY_STATE_MESSAGE}
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedDepartments as dept (dept.cuid)}
							<TableRow 
								onclick={(e) => {
									if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
									openEditModal(dept);
								}} 
								class="cursor-pointer"
							>
								<TableCell>
									<div class="flex flex-col">
										<span class="font-semibold">{dept.dept_name}</span>
									</div>
								</TableCell>
								<TableCell class="text-center">
									<StatusBadge status={dept.status} />
								</TableCell>
								<TableCell class="text-right">
									<TableActions
										canEdit={true}
										onEdit={() => openEditModal(dept)}
									/>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</Card>
		<Pagination bind:currentPage={currentPage} pageSize={pageSize} totalItems={filteredDepartments.length} />
	</div>
</div>

<CrudModal
	open={isModalOpen}
	title={editingDept ? 'Edit Department' : 'Create Department'}
	isDirty={isDirty}
	isSubmitting={isSubmitting}
	onClose={confirmDiscard}
>
	{#snippet children({ cancel })}
		<form class="flex flex-col min-h-0 flex-1 overflow-hidden" onsubmit={handleSaveDepartment}>
			<div class="flex-1 overflow-y-auto pr-1 space-y-4 modal-scroll-area">
			<div class="space-y-2">
				<Label for="dept_name" class={errors.dept_name ? 'text-danger' : ''}>Department Name <span class="text-destructive">*</span></Label>
				<Input
					id="dept_name"
					name="dept_name"
					bind:ref={deptNameInput}
					bind:value={formDeptName}
					class={errors.dept_name ? 'border-danger focus-visible:ring-danger/30' : ''}
					placeholder="e.g. Finance"
					oninput={() => { errors.dept_name = ''; }}
				/>
				{#if errors.dept_name}
					<p class="text-xs font-medium text-danger mt-1">{errors.dept_name}</p>
				{/if}
			</div>
			{#if editingDept}
				<StatusDropdown id="dept_status" name="dept_status" value={formDeptStatus} onChange={(val) => (formDeptStatus = val)} />
			{/if}
			</div>

			<div class="flex items-center justify-end gap-3 pt-6 flex-shrink-0">
				<Button type="button" variant="outline" onclick={cancel} disabled={isSubmitting}>{UI_CONSTANTS.BUTTON_CANCEL}</Button>
				<Button type="submit" class="bg-[#F45310] text-white hover:bg-[#F45310]/90" disabled={isSubmitDisabled}>
					{isSubmitting ? UI_CONSTANTS.BUTTON_SAVING : (editingDept ? UI_CONSTANTS.BUTTON_UPDATE : UI_CONSTANTS.BUTTON_SAVE)}
				</Button>
			</div>
		</form>
	{/snippet}
</CrudModal>

<ConfirmModal
	open={isDiscardModalOpen}
	title="Cancel Changes"
	description="Are you sure you want to cancel? All unsaved changes will be lost."
	confirmLabel="Keep Editing"
	onCancel={confirmDiscard}
	onConfirm={() => (isDiscardModalOpen = false)}
/>

