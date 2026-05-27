<script lang="ts">
	import { onMount } from 'svelte';
	import type { Role } from '$lib/types/role';

	let roles = $state<Role[]>([]);
	let page = $state(1);
	let limit = $state(10);
	let total = $state(0);
	let loading = $state(false);
	let showForm = $state(false);
	let editRole = $state<Role | null>(null);
	let formName = $state('');
	let formError = $state('');
	let formLoading = $state(false);

	let totalPages = $derived(Math.max(1, Math.ceil(total / limit)));

	async function fetchRoles() {
		loading = true;
		try {
			const res = await fetch(`/api/roles?page=${page}&limit=${limit}`);
			const json = await res.json();
			if (res.ok) {
				roles = json.data ?? [];
				total = json.pagination?.total ?? 0;
			}
		} catch (e) {
			console.error('Failed to fetch roles', e);
		} finally {
			loading = false;
		}
	}

	function openCreate() {
		editRole = null;
		formName = '';
		formError = '';
		showForm = true;
	}

	function openEdit(role: Role) {
		editRole = role;
		formName = role.name;
		formError = '';
		showForm = true;
	}

	function closeForm() {
		showForm = false;
		formName = '';
		formError = '';
		editRole = null;
	}

	async function submitForm(e: Event) {
		e.preventDefault();
		if (!formName.trim()) {
			formError = 'Role name is required.';
			return;
		}
		formLoading = true;
		formError = '';
		try {
			const url = editRole ? `/api/roles/${editRole.role_id}` : '/api/roles';
			const method = editRole ? 'PUT' : 'POST';
			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: formName.trim() })
			});
			const json = await res.json();
			if (res.ok) {
				closeForm();
				await fetchRoles();
			} else {
				formError = json.error || 'Something went wrong.';
			}
		} catch {
			formError = 'Network error.';
		} finally {
			formLoading = false;
		}
	}

	async function deleteRole(id: number) {
		if (!confirm('Deactivate this role?')) return;
		const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
		if (res.ok) await fetchRoles();
	}

	async function prevPage() {
		if (page > 1) { page -= 1; await fetchRoles(); }
	}

	async function nextPage() {
		if (page < totalPages) { page += 1; await fetchRoles(); }
	}

	onMount(fetchRoles);
</script>

<svelte:head>
	<title>Role Master – HRMS</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8 px-1 py-4">
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-border pb-6">
		<div class="space-y-1">
			<span class="inline-block rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold uppercase text-secondary-foreground">HRMS Module</span>
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Role Master</h1>
			<p class="text-muted-foreground">Create and manage system roles for access control.</p>
		</div>
		<button
			onclick={openCreate}
			class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition"
		>
			+ Create Role
		</button>
	</div>

	<!-- Table Card -->
	<div class="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
		{#if loading}
			<div class="py-16 text-center text-muted-foreground">Loading roles...</div>
		{:else if roles.length === 0}
			<div class="py-16 text-center text-muted-foreground">
				No roles found. Click <strong>+ Create Role</strong> to add one.
			</div>
		{:else}
			<table class="min-w-full divide-y divide-border">
				<thead class="bg-muted/50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID</th>
						<th class="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role Name</th>
						<th class="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
						<th class="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each roles as role (role.role_id)}
						<tr class="hover:bg-muted/30 transition">
							<td class="px-6 py-4 text-sm text-muted-foreground">{role.role_id}</td>
							<td class="px-6 py-4 text-sm font-semibold">{role.name}</td>
							<td class="px-6 py-4">
								<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {role.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}">
									{role.is_active ? 'Active' : 'Inactive'}
								</span>
							</td>
							<td class="px-6 py-4 text-right space-x-2">
								<button
									onclick={() => openEdit(role)}
									class="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted transition"
								>Edit</button>
								<button
									onclick={() => deleteRole(role.role_id)}
									class="rounded-md border border-destructive/40 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition"
								>Delete</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>

			<!-- Pagination -->
			<div class="flex items-center justify-between border-t border-border px-6 py-3">
				<p class="text-xs text-muted-foreground">
					Page {page} of {totalPages} &bull; {total} total role{total !== 1 ? 's' : ''}
				</p>
				<div class="flex gap-2">
					<button
						disabled={page <= 1}
						onclick={prevPage}
						class="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted transition"
					>← Prev</button>
					<button
						disabled={page >= totalPages}
						onclick={nextPage}
						class="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted transition"
					>Next →</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Modal -->
{#if showForm}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
		onclick={(e) => { if (e.target === e.currentTarget) closeForm(); }}
	>
		<div class="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl mx-4">
			<h2 class="mb-4 text-xl font-bold">
				{editRole ? 'Edit Role' : 'Create New Role'}
			</h2>

			<form onsubmit={submitForm} class="space-y-4">
				<div class="space-y-1.5">
					<label class="text-sm font-medium" for="role-name">
						Role Name <span class="text-destructive">*</span>
					</label>
					<input
						id="role-name"
						type="text"
						bind:value={formName}
						placeholder="e.g. HR Manager"
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
					/>
					{#if formError}
						<p class="text-sm text-destructive">{formError}</p>
					{/if}
				</div>

				<div class="flex justify-end gap-3 pt-2">
					<button
						type="button"
						onclick={closeForm}
						class="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition"
					>Cancel</button>
					<button
						type="submit"
						disabled={formLoading}
						class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition"
					>
						{formLoading ? 'Saving...' : editRole ? 'Update Role' : 'Create Role'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
