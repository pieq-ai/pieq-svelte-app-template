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
	import type { PageData } from './$types';

	interface Role {
		cuid: string;
		name: string;
		status: boolean;
	}

	let { data }: { data: PageData } = $props();

	let rolesList = $derived<Role[]>(data.roles);
	let isLoading = $state(false);
	let loadError = $state('');

	let searchQuery = $state('');
	let statusFilter = $state<'all' | boolean>('all');
	let sortColumn = $state('name');
	let sortDirection = $state<'asc' | 'desc' | null>(null);

	let currentPage = $state(1);
	let pageSize = $state(10);

	// Shared Form State
	let editingRole = $state<Role | null>(null);
	let isModalOpen = $state(false);

	// Deletion State
	let itemToDelete = $state<Role | null>(null);
	let isDeleting = $state(false);

	let filteredRoles = $derived.by(() => {
		let result = [...rolesList];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			result = result.filter((role) => role.name.toLowerCase().includes(query));
		}

		if (statusFilter !== 'all') {
			result = result.filter((role) => role.status === statusFilter);
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

	let totalCount = $derived(rolesList.length);
	let paginatedRoles = $derived(filteredRoles.slice((currentPage - 1) * pageSize, currentPage * pageSize));
	let activeCount = $derived(rolesList.filter((d) => d.status === true).length);
	let inactiveCount = $derived(rolesList.filter((d) => d.status === false).length);

	async function loadRoles() {
		isLoading = true;
		loadError = '';
		try {
			const res = await localApi.get<{ data: Role[] }>('/api/roles?includeInactive=true');
			rolesList = res.data ?? [];
		} catch (err) {
			loadError = err instanceof ApiError ? err.message : 'Failed to load roles.';
			toast.error(loadError);
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		// Initial load provided via SSR (+page.server.ts)
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
		editingRole = null;
		isModalOpen = true;
	}

	function openEditModal(role: Role) {
		editingRole = role;
		isModalOpen = true;
	}

	async function confirmDelete() {
		if (!itemToDelete) return;
		isDeleting = true;
		try {
			await localApi.delete(`/api/roles/${itemToDelete.cuid}`);
			await loadRoles();
			toast.success('Role deactivated successfully');
			itemToDelete = null;
		} catch (err) {
			console.error(err);
			toast.error(err instanceof ApiError ? err.message : 'Failed to deactivate role.');
		} finally {
			isDeleting = false;
		}
	}
</script>

<svelte:head>
	<title>HRMS Role</title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-0">
	<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl wrap-break-word">Role</h1>
		</div>
		<Button
			type="button"
			class="bg-[#F45310] text-white hover:bg-[#F45310]/90"
			onclick={openCreateModal}
		>
			Add Role
		</Button>
	</div>

	<!-- Metrics Cards -->
	<div class="grid gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Total Roles</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#262626] tabular-nums">{totalCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Active Roles</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#F45310] tabular-nums">{activeCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Inactive Roles</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#800020] tabular-nums">{inactiveCount}</CardTitle>
			</CardHeader>
		</Card>
	</div>

	<div class="space-y-3">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<SearchInput
				id="search_roles"
				name="search_roles"
				bind:value={searchQuery}
				oninput={() => (currentPage = 1)}
				placeholder="Search by role name..."
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
								Role Name
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
								Loading roles...
							</TableCell>
						</TableRow>
					{:else if filteredRoles.length === 0}
						<TableRow>
							<TableCell colspan={3} class="py-8 text-center text-muted-foreground">
								{UI_CONSTANTS.EMPTY_STATE_MESSAGE}
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedRoles as role (role.cuid)}
							<TableRow 
								onclick={(e) => {
									if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
									openEditModal(role);
								}} 
								class="cursor-pointer"
							>
								<TableCell>
									<div class="flex flex-col">
										<span class="font-semibold">{role.name}</span>
									</div>
								</TableCell>
								<TableCell class="text-center">
									<Badge variant={role.status === true ? 'default' : 'secondary'}>{role.status ? 'Active' : 'Inactive'}</Badge>
								</TableCell>
								<TableCell class="text-right">
									<TableActions
										canEdit={true}
										onEdit={() => openEditModal(role)}
										onDelete={() => { itemToDelete = role; }}
									/>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</Card>
		<Pagination bind:currentPage={currentPage} pageSize={pageSize} totalItems={filteredRoles.length} />
	</div>
</div>

<SimpleMasterModal
	bind:open={isModalOpen}
	entityName="Role"
	apiEndpoint="/api/roles"
	editingRecord={editingRole}
	onSuccess={() => {
		isModalOpen = false;
		loadRoles();
	}}
/>

<ConfirmModal
	open={!!itemToDelete}
	title="Deactivate Role"
	description={`Are you sure you want to deactivate ${itemToDelete?.name}?`}
	confirmLabel="Deactivate"
	isSubmitting={isDeleting}
	onCancel={() => (itemToDelete = null)}
	onConfirm={confirmDelete}
/>
