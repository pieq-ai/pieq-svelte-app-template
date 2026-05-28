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
		FilterDropdown,
		StatusDropdown
	} from '$lib/components';

	interface Department {
		cuid2: string;
		dept_name: string;
		status: boolean;
	}

	let departmentsList = $state<Department[]>([]);
	let isLoading = $state(true);
	let loadError = $state('');

	let searchQuery = $state('');
	let statusFilter = $state<'all' | boolean>('all');
	let sortColumn = $state('dept_name');
	let sortDirection = $state<'asc' | 'desc'>('asc');

	// Shared Form State
	let editingDept = $state<Department | null>(null);
	let formDeptName = $state('');
	let formDeptStatus = $state<boolean>(true);
	let isSubmitting = $state(false);
	let isModalOpen = $state(false);
	let isNameTouched = $state(false);

	// Deletion State
	let itemToDelete = $state<Department | null>(null);
	let isDeleting = $state(false);

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

	let nameValidationError = $derived(isNameTouched ? getValidationError(formDeptName) : '');

	let filteredDepartments = $derived.by(() => {
		let result = [...departmentsList];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(dept) =>
					dept.dept_name.toLowerCase().includes(query) ||
					dept.cuid2.toLowerCase().includes(query)
			);
		}

		if (statusFilter !== 'all') {
			result = result.filter((dept) => dept.status === statusFilter);
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

	let totalCount = $derived(departmentsList.length);
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
		editingDept = null;
		formDeptName = '';
		formDeptStatus = true;
		isNameTouched = false;
		isModalOpen = true;
	}

	function openEditModal(dept: Department) {
		editingDept = dept;
		formDeptName = dept.dept_name;
		formDeptStatus = dept.status;
		isNameTouched = false;
		isModalOpen = true;
	}

	async function handleSaveDepartment(e: Event) {
		e.preventDefault();
		isNameTouched = true;

		const validationError = getValidationError(formDeptName);
		if (validationError) {
			toast.error(validationError);
			return;
		}

		isSubmitting = true;

		try {
			const response = await fetch(
				editingDept ? `/api/departments?cuid2=${editingDept.cuid2}` : '/api/departments',
				{
					method: editingDept ? 'PUT' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ dept_name: formDeptName.trim(), status: formDeptStatus })
				}
			);
			const resData = await response.json();

			if (response.ok && resData.data) {
				departmentsList = editingDept
					? departmentsList.map((d) => (d.cuid2 === editingDept?.cuid2 ? resData.data : d))
					: [resData.data, ...departmentsList];
				toast.success(editingDept ? 'Department updated successfully' : 'Department created successfully');
				isModalOpen = false;
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

	async function confirmDelete() {
		if (!itemToDelete) return;
		isDeleting = true;
		try {
			const response = await fetch(`/api/departments?cuid2=${itemToDelete.cuid2}`, {
				method: 'DELETE'
			});
			const resData = await response.json();

			if (response.ok && resData.data) {
				departmentsList = departmentsList.map((d) => (d.cuid2 === itemToDelete?.cuid2 ? resData.data : d));
				toast.success('Department deactivated successfully');
				itemToDelete = null;
			} else {
				toast.error(resData.error || 'Failed to deactivate department.');
			}
		} catch (err) {
			console.error(err);
			toast.error('An error occurred while deleting the department.');
		} finally {
			isDeleting = false;
		}
	}
</script>

<svelte:head>
	<title>HRMS Department Directory</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8 px-1 py-4">
	<div class="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-1">
			<Badge variant="secondary" class="uppercase">HRMS Module</Badge>
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Department Directory</h1>
			<p class="text-muted-foreground">
				Manage and configure enterprise organizational units, monitor status, and register new departments.
			</p>
		</div>
		<Button
			type="button"
			class="bg-[#C2652A] text-white hover:bg-[#8C3C3C]"
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
				<CardTitle class="text-4xl font-bold tabular-nums">{totalCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Active Departments</CardDescription>
				<CardTitle class="text-4xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{activeCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Inactive Departments</CardDescription>
				<CardTitle class="text-4xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{inactiveCount}</CardTitle>
			</CardHeader>
		</Card>
	</div>

	<div class="space-y-4">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<div class="relative flex-1">
				<SearchIcon class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input bind:value={searchQuery} class="pl-9" placeholder="Search by department name or CUID2..." />
			</div>
			<FilterDropdown value={statusFilter} onChange={(value) => (statusFilter = value)} />
		</div>

		<Card>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>
							<Button variant="ghost" size="sm" class="-ml-2 h-8" onclick={() => handleSort('dept_name')}>
								Department Name{sortIndicator('dept_name')}
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
								Loading departments...
							</TableCell>
						</TableRow>
					{:else if filteredDepartments.length === 0}
						<TableRow>
							<TableCell colspan={3} class="py-12 text-center text-muted-foreground">
								No departments match the criteria.
							</TableCell>
						</TableRow>
					{:else}
						{#each filteredDepartments as dept (dept.cuid2)}
							<TableRow>
								<TableCell>
									<div class="flex flex-col">
										<span class="font-semibold">{dept.dept_name}</span>
										<span class="mt-0.5 font-mono text-[10px] leading-none text-muted-foreground">{dept.cuid2}</span>
									</div>
								</TableCell>
								<TableCell>
									<Badge variant={dept.status === true ? 'default' : 'secondary'}>{dept.status ? 'Active' : 'Inactive'}</Badge>
								</TableCell>
								<TableCell class="text-right">
									<TableActions
										canEdit={true}
										canDelete={dept.status === true}
										editLabel="Edit department"
										deleteLabel="Deactivate department"
										onEdit={() => openEditModal(dept)}
										onDelete={() => (itemToDelete = dept)}
									/>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</Card>
		<p class="text-xs text-muted-foreground">
			Showing {filteredDepartments.length} of {totalCount} entries
		</p>
	</div>
</div>

<CrudModal
	open={isModalOpen}
	title={editingDept ? 'Edit Department' : 'Create Department'}
	description="Register a new organizational unit. Names must be unique and contain at least 2 characters."
	onClose={() => (isModalOpen = false)}
>
	<form class="space-y-4" onsubmit={handleSaveDepartment}>
		<div class="space-y-2">
			<Label for="dept_name">Department Name</Label>
			<Input
				id="dept_name"
				bind:value={formDeptName}
				class={nameValidationError ? 'border-destructive' : ''}
				placeholder="e.g. Finance"
				oninput={() => (isNameTouched = true)}
			/>
			{#if nameValidationError}
				<p class="text-xs text-destructive">{nameValidationError}</p>
			{/if}
		</div>
		{#if editingDept}
			<StatusDropdown value={formDeptStatus} onChange={(val) => (formDeptStatus = val)} />
		{/if}
		<Button type="submit" class="w-full bg-[#C2652A] text-white hover:bg-[#8C3C3C]" disabled={isSubmitting}>
			{isSubmitting ? 'Saving...' : (editingDept ? 'Save Department' : 'Create Department')}
		</Button>
	</form>
</CrudModal>

<ConfirmModal
	open={!!itemToDelete}
	title="Deactivate Department"
	description={`Are you sure you want to deactivate ${itemToDelete?.dept_name}?`}
	confirmLabel="Deactivate"
	isSubmitting={isDeleting}
	onCancel={() => (itemToDelete = null)}
	onConfirm={confirmDelete}
/>
