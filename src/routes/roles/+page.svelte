<script lang="ts">
	import { onMount } from 'svelte';
	import type { Role } from '$lib/types/role';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Pencil2Icon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import ShieldIcon from '@lucide/svelte/icons/shield';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
	import { Modal } from '$lib/components';
	import { toast } from '$lib/toast.svelte.js';
	import { confirmation } from '$lib/confirmation.svelte.js';
	import { onDestroy } from 'svelte';

	let roles = $state<Role[]>([]);
	let page = $state(1);
	let limit = $state(10);
	let total = $state(0);
	let loading = $state(false);
	let searchQuery = $state('');

	// Modal state
	let showForm = $state(false);
	let editRole = $state<Role | null>(null);
	let formName = $state('');
	let formStatus = $state(true);
	let formError = $state('');
	let formLoading = $state(false);

	let activeDropdownId = $state<string | null>(null);

	function toggleDropdown(cuid: string, event: MouseEvent) {
		event.stopPropagation();
		if (activeDropdownId === cuid) {
			activeDropdownId = null;
		} else {
			activeDropdownId = cuid;
		}
	}

	function closeDropdowns() {
		activeDropdownId = null;
	}
	if (typeof window !== 'undefined') {
		window.addEventListener('click', closeDropdowns);
	}
	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('click', closeDropdowns);
		}
	});

	// Filter
	let filterStatus = $state<'all' | 'active' | 'inactive'>('all');

	let totalPages = $derived(Math.max(1, Math.ceil(total / limit)));

	let filteredRoles = $derived.by(() => {
		let list = roles;
		if (filterStatus === 'active') list = roles.filter((r) => r.status);
		else if (filterStatus === 'inactive') list = roles.filter((r) => !r.status);

		if (searchQuery.trim() !== '') {
			const query = searchQuery.toLowerCase().trim();
			list = list.filter((r) => r.name.toLowerCase().includes(query));
		}
		return list;
	});

	async function fetchRoles() {
		loading = true;
		try {
			// Fetch all (active + inactive) by not filtering on backend
			const res = await fetch(`/api/roles?page=${page}&limit=${limit}&includeInactive=true`);
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
		formStatus = true;
		formError = '';
		showForm = true;
	}

	function openEdit(role: Role) {
		editRole = role;
		formName = role.name;
		formStatus = role.status;
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
		const nameTrimmed = formName.trim();
		if (!nameTrimmed) {
			formError = 'Role name is required.';
			toast.error(formError);
			return;
		}
		if (nameTrimmed.length < 2) {
			formError = 'Role name must be at least 2 characters.';
			toast.error(formError);
			return;
		}
		const nameRegex = /^[A-Za-z ]+$/;
		if (!nameRegex.test(nameTrimmed)) {
			formError = 'Role name must contain only letters and spaces.';
			toast.error(formError);
			return;
		}
		if (nameTrimmed.length > 255) {
			formError = 'Role name exceeds maximum length of 255 characters.';
			toast.error(formError);
			return;
		}
		formLoading = true;
		formError = '';
		try {
			const url = editRole ? `/api/roles/${editRole.cuid}` : '/api/roles';
			const method = editRole ? 'PUT' : 'POST';
			const payload: any = { name: nameTrimmed };
			if (editRole) {
				payload.status = formStatus;
			}
			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const json = await res.json();
			if (res.ok) {
				const isEdit = !!editRole;
				closeForm();
				await fetchRoles();
				toast.success(isEdit ? 'Role updated successfully' : 'Role created successfully');
			} else {
				formError = json.error || 'Something went wrong.';
				toast.error(formError);
			}
		} catch {
			formError = 'Network error.';
			toast.error(formError);
		} finally {
			formLoading = false;
		}
	}

	async function deactivateRole(cuid: string) {
		confirmation.ask({
			title: 'Deactivate Role',
			message: 'Deactivate this role? It will remain visible but marked as inactive.',
			confirmText: 'Deactivate',
			cancelText: 'Cancel',
			isDestructive: true,
			onConfirm: async () => {
				try {
					const res = await fetch(`/api/roles/${cuid}`, { method: 'DELETE' });
					const json = await res.json();
					if (res.ok) {
						await fetchRoles();
						toast.success('Role deactivated successfully');
					} else {
						toast.error(json.error || 'Failed to deactivate role');
					}
				} catch {
					toast.error('Network error occurred while deactivating role');
				}
			}
		});
	}

	async function prevPage() {
		if (page > 1) {
			page -= 1;
			await fetchRoles();
		}
	}

	async function nextPage() {
		if (page < totalPages) {
			page += 1;
			await fetchRoles();
		}
	}

	onMount(fetchRoles);
</script>

<svelte:head>
	<title>Role Master – PieQ HRMS</title>
</svelte:head>

<!-- Page header -->
<div class="page-topbar">
	<div>
		<span
			style="display:inline-block;background:#C2652A1a;color:#C2652A;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:3px 10px;border-radius:99px;margin-bottom:6px"
		>HRMS Module</span>
		<h1 style="font-size:26px;font-weight:700;color:var(--foreground);margin:0;line-height:1.2">
			Role Master
		</h1>
		<p style="color:var(--muted-foreground);font-size:13px;margin-top:4px">
			Create and manage system roles for access control.
		</p>
	</div>

	<button class="btn-add-entity" onclick={openCreate} id="add-role-btn">
		<PlusIcon size={16} />
		Add Role
	</button>
</div>

<!-- Toolbar: filter and search -->
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:16px;flex-wrap:wrap">
	<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
		<div style="display:flex;align-items:center;gap:8px">
			<span style="font-size:13px;color:var(--muted-foreground)">Search:</span>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search by name..."
				id="role-search-input"
				style="border:1px solid var(--border);background:var(--card);color:var(--foreground);font-size:13px;padding:6px 12px;border-radius:8px;outline:none;transition:border-color .2s;min-width:200px"
				onfocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--pieq-primary)')}
				onblur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
			/>
		</div>
		<div style="display:flex;align-items:center;gap:8px">
			<span style="font-size:13px;color:var(--muted-foreground)">Filter:</span>
			<select
				bind:value={filterStatus}
				class="filter-select"
				id="role-filter-select"
			>
				<option value="all">All</option>
				<option value="active">Active</option>
				<option value="inactive">Inactive</option>
			</select>
		</div>
	</div>
	<p style="font-size:12px;color:var(--muted-foreground)">
		{filteredRoles.length} of {roles.length} role{roles.length !== 1 ? 's' : ''}
	</p>
