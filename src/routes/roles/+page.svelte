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
	let total = $derived(filteredRoles.length);
	let loading = $state(false);
	let searchQuery = $state('');

	// Modal state
	let showForm = $state(false);

	function handleBackdropClick(e: MouseEvent) {
		if (e.target instanceof HTMLElement && e.target.classList.contains('modal-overlay')) {
			e.stopPropagation();
			e.preventDefault();
		}
	}

	function handleKeyDownGlobal(e: KeyboardEvent) {
		if (e.key === 'Enter' && showConfirmation) {
			e.preventDefault();
			e.stopPropagation();
		}
	}

	$effect(() => {
		if (typeof window !== 'undefined' && showForm) {
			window.addEventListener('click', handleBackdropClick, true);
			window.addEventListener('keydown', handleKeyDownGlobal, true);
			return () => {
				window.removeEventListener('click', handleBackdropClick, true);
				window.removeEventListener('keydown', handleKeyDownGlobal, true);
			};
		}
	});

	let editRole = $state<Role | null>(null);
	let formName = $state('');
	let formStatus = $state(true);
	let formError = $state('');
	let formLoading = $state(false);

	let showConfirmation = $state(false);

	let originalName = '';
	let originalStatus = true;

	function captureOriginalState() {
		originalName = editRole ? editRole.name : '';
		originalStatus = editRole ? editRole.status : true;
	}

	function resetStateTracking() {
		originalName = '';
		originalStatus = true;
		showConfirmation = false;
		formError = '';
	}

	function hasUnsavedChanges(): boolean {
		return formName.trim() !== originalName || formStatus !== originalStatus;
	}

	function attemptCloseForm() {
		if (showConfirmation) {
			showConfirmation = false;
		} else if (hasUnsavedChanges()) {
			showConfirmation = true;
		} else {
			closeForm();
		}
	}

	function discardChanges() {
		showConfirmation = false;
		closeForm();
	}

	function continueEditing() {
		showConfirmation = false;
	}

	// Update validation
	let isUpdateChanged = $derived.by(() => {
		if (!editRole) return false;
		return formName.trim() !== originalName || formStatus !== originalStatus;
	});

	// Create validation
	let isCreateValid = $derived.by(() => {
		const nameTrimmed = formName.trim();
		if (!nameTrimmed) return false;
		if (nameTrimmed.length < 2) return false;
		const nameRegex = /^[A-Za-z ]+$/;
		if (!nameRegex.test(nameTrimmed)) return false;
		if (nameTrimmed.length > 255) return false;
		return true;
	});

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
	let pageNumbers = $derived(Array.from({ length: totalPages }, (_, i) => i + 1));

	// Sorting states
	let sortColumn = $state<string | null>(null);
	let sortDirection = $state<'asc' | 'desc' | null>(null);

	function toggleSort(col: string) {
		if (sortColumn === col) {
			if (sortDirection === 'asc') {
				sortDirection = 'desc';
			} else {
				sortColumn = null;
				sortDirection = null;
			}
		} else {
			sortColumn = col;
			sortDirection = 'asc';
		}
	}

	function resetSort() {
		sortColumn = null;
		sortDirection = null;
	}

	let sortedRoles = $derived.by(() => {
		let list = [...filteredRoles];
		if (sortColumn && sortDirection) {
			list.sort((a, b) => {
				let valA = a[sortColumn as keyof typeof a];
				let valB = b[sortColumn as keyof typeof b];

				if (typeof valA === 'string' && typeof valB === 'string') {
					const comp = valA.localeCompare(valB);
					return sortDirection === 'asc' ? comp : -comp;
				}
				if (typeof valA === 'boolean' && typeof valB === 'boolean') {
					const numA = valA ? 1 : 0;
					const numB = valB ? 1 : 0;
					return sortDirection === 'asc' ? numA - numB : numB - numA;
				}
				if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
				if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
				return 0;
			});
		}
		return list;
	});

	let paginatedRoles = $derived(sortedRoles.slice((page - 1) * limit, page * limit));

	let totalRoles = $derived(roles.length);
	let activeRolesCount = $derived(roles.filter((r) => r.status).length);
	let inactiveRolesCount = $derived(roles.filter((r) => !r.status).length);

	$effect(() => {
		if (page > totalPages) {
			page = totalPages;
		}
		if (page < 1) {
			page = 1;
		}
	});

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
			const res = await fetch(`/api/roles?includeInactive=true`);
			const json = await res.json();
			if (res.ok) {
				roles = json.data ?? [];
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
		captureOriginalState();
		showForm = true;
	}

	function openEdit(role: Role) {
		editRole = role;
		formName = role.name;
		formStatus = role.status;
		formError = '';
		captureOriginalState();
		showForm = true;
	}

	function closeForm() {
		showForm = false;
		formName = '';
		formError = '';
		editRole = null;
		resetStateTracking();
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
		}
	}

	async function nextPage() {
		if (page < totalPages) {
			page += 1;
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

<!-- Stats Grid -->
<div class="stats-grid">
	<div class="stat-card">
		<div class="stat-card-label">Total Roles</div>
		<div class="stat-card-value">{totalRoles}</div>
	</div>
	<div class="stat-card">
		<div class="stat-card-label">Active Roles</div>
		<div class="stat-card-value">{activeRolesCount}</div>
	</div>
	<div class="stat-card">
		<div class="stat-card-label">Inactive Roles</div>
		<div class="stat-card-value">{inactiveRolesCount}</div>
	</div>
</div>

<!-- Toolbar: filter and search -->
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;gap:16px;width:100%">
	<div style="position:relative;flex:1;max-width:500px;display:flex;align-items:center">
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search" style="position:absolute;left:14px;color:var(--muted-foreground);pointer-events:none"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search by role name..."
			id="role-search-input"
			style="width:100%;border:1px solid var(--border);background:var(--card);color:var(--foreground);font-size:14px;padding:9px 12px 9px 40px;border-radius:10px;outline:none;transition:border-color .2s;box-shadow:0 1px 2px rgba(0,0,0,0.02)"
			onfocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--pieq-primary)')}
			onblur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
		/>
	</div>
	
	<div style="display:flex;align-items:center;gap:8px">
		<div style="position:relative;display:flex;align-items:center;min-width:120px">
			<select
				bind:value={filterStatus}
				class="filter-select"
				id="role-filter-select"
				style="width:100%;border:1px solid var(--border);background:var(--card);color:var(--foreground);font-size:14px;padding:9px 36px 9px 16px;border-radius:10px;outline:none;cursor:pointer;appearance:none;transition:border-color .2s;box-shadow:0 1px 2px rgba(0,0,0,0.02)"
				onfocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--pieq-primary)')}
				onblur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
			>
				<option value="all">All</option>
				<option value="active">Active</option>
				<option value="inactive">Inactive</option>
			</select>
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-filter" style="position:absolute;right:14px;color:var(--muted-foreground);pointer-events:none"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
		</div>

		<button
			onclick={resetSort}
			title="Reset Sorting"
			aria-label="Reset Sorting"
			style="display:inline-flex;align-items:center;justify-content:center;padding:9px 14px;border:1px solid var(--border);background:var(--card);color:var(--foreground);border-radius:10px;cursor:pointer;font-size:14px;font-weight:500;transition:all 0.2s;box-shadow:0 1px 2px rgba(0,0,0,0.02);white-space:nowrap;gap:6px"
			onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--muted)'; }}
			onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--card)'; }}
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
			Reset
		</button>
	</div>
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
			<thead style="background:#F9FAFB">
				<tr style="border-bottom:1px solid var(--border)">
					<th style="padding:14px 20px;text-align:left;font-size:14px;font-weight:700;color:var(--foreground);white-space:nowrap">
						<button
							onclick={() => toggleSort('name')}
							style="display:flex;align-items:center;gap:6px;cursor:pointer;border:none;background:none;font-size:14px;font-weight:700;color:var(--foreground);padding:0"
						>
							Role Name
							<span style="font-size:14px;color:var(--pieq-primary);opacity:0.8">{sortColumn === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}</span>
						</button>
					</th>
					<th style="padding:14px 20px;text-align:left;font-size:14px;font-weight:700;color:var(--foreground);white-space:nowrap">
						<button
							onclick={() => toggleSort('status')}
							style="display:flex;align-items:center;gap:6px;cursor:pointer;border:none;background:none;font-size:14px;font-weight:700;color:var(--foreground);padding:0"
						>
							Status
							<span style="font-size:14px;color:var(--pieq-primary);opacity:0.8">{sortColumn === 'status' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}</span>
						</button>
					</th>
					<th style="padding:14px 20px;text-align:right;font-size:14px;font-weight:700;color:var(--foreground);white-space:nowrap">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each paginatedRoles as role (role.cuid)}
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
		<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-top:1px solid var(--border)">
			<p style="font-size:14px;color:var(--muted-foreground)">
				Showing {total === 0 ? 0 : (page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total} records
			</p>
			<div style="display:flex;align-items:center;gap:8px">
				<button
					disabled={page <= 1}
					onclick={prevPage}
					style="padding:6px 14px;border:none;background:none;font-size:14px;font-weight:500;cursor:pointer;color:var(--muted-foreground);opacity:{page <= 1 ? 0.4 : 1};display:inline-flex;align-items:center;gap:4px"
				>⟨ Previous</button>
				{#each pageNumbers as p}
					{#if p === page}
						<span style="background:#111827;color:#ffffff;width:32px;height:32px;border-radius:6px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;font-size:14px">
							{p}
						</span>
					{:else}
						<button
							onclick={() => page = p}
							style="background:none;border:none;color:#111827;width:32px;height:32px;cursor:pointer;font-weight:500;display:inline-flex;align-items:center;justify-content:center;font-size:14px"
						>
							{p}
						</button>
					{/if}
				{/each}
				<button
					disabled={page >= totalPages}
					onclick={nextPage}
					style="padding:6px 14px;border:none;background:none;font-size:14px;font-weight:700;cursor:pointer;color:#111827;opacity:{page >= totalPages ? 0.4 : 1};display:inline-flex;align-items:center;gap:4px"
				>Next ⟩</button>
			</div>
		</div>
	{/if}
</div>

<!-- Create / Edit Modal -->
<Modal bind:show={showForm} title={editRole ? 'Edit Role' : 'Create New Role'} onclose={attemptCloseForm}>
	{#if showConfirmation}
		<div style="position:fixed;inset:0;background:rgba(15,11,10,0.65);backdrop-filter:blur(4px);z-index:300;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box">
			<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;width:100%;max-width:320px;box-shadow:0 10px 25px rgba(0,0,0,0.2);display:flex;flex-direction:column;gap:16px;text-align:center">
				<h3 style="font-size:16px;font-weight:700;color:var(--foreground);margin:0">Unsaved Changes</h3>
				<p style="font-size:13px;color:var(--muted-foreground);margin:0">You have unsaved modifications. Are you sure you want to discard them?</p>
				<div style="display:flex;flex-direction:column;gap:8px">
					<button
						type="button"
						onclick={discardChanges}
						style="width:100%;padding:9px;border-radius:8px;background:#dc2626;color:white;border:none;font-size:13px;font-weight:600;cursor:pointer;transition:opacity 0.15s"
						onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.9')}
						onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
					>Discard Changes</button>
					<button
						type="button"
						onclick={continueEditing}
						style="width:100%;padding:9px;border-radius:8px;background:none;border:1px solid var(--border);color:var(--foreground);font-size:13px;font-weight:600;cursor:pointer;transition:background 0.15s"
						onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--muted)')}
						onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
					>Continue Editing</button>
				</div>
			</div>
		</div>
	{/if}

	<form onsubmit={submitForm} style="display:flex;flex-direction:column;gap:16px">
		<div style="display:flex;flex-direction:column;gap:6px">
			<label for="role-name" style="font-size:13px;font-weight:600">
				Role Name <span style="color:#C2652A">*</span>
			</label>
			<input
				id="role-name"
				type="text"
				bind:value={formName}
				oninput={() => formError = ''}
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
				disabled={formLoading || (editRole ? !isUpdateChanged : !isCreateValid)}
				style="padding:9px 18px;border-radius:8px;background:#C2652A;color:white;border:none;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;transition:opacity 0.2s;opacity:{(formLoading || (editRole ? !isUpdateChanged : !isCreateValid)) ? 0.4 : 1};cursor:{(formLoading || (editRole ? !isUpdateChanged : !isCreateValid)) ? 'not-allowed' : 'pointer'}"
			>
				{#if formLoading}
					<LoaderCircleIcon class="animate-spin" size={14} />
				{/if}
				{formLoading ? 'Saving...' : editRole ? 'Update Role' : 'Create Role'}
			</button>
		</div>
	</form>
</Modal>
