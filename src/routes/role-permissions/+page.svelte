<script lang="ts">
	import { onMount } from 'svelte';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import {
		Alert,
		AlertDescription,
		Badge,
		Button,
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
		CrudModal,
		Label
	} from '$lib/components';

	interface SystemRole {
		system_role_id: number;
		system_role_name: string;
		status: 'active' | 'inactive';
	}

	interface Permission {
		permission_id: number;
		permission_key: string;
		status: 'active' | 'inactive';
	}

	interface RolePermission {
		role_permission_id: number;
		system_role_id: number;
		permission_id: number;
		role: SystemRole | null;
		permission: Permission | null;
	}

	interface MatrixData {
		roles: SystemRole[];
		permissions: Permission[];
		groupedPermissions: Record<string, Permission[]>;
		mappings: RolePermission[];
	}

	let data = $state<MatrixData>({
		roles: [],
		permissions: [],
		groupedPermissions: {},
		mappings: []
	});
	let isLoading = $state(true);
	let loadError = $state('');
	let formError = $state('');
	let successMessage = $state('');
	let isModalOpen = $state(false);
	let isSubmitting = $state(false);
	let selectedRoleId = $state('');
	let selectedPermissionIds = $state<number[]>([]);

	let activeRoles = $derived(data.roles.filter((role) => role.status === 'active'));
	let activeGroupedPermissions = $derived.by(() => {
		const groups: Record<string, Permission[]> = {};
		for (const [moduleName, permissions] of Object.entries(data.groupedPermissions)) {
			groups[moduleName] = permissions.filter((permission) => permission.status === 'active');
		}
		return groups;
	});

	function roleMappings(roleId: number) {
		return data.mappings.filter((mapping) => mapping.system_role_id === roleId && mapping.permission);
	}

	function hasMapping(roleId: number, permissionId: number) {
		return data.mappings.some(
			(mapping) => mapping.system_role_id === roleId && mapping.permission_id === permissionId
		);
	}

	async function loadMatrix() {
		isLoading = true;
		loadError = '';
		try {
			const response = await fetch('/api/role-permissions');
			const body = await response.json();
			if (response.ok) {
				data = body.data;
			} else {
				loadError = body.error || 'Failed to load role permissions.';
			}
		} finally {
			isLoading = false;
		}
	}

	onMount(loadMatrix);

	function openAssignModal(role?: SystemRole) {
		selectedRoleId = role ? String(role.system_role_id) : '';
		selectedPermissionIds = [];
		formError = '';
		isModalOpen = true;
	}

	function togglePermission(permissionId: number) {
		selectedPermissionIds = selectedPermissionIds.includes(permissionId)
			? selectedPermissionIds.filter((id) => id !== permissionId)
			: [...selectedPermissionIds, permissionId];
	}

	async function assignPermissions(event: Event) {
		event.preventDefault();
		const roleId = Number(selectedRoleId);
		if (!Number.isInteger(roleId) || roleId <= 0) {
			formError = 'Select a role';
			return;
		}
		if (selectedPermissionIds.length === 0) {
			formError = 'Select at least one permission';
			return;
		}

		isSubmitting = true;
		formError = '';
		try {
			const response = await fetch('/api/role-permissions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ system_role_id: roleId, permission_ids: selectedPermissionIds })
			});
			const body = await response.json();
			if (response.ok) {
				successMessage = `Assigned ${body.data.created.length} permission(s).`;
				isModalOpen = false;
				await loadMatrix();
			} else {
				formError = body.error || 'Unable to assign permissions.';
			}
		} finally {
			isSubmitting = false;
		}
	}

	async function removePermission(roleId: number, permissionId: number) {
		if (!confirm('Remove this permission from the role?')) return;
		const response = await fetch(`/api/role-permissions?roleId=${roleId}&permissionId=${permissionId}`, {
			method: 'DELETE'
		});
		const body = await response.json();
		if (response.ok) {
			successMessage = 'Permission removed from role.';
			await loadMatrix();
		} else {
			alert(body.error || 'Unable to remove permission.');
		}
	}
</script>

<svelte:head>
	<title>Role Permissions</title>
</svelte:head>

