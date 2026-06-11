<script lang="ts">
	import { onMount } from 'svelte';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';

	import { toast } from '$lib/toast';
	import {
		Alert,
		AlertDescription,
		Card,
		CardContent,
		PermissionMatrixCell,
		SearchInput
	} from '$lib/components';
	import { UI_CONSTANTS } from '$lib/constants';

	interface SystemRole {
		cuid: string;
		system_role_name: string;
		status: boolean;
	}

	interface Permission {
		cuid: string;
		permission_key: string;
		status: boolean;
	}

	interface RolePermission {
		cuid: string;
		system_role_cuid: string | null;
		permission_cuid: string | null;
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
	let searchQuery = $state('');
	let assignmentKeys = $state<string[]>([]);
	let pendingKeys = $state<string[]>([]);

	let activeRoles = $derived(data.roles.filter((role) => role.status === true));
	let activePermissions = $derived(
		data.permissions.filter((permission) => permission.status === true)
	);
	let filteredRoles = $derived.by(() => {
		const query = searchQuery.trim().toLowerCase();
		if (!query) return activeRoles;
		const matchedRoles = activeRoles.filter((role) =>
			role.system_role_name.toLowerCase().includes(query)
		);
		const hasMatchedPermissions = activePermissions.some((permission) =>
			permission.permission_key.toLowerCase().includes(query)
		);

		if (matchedRoles.length > 0) {
			return matchedRoles;
		}
		if (hasMatchedPermissions) {
			return activeRoles;
		}
		return [];
	});

	let filteredPermissions = $derived.by(() => {
		const query = searchQuery.trim().toLowerCase();
		if (!query) return activePermissions;
		const matchedPermissions = activePermissions.filter((permission) =>
			permission.permission_key.toLowerCase().includes(query)
		);
		const hasMatchedRoles = activeRoles.some((role) =>
			role.system_role_name.toLowerCase().includes(query)
		);

		if (matchedPermissions.length > 0) {
			return matchedPermissions;
		}
		if (hasMatchedRoles) {
			return activePermissions;
		}
		return [];
	});

	function assignmentKey(roleCuid: string, permissionCuid: string) {
		return `${roleCuid}:${permissionCuid}`;
	}

	function buildAssignmentSet(mappings: RolePermission[]) {
		return mappings
			.filter((mapping) => mapping.system_role_cuid && mapping.permission_cuid)
			.map((mapping) =>
				assignmentKey(mapping.system_role_cuid as string, mapping.permission_cuid as string)
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
				assignmentKeys = buildAssignmentSet(body.data.mappings ?? []);
			} else {
				loadError = body.error || 'Failed to load role permissions.';
				toast.error(loadError);
			}
		} finally {
			isLoading = false;
		}
	}

	onMount(loadMatrix);

	async function togglePermission(role: SystemRole, permission: Permission) {
		const key = assignmentKey(role.cuid, permission.cuid);
		if (pendingKeys.includes(key)) return;

		const wasAssigned = assignmentKeys.includes(key);
		pendingKeys = [...pendingKeys, key];

		assignmentKeys = wasAssigned
			? assignmentKeys.filter((assignment) => assignment !== key)
			: [...assignmentKeys, key];

		try {
			const response = await fetch(
				wasAssigned
					? `/api/role-permissions/${role.cuid}/${permission.cuid}`
					: '/api/role-permissions',
				{
					method: wasAssigned ? 'DELETE' : 'POST',
					headers: wasAssigned ? undefined : { 'Content-Type': 'application/json' },
					body: wasAssigned
						? undefined
						: JSON.stringify({
								system_role_cuid: role.cuid,
								permission_cuids: [permission.cuid]
							})
				}
			);
			const body = await response.json();
			if (!response.ok) {
				throw new Error(body.error || 'Unable to update permission assignment.');
			}
			toast.success(wasAssigned ? 'Permission removed from role.' : 'Permission assigned to role.');
		} catch (error) {
			assignmentKeys = wasAssigned
				? [...assignmentKeys, key]
				: assignmentKeys.filter((assignment) => assignment !== key);
			toast.error((error as Error).message);
		} finally {
			pendingKeys = pendingKeys.filter((pendingKey) => pendingKey !== key);
		}
	}
</script>

<svelte:head>
	<title>Role Permissions</title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-0">
	<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl wrap-break-word">Role Permission Matrix</h1>
		</div>
	</div>

	<div class="space-y-3">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<SearchInput bind:value={searchQuery} placeholder="Search roles or permissions..." />
		</div>

		{#if loadError}
			<Alert variant="destructive"><AlertDescription>{loadError}</AlertDescription></Alert>
		{/if}

	{#if isLoading}
		<Card>
			<CardContent class="py-12 text-center">
				<LoaderCircleIcon class="mx-auto size-6 animate-spin" />
			</CardContent>
		</Card>
	{:else if activeRoles.length === 0 || activePermissions.length === 0 || filteredRoles.length === 0 || filteredPermissions.length === 0}
		<Card>
			<CardContent class="py-12 text-center text-muted-foreground">
				{UI_CONSTANTS.EMPTY_STATE_MESSAGE}
			</CardContent>
		</Card>
	{:else}
		<div class="rounded-md border border-border bg-background">
			<div class="max-h-[70vh] overflow-auto">
				<table class="min-w-max border-collapse text-sm">
					<thead class="sticky top-0 z-20 bg-[#262626] text-white shadow-sm">
						<tr>
							<th class="sticky left-0 z-30 min-w-64 bg-[#262626] px-4 py-3 text-left font-semibold">
								Permission
							</th>
							{#each filteredRoles as role (role.cuid)}
								<th class="min-w-40 border-l border-white/10 px-4 py-3 text-center font-semibold">
									{role.system_role_name}
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each filteredPermissions as permission (permission.cuid)}
							<tr class="border-t border-border hover:bg-[#F45310]/5">
								<td class="sticky left-0 z-10 min-w-64 border-r border-border bg-background px-4 py-3">
									<div class="font-mono text-xs font-semibold text-[#262626]">
										{permission.permission_key}
									</div>
									<div class="mt-1 text-[11px] uppercase text-[#737373]">
										{permission.permission_key.split('_')[0] || 'general'}
									</div>
								</td>
								{#each filteredRoles as role (role.cuid)}
									{@const key = assignmentKey(role.cuid, permission.cuid)}
									<td class="border-l border-border px-4 py-3 text-center">
										<PermissionMatrixCell
											checked={assignmentKeys.includes(key)}
											pending={pendingKeys.includes(key)}
											label={`${role.system_role_name}: ${permission.permission_key}`}
											onToggle={() => togglePermission(role, permission)}
										/>
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
	</div>
</div>
