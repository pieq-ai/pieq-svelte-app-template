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

	interface Permission {
		cuid: string;
		permission_key: string;
		status: boolean;
	}

	const masterPermissions = getMasterPermissions();
	let permissions = $state<Permission[]>([]);
	let isLoading = $state(true);
	let loadError = $state('');
	let searchQuery = $state('');
	let statusFilter = $state<'all' | boolean>('all');
	
	let sortColumn = $state('permission_key');
	let sortDirection = $state<'asc' | 'desc' | null>(null);

	let currentPage = $state(1);
	let pageSize = $state(10);
	
	let isModalOpen = $state(false);
	let isSubmitting = $state(false);
	let editingPermission = $state<Permission | null>(null);
	let permissionKey = $state('');
	let permissionStatus = $state<boolean>(true);
	let isKeyTouched = $state(false);

	const dirtyChecker = createDirtyChecker<{ permission_key: string; status: boolean }>();
	let isDirty = $derived(dirtyChecker.isDirty({ permission_key: permissionKey.trim(), status: permissionStatus }));

	let itemToDelete = $state<Permission | null>(null);
	let isDeleting = $state(false);

	function getValidationError(key: string) {
		const normalized = key.trim().toLowerCase();
		if (!normalized) return 'Permission key is required';
		if (normalized.length < 3) return 'Minimum 3 characters required';
		if (!/^[a-z][a-z0-9_]*$/.test(normalized)) return 'Use lowercase snake_case';
		return '';
	}

	let keyValidationError = $derived(isKeyTouched ? getValidationError(permissionKey) : '');
	let filteredPermissions = $derived.by(() => {
		let result = [...permissions];
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter((permission) => permission.permission_key.toLowerCase().includes(query));
		}
		if (statusFilter !== 'all') {
			result = result.filter((permission) => permission.status === statusFilter);
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

	let paginatedPermissions = $derived(filteredPermissions.slice((currentPage - 1) * pageSize, currentPage * pageSize));

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

	

	async function loadPermissions() {
		isLoading = true;
		loadError = '';
		try {
			const response = await fetch('/api/permissions');
			const body = await response.json();
			if (response.ok) {
				permissions = body.data ?? [];
			} else {
				loadError = body.error || 'Failed to load permissions.';
				toast.error(loadError);
			}
		} catch (err) {
			loadError = 'An error occurred while loading permissions.';
			toast.error(loadError);
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	onMount(loadPermissions);

	function openCreateModal() {
		editingPermission = null;
		permissionKey = '';
		permissionStatus = true;
		isKeyTouched = false;
		dirtyChecker.snapshot({ permission_key: '', status: true });
		isModalOpen = true;
	}

	function openEditModal(permission: Permission) {
		editingPermission = permission;
		permissionKey = permission.permission_key;
		permissionStatus = permission.status;
		isKeyTouched = false;
		dirtyChecker.snapshot({ permission_key: permission.permission_key, status: permission.status });
		isModalOpen = true;
	}

	async function savePermission(event: Event) {
		event.preventDefault();
		if (editingPermission && !isDirty) return;
		isKeyTouched = true;
		const validationError = getValidationError(permissionKey);
		if (validationError) {
			toast.error(validationError);
			return;
		}

		isSubmitting = true;
		try {
			const response = await fetch(
				editingPermission
					? `/api/permissions?cuid=${editingPermission.cuid}`
					: '/api/permissions',
				{
					method: editingPermission ? 'PUT' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ permission_key: permissionKey.trim(), status: permissionStatus })
				}
			);
			const body = await response.json();
			if (response.ok) {
				await loadPermissions();
				toast.success(editingPermission ? 'Permission updated successfully.' : 'Permission created successfully.');
				isModalOpen = false;
			} else {
				toast.error(body.error || 'Unable to save permission.');
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
			const response = await fetch(`/api/permissions?cuid=${itemToDelete.cuid}`, { method: 'DELETE' });
			const body = await response.json();
			if (response.ok) {
				await loadPermissions();
				toast.success('Permission deactivated successfully.');
				itemToDelete = null;
			} else {
				toast.error(body.error || 'Unable to deactivate permission.');
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
	<title>Permissions</title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-0">
	<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-1">
			<Badge variant="secondary" class="uppercase">RBAC Foundation</Badge>
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Permissions</h1>
			<p class="text-muted-foreground">Manage permission keys for future role-based authorization.</p>
		</div>
		{#if masterPermissions.canCreate}
			<Button class="bg-[#C2652A] text-white hover:bg-[#8C3C3C]" onclick={openCreateModal}>
				<PlusIcon class="size-4" />
				Add Permission
			</Button>
		{/if}
	</div>

	{#if loadError}
		<Alert variant="destructive"><AlertDescription>{loadError}</AlertDescription></Alert>
	{/if}

	<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
		<SearchInput bind:value={searchQuery} oninput={() => (currentPage = 1)} placeholder="Search permissions..." />
		<FilterDropdown value={statusFilter} onChange={(value) => { statusFilter = value; currentPage = 1; }} />
	</div>

	<Card class="py-0">
			<Table>
			<TableHeader class="bg-muted">
				<TableRow>
					<TableHead class="font-bold text-foreground text-[15px]">
						<Button variant="ghost" size="sm" class="-ml-2 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('permission_key')}>
							Permission Key
							{#if sortColumn === 'permission_key' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortColumn === 'permission_key' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
						</Button>
					</TableHead>
					<TableHead class="w-28 text-center font-bold text-foreground text-[15px]">
						<Button variant="ghost" size="sm" class="-ml-2 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('status')}>
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
				{:else if filteredPermissions.length === 0}
					<TableRow><TableCell colspan={3} class="py-8 text-center text-muted-foreground">No permissions found.</TableCell></TableRow>
				{:else}
					{#each paginatedPermissions as permission (permission.cuid)}
						<TableRow>
							<TableCell class="font-mono text-sm font-semibold">{permission.permission_key}</TableCell>
							<TableCell class="text-center"><Badge variant={permission.status === true ? 'default' : 'secondary'}>{permission.status ? 'Active' : 'Inactive'}</Badge></TableCell>
							<TableCell class="text-right">
								<TableActions
									canEdit={masterPermissions.canEdit}
									onEdit={() => openEditModal(permission)}
								/>
							</TableCell>
						</TableRow>
					{/each}
				{/if}
			</TableBody>
		</Table>
	</Card>

	<Pagination bind:currentPage={currentPage} pageSize={pageSize} totalItems={filteredPermissions.length} />
</div>

<CrudModal
	open={isModalOpen}
	title={editingPermission ? 'Edit Permission' : 'Create Permission'}
	description="Permission keys should use lowercase snake_case, such as employee_view."
	isDirty={isDirty}
	onClose={() => (isModalOpen = false)}
>
	<form class="space-y-3" onsubmit={savePermission}>
		<div class="space-y-2">
			<Label for="permission_key">Permission Key</Label>
			<Input
				id="permission_key"
				bind:value={permissionKey}
				class={keyValidationError ? 'border-destructive' : ''}
				placeholder="employee_view"
				oninput={() => (isKeyTouched = true)}
			/>
			{#if keyValidationError}
				<p class="text-xs text-destructive">{keyValidationError}</p>
			{/if}
		</div>
		{#if editingPermission}
			<StatusDropdown value={permissionStatus} onChange={(val) => (permissionStatus = val)} />
		{/if}
		<Button type="submit" class="w-full bg-[#C2652A] text-white hover:bg-[#8C3C3C]" disabled={isSubmitting || (!!editingPermission && !isDirty)}>
			{isSubmitting ? 'Saving...' : (editingPermission ? 'Save Permission' : 'Create Permission')}
		</Button>
	</form>
</CrudModal>

<ConfirmModal
	open={!!itemToDelete}
	title="Deactivate Permission"
	description={`Are you sure you want to deactivate ${itemToDelete?.permission_key}?`}
	confirmLabel="Deactivate"
	isSubmitting={isDeleting}
	onCancel={() => (itemToDelete = null)}
	onConfirm={confirmDelete}
/>
