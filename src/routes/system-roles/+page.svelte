<script lang="ts">
	import { onMount } from 'svelte';
	import { beforeNavigate, goto } from '$app/navigation';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import PlusIcon from '@lucide/svelte/icons/plus';

	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import { toast } from '$lib/toast';
	import { createDirtyChecker } from '$lib/utils';
	import { UI_CONSTANTS } from '$lib/constants';
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
		SearchInput,
		StatusBadge
	} from '$lib/components';
	import { getMasterPermissions } from '$lib/permissions/mock-permissions';

	interface SystemRole {
		cuid: string;
		system_role_name: string;
		status: boolean;
		updated_at: string;
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
	
	let sortColumn = $state<string | null>(null);
	let sortDirection = $state<'asc' | 'desc' | null>(null);

	let currentPage = $state(1);
	let pageSize = $state(10);
	
	let isModalOpen = $state(false);
	let isSubmitting = $state(false);
	let editingRole = $state<SystemRole | null>(null);
	let roleName = $state('');
	let roleStatus = $state<boolean>(true);
	let errors = $state<Record<string, string>>({});
	let roleNameInput = $state<HTMLInputElement | null>(null);

	const dirtyChecker = createDirtyChecker<{ system_role_name: string; status: boolean }>();
	let isDirty = $derived(isModalOpen && dirtyChecker.isDirty({ system_role_name: roleName.trim(), status: roleStatus }));

	let isSubmitDisabled = $derived.by(() => {
		if (isSubmitting) return true;
		if (!roleName.trim()) return true;
		if (editingRole) {
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
		roleName = '';
		roleStatus = true;
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

	let itemToDelete = $state<SystemRole | null>(null);
	let isDeleting = $state(false);

	function getValidationError(name: string) {
		const trimmed = name.trim();
		if (!trimmed) return 'Role name is required';
		if (trimmed.length < 2) return 'Minimum 2 characters required';
		if (!/^[A-Za-z ]+$/.test(trimmed)) return 'Only letters and spaces are allowed';
		return '';
	}


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
		} else {
			result.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
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
		errors = {};
		dirtyChecker.snapshot({ system_role_name: '', status: true });
		isModalOpen = true;
	}

	function openEditModal(role: SystemRole) {
		editingRole = role;
		roleName = role.system_role_name;
		roleStatus = role.status;
		errors = {};
		dirtyChecker.snapshot({ system_role_name: role.system_role_name, status: role.status });
		isModalOpen = true;
	}

	async function saveRole(event: Event) {
		event.preventDefault();
		if (editingRole && !isDirty) return;
		
		const validationError = getValidationError(roleName);
		if (validationError) {
			errors.system_role_name = validationError;
			roleNameInput?.focus();
			return;
		}

		isSubmitting = true;
		errors = {};
		try {
			const response = await fetch(
				editingRole ? `/api/system-roles/${editingRole.cuid}` : '/api/system-roles',
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
			} else {
				errors.system_role_name = body.error || 'Unable to save system role.';
				roleNameInput?.focus();
			}
		} catch (err) {
			errors.system_role_name = 'An error occurred. Please try again.';
			console.error(err);
		} finally {
			isSubmitting = false;
		}
	}

	async function confirmDelete() {
		if (!itemToDelete) return;
		isDeleting = true;
		try {
			const response = await fetch(`/api/system-roles/${itemToDelete.cuid}`, { method: 'DELETE' });
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
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl wrap-break-word">System Roles</h1>
		</div>
		{#if permissions.canCreate}
			<Button class="bg-[#F45310] text-white hover:bg-[#F45310]/90" onclick={openCreateModal}>
				<PlusIcon class="size-4" />
				Add System Role
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
		<SearchInput id="search_roles" name="search_roles" bind:value={searchQuery} oninput={() => (currentPage = 1)} placeholder="Search roles..." />
		<FilterDropdown value={statusFilter} onChange={(value) => { statusFilter = value; currentPage = 1; }} />
	</div>

	<Card>
			<Table>
			<TableHeader>
				<TableRow>
					<TableHead>
						<Button variant="ghost" size="sm" class="-ml-2.5 h-8" onclick={() => handleSort('system_role_name')}>
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
					<TableHead class="w-24 text-center">
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
					<TableRow><TableCell colspan={3} class="py-8 text-center text-muted-foreground"><LoaderCircleIcon class="mx-auto mb-2 size-6 animate-spin" />Loading roles...</TableCell></TableRow>
				{:else if filteredRoles.length === 0}
					<TableRow><TableCell colspan={3} class="py-8 text-center text-muted-foreground">{UI_CONSTANTS.EMPTY_STATE_MESSAGE}</TableCell></TableRow>
				{:else}
					{#each paginatedRoles as role (role.cuid)}
						<TableRow 
							onclick={(e) => {
								if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
								openEditModal(role);
							}} 
							class="cursor-pointer"
						>
							<TableCell class="font-normal">
								<div>{role.system_role_name}</div>
							</TableCell>
							<TableCell class="text-center"><StatusBadge status={role.status} /></TableCell>
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
	isDirty={isDirty}
	isSubmitting={isSubmitting}
	onClose={confirmDiscard}
>
	{#snippet children({ cancel })}
		<form class="flex flex-col min-h-0 flex-1 overflow-hidden" onsubmit={saveRole}>
			<div class="flex-1 overflow-y-auto pr-1 space-y-4 modal-scroll-area">
			<div class="space-y-2">
				<Label for="role_name" class={errors.system_role_name ? 'text-danger' : ''}>Role Name <span class="text-destructive">*</span></Label>
				<Input
					id="role_name"
					name="role_name"
					bind:ref={roleNameInput}
					bind:value={roleName}
					class={errors.system_role_name ? 'border-danger focus-visible:ring-danger/30' : ''}
					placeholder="e.g. HR Manager"
					oninput={() => { errors.system_role_name = ''; }}
				/>
				{#if errors.system_role_name}
					<p class="text-xs font-medium text-danger mt-1">{errors.system_role_name}</p>
				{/if}
			</div>
			<StatusDropdown id="role_status" name="role_status" value={roleStatus} onChange={(val) => (roleStatus = val)} />
			</div>

			<div class="flex items-center justify-end gap-3 pt-6 flex-shrink-0">
				<Button type="button" variant="outline" onclick={cancel} disabled={isSubmitting}>{UI_CONSTANTS.BUTTON_CANCEL}</Button>
				<Button type="submit" class="bg-[#F45310] text-white hover:bg-[#F45310]/90" disabled={isSubmitDisabled}>
					{isSubmitting ? UI_CONSTANTS.BUTTON_SAVING : (editingRole ? UI_CONSTANTS.BUTTON_UPDATE : UI_CONSTANTS.BUTTON_SAVE)}
				</Button>
			</div>
		</form>
	{/snippet}
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

<ConfirmModal
	open={isDiscardModalOpen}
	title="Cancel Changes"
	description="Are you sure you want to cancel? All unsaved changes will be lost."
	confirmLabel="Keep Editing"
	onCancel={confirmDiscard}
	onConfirm={() => (isDiscardModalOpen = false)}
/>
