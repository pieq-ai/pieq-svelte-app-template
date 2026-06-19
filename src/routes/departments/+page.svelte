<script lang="ts">
	import { onMount } from 'svelte';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import { toast } from '$lib/toast';
	import { createDirtyChecker } from '$lib/utils';
	import { globalIsDirty } from '$lib/stores/navigationGuard';
	import { UI_CONSTANTS } from '$lib/constants';
	import { localApi, ApiError } from '$lib/api/local';

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
		TableActions,
		FilterDropdown,
		StatusDropdown,
		Pagination,
		SearchInput
	} from '$lib/components';
	import SimpleMasterModal from '$lib/components/common/SimpleMasterModal.svelte';

	interface Department {
		cuid: string;
		name: string;
		status: boolean;
	}

	let departmentsList = $state<Department[]>([]);
	let isLoading = $state(true);
	let loadError = $state('');

	let searchQuery = $state('');
	let statusFilter = $state<'all' | boolean>('all');
	let sortColumn = $state('name');
	let sortDirection = $state<'asc' | 'desc' | null>(null);

	let currentPage = $state(1);
	let pageSize = $state(10);

	// Shared Form State
	let editingDept = $state<Department | null>(null);
	let isModalOpen = $state(false);

	// Deletion State
	let itemToDelete = $state<Department | null>(null);
	let isDeleting = $state(false);

	let filteredDepartments = $derived.by(() => {
		let result = [...departmentsList];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			result = result.filter((dept) => dept.name.toLowerCase().includes(query));
		}

		if (statusFilter !== 'all') {
			result = result.filter((dept) => dept.status === statusFilter);
		}

		if (sortDirection && sortColumn) {
			result.sort((a, b) => {
				const valA = a[sortColumn as keyof typeof a];
				const valB = b[sortColumn as keyof typeof b];

				if (valA === null || valA === undefined) return sortDirection === 'asc' ? 1 : -1;
				if (valB === null || valB === undefined) return sortDirection === 'asc' ? -1 : 1;

				if (typeof valA === 'string' && typeof valB === 'string') {
					return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
				}
				if (typeof valA === 'boolean' && typeof valB === 'boolean') {
					const numA = valA ? 1 : 0;
					const numB = valB ? 1 : 0;
					return sortDirection === 'asc' ? numA - numB : numB - numA;
				}
				return 0;
			});
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
			const res = await localApi.get<{ data: Department[] }>('/api/departments');
			departmentsList = res.data ?? [];
		} catch (err) {
			loadError = err instanceof ApiError ? err.message : 'Failed to load departments.';
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
		isModalOpen = true;
	}

	function openEditModal(dept: Department) {
		editingDept = dept;
		isModalOpen = true;
	}

	async function confirmDelete() {
		if (!itemToDelete) return;
		isDeleting = true;
		try {
			await localApi.delete(`/api/departments/${itemToDelete.cuid}`);
			await loadDepartments();
			toast.success('Department deactivated successfully');
			itemToDelete = null;
		} catch (err) {
			console.error(err);
			toast.error(err instanceof ApiError ? err.message : 'Failed to deactivate department.');
		} finally {
			isDeleting = false;
		}
	}
</script>

<svelte:head>
	<title>HRMS Department</title>
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
			<SearchInput
				id="search_departments"
				name="search_departments"
				bind:value={searchQuery}
				oninput={() => (currentPage = 1)}
				placeholder="Search by department name..."
			/>
			<FilterDropdown
				value={statusFilter}
				onChange={(value) => {
					statusFilter = value;
					currentPage = 1;
				}}
			/>
		</div>

		<Card class="py-0">
			<Table>
				<TableHeader class="bg-muted">
					<TableRow>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('name')}>
								Department Name
							{#if sortColumn === 'name' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortColumn === 'name' && sortDirection === 'desc'}
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
										<span class="font-semibold">{dept.name}</span>
									</div>
								</TableCell>
								<TableCell class="text-center">
									<Badge variant={dept.status === true ? 'default' : 'secondary'}>{dept.status ? 'Active' : 'Inactive'}</Badge>
								</TableCell>
								<TableCell class="text-right">
									<TableActions
										canEdit={true}
										onEdit={() => openEditModal(dept)}
										onDelete={() => { itemToDelete = dept; }}
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

<SimpleMasterModal
	open={isModalOpen}
	entityName="Department"
	apiEndpoint="/api/departments"
	editingRecord={editingDept}
	onSuccess={() => {
		isModalOpen = false;
		loadDepartments();
	}}
/>

<ConfirmModal
	open={!!itemToDelete}
	title="Deactivate Department"
	description={`Are you sure you want to deactivate ${itemToDelete?.name}?`}
	confirmLabel="Deactivate"
	isSubmitting={isDeleting}
	onCancel={() => (itemToDelete = null)}
	onConfirm={confirmDelete}
/>