</div>

<!-- Table card -->
<div class="enterprise-table-card">
	{#if loading}
		<div style="padding:64px;text-align:center;color:var(--muted-foreground);display:flex;align-items:center;justify-content:center;gap:10px">
			<LoaderCircleIcon class="animate-spin" size={18} />
			Loading roles...
		</div>
	{:else if filteredRoles.length === 0}
		<div style="padding:64px;text-align:center;color:var(--muted-foreground)">
			{roles.length === 0
				? 'No roles found. Click Add Role to create one.'
				: 'No roles match the current filter.'}
		</div>
	{:else}
		<table style="width:100%;border-collapse:collapse">
			<thead style="background:var(--muted)">
				<tr>
					<th style="padding:12px 20px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground)">Role Name</th>
					<th style="padding:12px 20px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground)">Status</th>
					<th style="padding:12px 20px;text-align:right;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground)">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredRoles as role (role.cuid)}
					<tr
						style="border-top:1px solid var(--border);transition:background-color .2s ease"
						onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--muted)'; }}
						onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
					>
						<td style="padding:14px 20px">
							<div style="display:flex;align-items:center;gap:8px">
								<span style="color:#C2652A">
									<ShieldIcon size={15} />
								</span>
								<span style="font-size:14px;font-weight:600">{role.name}</span>
							</div>
						</td>
						<td style="padding:14px 20px">
							{#if role.status}
								<span class="badge-active">Active</span>
							{:else}
								<span class="badge-inactive">Inactive</span>
							{/if}
						</td>
						<td style="padding:14px 20px;text-align:right;position:relative">
							<div style="display:inline-flex;align-items:center;justify-content:flex-end">
								<button
									onclick={(e) => toggleDropdown(role.cuid, e)}
									aria-label="Actions"
									title="Actions"
									style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:7px;border:1px solid var(--border);background:none;cursor:pointer;transition:background .15s;color:var(--foreground)"
									onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--muted)')}
									onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
								>
									<MoreVerticalIcon size={15} />
								</button>

								{#if activeDropdownId === role.cuid}
									<div
										style="position:absolute;right:20px;top:44px;z-index:50;background:var(--background);border:1px solid var(--border);border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.08);min-width:110px;padding:4px 0"
										onclick={(e) => e.stopPropagation()}
									>
										<button
											onclick={() => { openEdit(role); activeDropdownId = null; }}
											style="width:100%;display:flex;align-items:center;gap:8px;padding:8px 12px;font-size:13px;border:none;background:none;cursor:pointer;text-align:left;color:var(--foreground);transition:background .15s"
											onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--muted)')}
											onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
										>
											<Pencil2Icon size={13} style="color:#C2652A" />
											Edit
										</button>
									</div>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<!-- Pagination -->
		<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-top:1px solid var(--border)">
			<p style="font-size:12px;color:var(--muted-foreground)">
				Page {page} of {totalPages} &bull; {total} total role{total !== 1 ? 's' : ''}
			</p>
			<div style="display:flex;gap:8px">
				<button
					disabled={page <= 1}
					onclick={prevPage}
					style="padding:6px 14px;border-radius:7px;border:1px solid var(--border);background:none;font-size:12px;cursor:pointer;opacity:{page <= 1 ? 0.4 : 1}"
				>← Prev</button>
				<button
					disabled={page >= totalPages}
					onclick={nextPage}
					style="padding:6px 14px;border-radius:7px;border:1px solid var(--border);background:none;font-size:12px;cursor:pointer;opacity:{page >= totalPages ? 0.4 : 1}"
				>Next →</button>
			</div>
		</div>
	{/if}