<div class="mx-auto max-w-6xl space-y-8 px-1 py-4">
	<div class="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-1">
			<Badge variant="secondary" class="uppercase">RBAC Foundation</Badge>
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Role Permission Mapping</h1>
			<p class="text-muted-foreground">Assign and remove permissions for system roles.</p>
		</div>
		<Button class="bg-[#C2652A] text-white hover:bg-[#8C3C3C]" onclick={() => openAssignModal()}>
			<PlusIcon class="size-4" />
			Assign Permissions
		</Button>
	</div>

	{#if loadError}
		<Alert variant="destructive"><AlertDescription>{loadError}</AlertDescription></Alert>
	{/if}
	{#if successMessage}
		<Alert><AlertDescription>{successMessage}</AlertDescription></Alert>
	{/if}

	{#if isLoading}
		<Card><CardContent class="py-12 text-center"><LoaderCircleIcon class="mx-auto size-6 animate-spin" /></CardContent></Card>
	{:else}
		<div class="grid gap-4 lg:grid-cols-2">
			{#each activeRoles as role (role.system_role_id)}
				<Card>
					<CardHeader class="flex-row items-start justify-between gap-4">
						<div>
							<CardTitle>{role.system_role_name}</CardTitle>
							<CardDescription>{roleMappings(role.system_role_id).length} permission(s)</CardDescription>
						</div>
						<Button variant="outline" size="sm" onclick={() => openAssignModal(role)}>
							<PlusIcon class="size-4" />
							Assign
						</Button>
					</CardHeader>
					<CardContent>
						{#if roleMappings(role.system_role_id).length === 0}
							<p class="text-sm text-muted-foreground">No permissions assigned.</p>
						{:else}
							<div class="flex flex-wrap gap-2">
								{#each roleMappings(role.system_role_id) as mapping (mapping.role_permission_id)}
									<div class="flex items-center gap-1 rounded-md border border-border px-2 py-1">
										<span class="font-mono text-xs">{mapping.permission?.permission_key}</span>
										<Button
											size="icon-xs"
											variant="ghost"
											aria-label="Remove permission"
											onclick={() => removePermission(mapping.system_role_id, mapping.permission_id)}
										>
											<Trash2Icon class="size-3" />
										</Button>
									</div>
								{/each}
							</div>
						{/if}
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>

<CrudModal
	open={isModalOpen}
	title="Assign Permissions"
	description="Select a role and one or more permissions to assign. Existing mappings are skipped."
	onClose={() => (isModalOpen = false)}
>
	<form class="space-y-5" onsubmit={assignPermissions}>
		<div class="space-y-2">
			<Label for="role_id">System Role</Label>
			<select id="role_id" bind:value={selectedRoleId} class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
				<option value="">Select role</option>
				{#each activeRoles as role (role.system_role_id)}
					<option value={String(role.system_role_id)}>{role.system_role_name}</option>
				{/each}
			</select>
		</div>

		<div class="space-y-3">
			<Label>Permissions</Label>
			<div class="max-h-80 space-y-4 overflow-y-auto rounded-md border border-border p-3">
				{#each Object.entries(activeGroupedPermissions) as [moduleName, permissions] (moduleName)}
					{#if permissions.length > 0}
						<div class="space-y-2">
							<p class="text-xs font-semibold uppercase text-[#737373]">{moduleName}</p>
							<div class="grid gap-2 sm:grid-cols-2">
								{#each permissions as permission (permission.permission_id)}
									<label class="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
										<input
											type="checkbox"
											checked={selectedPermissionIds.includes(permission.permission_id)}
											disabled={selectedRoleId !== '' && hasMapping(Number(selectedRoleId), permission.permission_id)}
											onchange={() => togglePermission(permission.permission_id)}
										/>
										<span class="font-mono text-xs">{permission.permission_key}</span>
									</label>
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			</div>
		</div>

		{#if formError}
			<Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>
		{/if}

		<Button type="submit" class="w-full bg-[#C2652A] text-white hover:bg-[#8C3C3C]" disabled={isSubmitting}>
			{isSubmitting ? 'Assigning...' : 'Assign Permissions'}
		</Button>
	</form>
</CrudModal>
