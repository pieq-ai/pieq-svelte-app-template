<script lang="ts">
	import { onMount } from 'svelte';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SearchIcon from '@lucide/svelte/icons/search';
	import {
		Alert,
		AlertDescription,
		Badge,
		Button,
		Card,
		CrudModal,
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

	interface Permission {
		permission_id: number;
		permission_key: string;
		status: 'active' | 'inactive';
	}

	const masterPermissions = getMasterPermissions();
	let permissions = $state<Permission[]>([]);
	let isLoading = $state(true);
	let loadError = $state('');
	let formError = $state('');
	let successMessage = $state('');
	let searchQuery = $state('');
	let statusFilter = $state<'all' | 'active' | 'inactive'>('all');
	let isModalOpen = $state(false);
	let isSubmitting = $state(false);
	let editingPermission = $state<Permission | null>(null);
	let permissionKey = $state('');
	let permissionStatus = $state<'active' | 'inactive'>('active');
	let isKeyTouched = $state(false);

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
		return result;
	});

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
			}
		} finally {
			isLoading = false;
		}
	}

	onMount(loadPermissions);

	function openCreateModal() {
		editingPermission = null;
		permissionKey = '';
		permissionStatus = 'active';
		formError = '';
		isKeyTouched = false;
		isModalOpen = true;
	}

	function openEditModal(permission: Permission) {
		editingPermission = permission;
		permissionKey = permission.permission_key;
		permissionStatus = permission.status;
		formError = '';
		isKeyTouched = false;
		isModalOpen = true;
	}

	async function savePermission(event: Event) {
		event.preventDefault();
		isKeyTouched = true;
		const validationError = getValidationError(permissionKey);
		if (validationError) {
			formError = validationError;
			return;
		}

		isSubmitting = true;
		formError = '';
		try {
			const response = await fetch(
				editingPermission
					? `/api/permissions?id=${editingPermission.permission_id}`
					: '/api/permissions',
				{
					method: editingPermission ? 'PUT' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ permission_key: permissionKey.trim(), status: permissionStatus })
				}
			);
			const body = await response.json();
			if (response.ok) {
				permissions = editingPermission
					? permissions.map((permission) =>
							permission.permission_id === editingPermission?.permission_id ? body.data : permission
						)
					: [body.data, ...permissions];
				successMessage = editingPermission ? 'Permission updated.' : 'Permission created.';
				isModalOpen = false;
			} else {
				formError = body.error || 'Unable to save permission.';
			}
		} finally {
			isSubmitting = false;
		}
	}

	async function deactivatePermission(permission: Permission) {
		if (!confirm(`Deactivate ${permission.permission_key}?`)) return;
		const response = await fetch(`/api/permissions?id=${permission.permission_id}`, { method: 'DELETE' });
		const body = await response.json();
		if (response.ok) {
			permissions = permissions.map((item) =>
				item.permission_id === permission.permission_id ? body.data : item
			);
		} else {
			alert(body.error || 'Unable to deactivate permission.');
		}
	}
</script>

<svelte:head>
	<title>Permissions</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8 px-1 py-4">
	<div class="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
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
	{#if successMessage}
		<Alert><AlertDescription>{successMessage}</AlertDescription></Alert>
	{/if}

	<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
		<div class="relative flex-1">
			<SearchIcon class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input bind:value={searchQuery} class="pl-9" placeholder="Search permissions..." />
		</div>
		<FilterDropdown value={statusFilter} onChange={(value) => (statusFilter = value)} />
	</div>

	<Card>
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead class="w-20">ID</TableHead>
					<TableHead>Permission Key</TableHead>
					<TableHead class="w-28">Status</TableHead>
					<TableHead class="w-24 text-right">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#if isLoading}
					<TableRow><TableCell colspan={4} class="py-12 text-center"><LoaderCircleIcon class="mx-auto size-6 animate-spin" /></TableCell></TableRow>
				{:else if filteredPermissions.length === 0}
					<TableRow><TableCell colspan={4} class="py-12 text-center text-muted-foreground">No permissions found.</TableCell></TableRow>
				{:else}
					{#each filteredPermissions as permission (permission.permission_id)}
						<TableRow>
							<TableCell>#{permission.permission_id}</TableCell>
							<TableCell class="font-mono text-sm font-semibold">{permission.permission_key}</TableCell>
							<TableCell><Badge variant={permission.status === 'active' ? 'default' : 'secondary'}>{permission.status}</Badge></TableCell>
							<TableCell class="text-right">
								<TableActions
									canEdit={masterPermissions.canEdit}
									canDelete={masterPermissions.canDelete && permission.status === 'active'}
									editLabel="Edit permission"
									deleteLabel="Deactivate permission"
									onEdit={() => openEditModal(permission)}
									onDelete={() => deactivatePermission(permission)}
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
	title={editingPermission ? 'Edit Permission' : 'Create Permission'}
	description="Permission keys should use lowercase snake_case, such as employee_view."
	onClose={() => (isModalOpen = false)}
>
	<form class="space-y-4" onsubmit={savePermission}>
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
		<div class="space-y-2">
			<Label for="permission_status">Status</Label>
			<select id="permission_status" bind:value={permissionStatus} class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
				<option value="active">Active</option>
				<option value="inactive">Inactive</option>
			</select>
		</div>
		{#if formError}
			<Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>
		{/if}
		<Button type="submit" class="w-full bg-[#C2652A] text-white hover:bg-[#8C3C3C]" disabled={isSubmitting}>
			{isSubmitting ? 'Saving...' : 'Save Permission'}
		</Button>
	</form>
</CrudModal>