</div>

<!-- Create / Edit Modal -->
<Modal bind:show={showForm} title={editRole ? 'Edit Role' : 'Create New Role'} onclose={closeForm}>
	<form onsubmit={submitForm} style="display:flex;flex-direction:column;gap:16px">
		<div style="display:flex;flex-direction:column;gap:6px">
			<label for="role-name" style="font-size:13px;font-weight:600">
				Role Name <span style="color:#C2652A">*</span>
			</label>
			<input
				id="role-name"
				type="text"
				bind:value={formName}
				placeholder="e.g. HR Manager"
				style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:border-color .2s;box-sizing:border-box"
				onfocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#C2652A')}
				onblur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
			/>
			{#if formError}
				<p style="color:#dc2626;font-size:12px;margin:0">{formError}</p>
			{/if}
		</div>

		{#if editRole}
			<div style="display:flex;flex-direction:column;gap:6px">
				<label for="role-status" style="font-size:13px;font-weight:600">
					Status
				</label>
				<select
					id="role-status"
					bind:value={formStatus}
					style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:border-color .2s;box-sizing:border-box"
					onfocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#C2652A')}
					onblur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
				>
					<option value={true}>Active</option>
					<option value={false}>Inactive</option>
				</select>
			</div>
		{/if}

		<div style="display:flex;justify-content:flex-end;gap:10px;padding-top:4px">
			<button
				type="button"
				onclick={closeForm}
				style="padding:9px 18px;border-radius:8px;border:1px solid var(--border);background:none;font-size:13px;font-weight:500;cursor:pointer"
			>Cancel</button>
			<button
				type="submit"
				disabled={formLoading}
				style="padding:9px 18px;border-radius:8px;background:#C2652A;color:white;border:none;font-size:13px;font-weight:600;cursor:pointer;opacity:{formLoading ? 0.7 : 1};display:inline-flex;align-items:center;gap:6px"
			>
				{#if formLoading}
					<LoaderCircleIcon class="animate-spin" size={14} />
				{/if}
				{formLoading ? 'Saving...' : editRole ? 'Update Role' : 'Create Role'}
			</button>
		</div>
	</form>
</Modal>
