<script lang="ts">
	import { onMount } from 'svelte';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SearchIcon from '@lucide/svelte/icons/search';
	import { toast } from '$lib/toast';
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
		TableRow
	} from '$lib/components';
	import { getMasterPermissions } from '$lib/permissions/mock-permissions';

	interface SystemRole {
		cuid2: string;
		system_role_name: string;
		status: 'active' | 'inactive';
	}

	const permissions = getMasterPermissions();
	let roles = $state<SystemRole[]>([]);
	let isLoading = $state(true);
	let loadError = $state('');
	let searchQuery = $state('');
	let statusFilter = $state<'all' | 'active' | 'inactive'>('all');
	
	let isModalOpen = $state(false);
	let isSubmitting = $state(false);
	let editingRole = $state<SystemRole | null>(null);
	let roleName = $state('');
	let roleStatus = $state<'active' | 'inactive'>('active');
	let isNameTouched = $state(false);

	let itemToDelete = $state<SystemRole | null>(null);
	let isDeleting = $state(false);

	function getValidationError(name: string) {
		const trimmed = name.trim();
		if (!trimmed) return 'Role name is required';
		if (trimmed.length < 2) return 'Minimum 2 characters required';
		if (!/^[A-Za-z0-9 ]+$/.test(trimmed)) return 'Only letters, numbers, and spaces are allowed';
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
		return result;
	});

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
		roleStatus = 'active';
		isNameTouched = false;
		isModalOpen = true;
	}

	function openEditModal(role: SystemRole) {
		editingRole = role;
		roleName = role.system_role_name;
		roleStatus = role.status;
		isNameTouched = false;
		isModalOpen = true;
	}

	async function saveRole(event: Event) {
		event.preventDefault();
		isNameTouched = true;
		const validationError = getValidationError(roleName);
		if (validationError) {
			toast.error(validationError);
			return;
		}

		isSubmitting = true;
		try {
			const response = await fetch(
				editingRole ? `/api/system-roles?cuid2=${editingRole.cuid2}` : '/api/system-roles',
				{
					method: editingRole ? 'PUT' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ system_role_name: roleName.trim(), status: roleStatus })
				}
			);
			const body = await response.json();
			if (response.ok) {
				roles = editingRole
					? roles.map((role) => (role.cuid2 === editingRole?.cuid2 ? body.data : role))
					: [body.data, ...roles];
				toast.success(editingRole ? 'System role updated successfully.' : 'System role created successfully.');
				isModalOpen = false;
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
			const response = await fetch(`/api/system-roles?cuid2=${itemToDelete.cuid2}`, { method: 'DELETE' });
			const body = await response.json();
			if (response.ok) {
				roles = roles.map((item) => (item.cuid2 === itemToDelete?.cuid2 ? body.data : item));
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

<div class="mx-auto max-w-5xl space-y-8 px-1 py-4">
	<div class="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-1">
			<Badge variant="secondary" class="uppercase">RBAC Foundation</Badge>
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">System Roles</h1>
			<p class="text-muted-foreground">Manage application roles used for future authorization mapping.</p>
		</div>
		{#if permissions.canCreate}
			<Button class="bg-[#C2652A] text-white hover:bg-[#8C3C3C]" onclick={openCreateModal}>
				<PlusIcon class="size-4" />
				Add Role
			</Button>
		{/if}
	</div>

	{#if loadError}
		<Alert variant="destructive"><AlertDescription>{loadError}</AlertDescription></Alert>
	{/if}

	<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
		<div class="relative flex-1">
			<SearchIcon class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input bind:value={searchQuery} class="pl-9" placeholder="Search roles..." />
		</div>
		<FilterDropdown value={statusFilter} onChange={(value) => (statusFilter = value)} />
	</div>

	<Card>
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Role Name</TableHead>
					<TableHead class="w-28">Status</TableHead>
					<TableHead class="w-24 text-right">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#if isLoading}
					<TableRow><TableCell colspan={3} class="py-12 text-center"><LoaderCircleIcon class="mx-auto size-6 animate-spin" /></TableCell></TableRow>
				{:else if filteredRoles.length === 0}
					<TableRow><TableCell colspan={3} class="py-12 text-center text-muted-foreground">No roles found.</TableCell></TableRow>
				{:else}
					{#each filteredRoles as role (role.cuid2)}
						<TableRow>
							<TableCell class="font-semibold">{role.system_role_name}</TableCell>
							<TableCell><Badge variant={role.status === 'active' ? 'default' : 'secondary'}>{role.status}</Badge></TableCell>
							<TableCell class="text-right">
								<TableActions
									canEdit={permissions.canEdit}
									canDelete={permissions.canDelete && role.status === 'active'}
									editLabel="Edit role"
									deleteLabel="Deactivate role"
									onEdit={() => openEditModal(role)}
									onDelete={() => (itemToDelete = role)}
								/>
							</TableCell>
						</TableRow>
					{/each}
				{/if}
			</TableBody>
		</Table>
	</Card>
</div>

<CrudModal
	open={isModalOpen}
	title={editingRole ? 'Edit System Role' : 'Create System Role'}
	description="Role names must be unique and contain only letters, numbers, and spaces."
	onClose={() => (isModalOpen = false)}
>
	<form class="space-y-4" onsubmit={saveRole}>
		<div class="space-y-2">
			<Label for="system_role_name">Role Name</Label>
			<Input
				id="system_role_name"
				bind:value={roleName}
				class={nameValidationError ? 'border-destructive' : ''}
				placeholder="e.g. HR Manager"
				oninput={() => (isNameTouched = true)}
			/>
			{#if nameValidationError}
				<p class="text-xs text-destructive">{nameValidationError}</p>
			{/if}
		</div>
		{#if editingRole}
			<div class="space-y-2">
				<Label for="role_status">Status</Label>
				<select id="role_status" bind:value={roleStatus} class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
					<option value="active">Active</option>
					<option value="inactive">Inactive</option>
				</select>
			</div>
		{/if}
		<Button type="submit" class="w-full bg-[#C2652A] text-white hover:bg-[#8C3C3C]" disabled={isSubmitting}>
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
