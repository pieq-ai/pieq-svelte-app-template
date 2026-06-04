<script lang="ts">
	import { onMount } from 'svelte';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import PlusIcon from '@lucide/svelte/icons/plus';

	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import { toast } from '$lib/toast';
	import { createDirtyChecker } from '$lib/utils';
	import {
		Alert,
		AlertDescription,
		Badge,
		Button,
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CrudModal,
		ConfirmModal,
		FilterDropdown,
		Input,
		Label,
		Table,
		TableActions,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
		StatusDropdown,
		Pagination,
		SearchInput
	} from '$lib/components';
	import { getMasterPermissions } from '$lib/permissions/mock-permissions';

	interface SystemRole {
		cuid: string;
		system_role_name: string;
		status: boolean;
	}

	const permissions = getMasterPermissions();
	let roles = $state<SystemRole[]>([]);
	let isLoading = $state(true);
	let loadError = $state('');

	let totalCount = $derived(roles.length);
	let activeCount = $derived(roles.filter((r) => r.status === true).length);
	let inactiveCount = $derived(roles.filter((r) => r.status === false).length);

	let searchQuery = $state('');
	let statusFilter = $state<'all' | boolean>('all');
	
	let sortColumn = $state('system_role_name');
	let sortDirection = $state<'asc' | 'desc' | null>(null);

	let currentPage = $state(1);
	let pageSize = $state(10);
	
	let isModalOpen = $state(false);
	let isSubmitting = $state(false);
	let editingRole = $state<SystemRole | null>(null);
	let roleName = $state('');
	let roleStatus = $state<boolean>(true);
	let isNameTouched = $state(false);
	let backendError = $state('');
	let roleNameInput = $state<HTMLInputElement | null>(null);

	const dirtyChecker = createDirtyChecker<{ system_role_name: string; status: boolean }>();
	let isDirty = $derived(dirtyChecker.isDirty({ system_role_name: roleName.trim(), status: roleStatus }));

	let itemToDelete = $state<SystemRole | null>(null);
	let isDeleting = $state(false);

	function getValidationError(name: string) {
		const trimmed = name.trim();
		if (!trimmed) return 'Role name is required';
		if (trimmed.length < 2) return 'Minimum 2 characters required';
		if (!/^[A-Za-z ]+$/.test(trimmed)) return 'Only letters and spaces are allowed';
		return '';
	}

	let nameValidationError = $derived(isNameTouched ? getValidationError(roleName) : '');
	let filteredRoles = $derived.by(() => {
		let result = [...roles];
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter((role) => role.system_role_name.toLowerCase().includes(query));
		}
		if (statusFilter !== 'all') {
			result = result.filter((role) => role.status === statusFilter);
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

	let paginatedRoles = $derived(filteredRoles.slice((currentPage - 1) * pageSize, currentPage * pageSize));

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

	

	async function loadRoles() {
		isLoading = true;
		loadError = '';
		try {
			const response = await fetch('/api/system-roles');
			const body = await response.json();
			if (response.ok) {
				roles = body.data ?? [];
			} else {
				loadError = body.error || 'Failed to load system roles.';
				toast.error(loadError);
			}
		} catch (err) {
			loadError = 'An error occurred while loading system roles.';
			toast.error(loadError);
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	onMount(loadRoles);

	function openCreateModal() {
		editingRole = null;
		roleName = '';
		roleStatus = true;
		isNameTouched = false;
		backendError = '';
		dirtyChecker.snapshot({ system_role_name: '', status: true });
		isModalOpen = true;
	}

	function openEditModal(role: SystemRole) {
		editingRole = role;
		roleName = role.system_role_name;
		roleStatus = role.status;
		isNameTouched = false;
		backendError = '';
		dirtyChecker.snapshot({ system_role_name: role.system_role_name, status: role.status });
		isModalOpen = true;
	}

	async function saveRole(event: Event) {
		event.preventDefault();
		if (editingRole && !isDirty) return;
		isNameTouched = true;
		const validationError = getValidationError(roleName);
		if (validationError) {
			toast.error(validationError);
			return;
		}

		isSubmitting = true;
		try {
			const response = await fetch(
				editingRole ? `/api/system-roles/systemRoleCuid=${editingRole.cuid}` : '/api/system-roles',
				{
					method: editingRole ? 'PUT' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ system_role_name: roleName.trim(), status: roleStatus })
				}
			);
			const body = await response.json();
			if (response.ok) {
				await loadRoles();
				toast.success(editingRole ? 'System role updated successfully.' : 'System role created successfully.');
				isModalOpen = false;
			} else if (response.status === 409 && body.field === 'system_role_name') {
				backendError = body.error;
				roleNameInput?.focus();
			} else {
				toast.error(body.error || 'Unable to save system role.');
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
			const response = await fetch(`/api/system-roles/systemRoleCuid=${itemToDelete.cuid}`, { method: 'DELETE' });
			const body = await response.json();
			if (response.ok) {
				await loadRoles();
				toast.success('System role deactivated successfully.');
				itemToDelete = null;
			} else {
				toast.error(body.error || 'Unable to deactivate system role.');
			}
		} catch (err) {
			toast.error('An error occurred. Please try again.');
			console.error(err);
		} finally {
			isDeleting = false;
		}
	}
</script>

<svelte:head>
	<title>System Roles</title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-0">
	<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">System Roles</h1>
		</div>
		{#if permissions.canCreate}
			<Button class="bg-[#F45310] text-white hover:bg-[#F45310]/90" onclick={openCreateModal}>
				<PlusIcon class="size-4" />
				Add Role
			</Button>
		{/if}
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

	{#if loadError}
		<Alert variant="destructive"><AlertDescription>{loadError}</AlertDescription></Alert>
	{/if}

	<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
		<SearchInput bind:value={searchQuery} oninput={() => (currentPage = 1)} placeholder="Search roles..." />
		<FilterDropdown value={statusFilter} onChange={(value) => { statusFilter = value; currentPage = 1; }} />
	</div>

	<Card class="py-0">
			<Table>
			<TableHeader class="bg-muted">
				<TableRow>
					<TableHead class="font-bold text-foreground text-[15px]">
						<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('system_role_name')}>
							Role Name
							{#if sortColumn === 'system_role_name' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortColumn === 'system_role_name' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
						</Button>
					</TableHead>
					<TableHead class="w-28 text-center font-bold text-foreground text-[15px]">
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
					<TableHead class="w-24 text-right font-bold text-foreground text-[15px]">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#if isLoading}
					<TableRow><TableCell colspan={3} class="py-8 text-center"><LoaderCircleIcon class="mx-auto size-6 animate-spin" /></TableCell></TableRow>
				{:else if filteredRoles.length === 0}
					<TableRow><TableCell colspan={3} class="py-8 text-center text-muted-foreground">No roles found.</TableCell></TableRow>
				{:else}
					{#each paginatedRoles as role (role.cuid)}
						<TableRow>
							<TableCell class="font-semibold">{role.system_role_name}</TableCell>
							<TableCell class="text-center"><Badge variant={role.status === true ? 'default' : 'secondary'}>{role.status ? 'Active' : 'Inactive'}</Badge></TableCell>
							<TableCell class="text-right">
								<TableActions
									canEdit={permissions.canEdit}
									onEdit={() => openEditModal(role)}
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

<CrudModal
	open={isModalOpen}
	title={editingRole ? 'Edit System Role' : 'Create System Role'}
	description="Role names must be unique and contain only letters and spaces."
	isDirty={isDirty}
	onClose={() => (isModalOpen = false)}
>
	<form class="space-y-3" onsubmit={saveRole}>
		<div class="space-y-2">
			<Label for="system_role_name">Role Name</Label>
			<Input
				id="system_role_name"
				bind:ref={roleNameInput}
				bind:value={roleName}
				class={nameValidationError || backendError ? 'border-destructive' : ''}
				placeholder="e.g. HR Manager"
				oninput={() => { isNameTouched = true; backendError = ''; }}
			/>
			{#if nameValidationError || backendError}
				<p class="text-xs text-destructive">{nameValidationError || backendError}</p>
			{/if}
		</div>
		{#if editingRole}
			<StatusDropdown value={roleStatus} onChange={(val) => (roleStatus = val)} />
		{/if}
		<Button type="submit" class="w-full bg-[#F45310] text-white hover:bg-[#F45310]/90" disabled={isSubmitting || (!!editingRole && !isDirty)}>
			{isSubmitting ? 'Saving...' : (editingRole ? 'Save Role' : 'Create Role')}
		</Button>
	</form>
</CrudModal>

<ConfirmModal
	open={!!itemToDelete}
	title="Deactivate System Role"
	description={`Are you sure you want to deactivate ${itemToDelete?.system_role_name}?`}
	confirmLabel="Deactivate"
	isSubmitting={isDeleting}
	onCancel={() => (itemToDelete = null)}
	onConfirm={confirmDelete}
/>
