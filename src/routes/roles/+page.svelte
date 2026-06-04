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

	// Create enablement: enabled once required fields contain any value
	let isCreateEnabled = $derived(formName.trim() !== '');

	let activeDropdownId = $state<string | null>(null);

	function toggleDropdown(cuid: string, event: MouseEvent) {
		event.stopPropagation();
		if (activeDropdownId === cuid) {
			activeDropdownId = null;
		} else {
			activeDropdownId = cuid;
		}
	}

	let showStatusDropdown = $state(false);
	let showModalStatusDropdown = $state(false);

	function closeDropdowns() {
		activeDropdownId = null;
		showStatusDropdown = false;
		showModalStatusDropdown = false;
	}
	if (typeof window !== 'undefined') {
		window.addEventListener('click', closeDropdowns);
	}
	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('click', closeDropdowns);
		}
	});

	function handleStatusSelect(val: 'all' | 'active' | 'inactive') {
		filterStatus = val;
		showStatusDropdown = false;
	}

	// Filter
	let filterStatus = $state<'all' | 'active' | 'inactive'>('all');

	// Sorting states
	let sortColumn = $state<string | null>(null);
	let sortDirection = $state<'asc' | 'desc' | null>(null);

	function toggleSort(col: string) {
		if (sortColumn === col) {
			if (sortDirection === 'asc') {
				sortDirection = 'desc';
			} else if (sortDirection === 'desc') {
				sortColumn = null;
				sortDirection = null;
			} else {
				sortDirection = 'asc';
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

	let total = $derived(filteredRoles.length);
	let totalPages = $derived(Math.max(1, Math.ceil(total / limit)));
	let pageNumbers = $derived(Array.from({ length: totalPages }, (_, i) => i + 1));

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
		showModalStatusDropdown = false;
		resetStateTracking();
	}

	async function submitForm(e: Event) {
		e.preventDefault();
		const nameTrimmed = formName.trim();
		if (!nameTrimmed) {
			formError = 'Role name is required.';
			return;
		}
		if (nameTrimmed.length < 2) {
			formError = 'Role name must be at least 2 characters.';
			return;
		}
		const nameRegex = /^[A-Za-z ]+$/;
		if (!nameRegex.test(nameTrimmed)) {
			formError = 'Role name must contain only letters and spaces.';
			return;
		}
		if (nameTrimmed.length > 255) {
			formError = 'Role name exceeds maximum length of 255 characters.';
			return;
		}
		formLoading = true;
		formError = '';
		try {
			const url = editRole ? `/api/roles/roleCuid=${editRole.cuid}` : '/api/roles';
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
					const res = await fetch(`/api/roles/roleCuid=${cuid}`, { method: 'DELETE' });
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
<div class="flex items-center justify-between mb-7 max-md:flex-col max-md:items-stretch max-md:gap-4">
	<div>
		<h1 class="text-[26px] font-bold text-foreground m-0 leading-[1.2]">
			Role Master
		</h1>
	</div>

	<button class="inline-flex items-center gap-1.5 bg-pieq-primary text-white text-[13px] font-semibold px-4 py-2 rounded-lg no-underline transition-[background-color,transform] duration-200 hover:bg-[#a8541f] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border-none max-md:self-start" onclick={openCreate} id="add-role-btn">
		<PlusIcon size={16} />
		Add Role
	</button>
</div>

<!-- Stats Grid -->
<div class="grid gap-4 mb-7 grid-cols-[repeat(auto-fit,minmax(160px,1fr))] max-md:grid-cols-[repeat(auto-fit,minmax(140px,1fr))] max-md:gap-3 max-md:mb-5">
	<div class="bg-card border border-border rounded-xl p-5 shadow-sm">
		<div class="text-xs font-medium text-muted-foreground tracking-wide mb-1.5">Total Roles</div>
		<div class="text-[32px] font-bold text-foreground leading-none tabular-nums">{totalRoles}</div>
	</div>
	<div class="bg-card border border-border rounded-xl p-5 shadow-sm">
		<div class="text-xs font-medium text-muted-foreground tracking-wide mb-1.5">Active Roles</div>
		<div class="text-[32px] font-bold leading-none tabular-nums text-pieq-primary">{activeRolesCount}</div>
	</div>
	<div class="bg-card border border-border rounded-xl p-5 shadow-sm">
		<div class="text-xs font-medium text-muted-foreground tracking-wide mb-1.5">Inactive Roles</div>
		<div class="text-[32px] font-bold leading-none tabular-nums text-pieq-tertiary">{inactiveRolesCount}</div>
	</div>
</div>

<!-- Toolbar: filter and search -->
<div class="flex items-center justify-between mb-5 gap-4 w-full max-md:flex-col max-md:items-stretch max-md:gap-3">
	<div class="relative flex-1 max-w-[500px] flex items-center max-md:max-w-full max-md:w-full">
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search absolute left-3.5 text-muted-foreground pointer-events-none"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search by role name..."
			id="role-search-input"
			class="w-full border border-border bg-card text-foreground text-sm py-2.25 pl-10 pr-3 rounded-xl outline-none transition-all duration-200 shadow-sm focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/15"
			oninput={() => formError = ''}
		/>
	</div>
	<div class="flex items-center gap-3 max-md:w-full max-md:justify-between max-md:flex-wrap">
		<div class="flex items-center gap-1.5 relative max-md:w-full">
			<span class="text-[13px] text-muted-foreground">Filter:</span>
			<button
				onclick={(e) => { e.stopPropagation(); showStatusDropdown = !showStatusDropdown; }}
				class="bg-card border-[1.5px] border-neutral-300 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground inline-flex items-center justify-between gap-12 min-w-[140px] cursor-pointer transition-all duration-200 outline-none shadow-sm hover:border-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/15 max-md:w-full max-md:min-w-full max-md:gap-3"
				id="role-filter-select-trigger"
			>
				<span>{filterStatus === 'all' ? 'All' : filterStatus === 'active' ? 'Active' : 'Inactive'}</span>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-funnel" style="color:#737373"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
			</button>

			{#if showStatusDropdown}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="absolute top-[calc(100%+4px)] right-0 z-60 bg-white border border-neutral-200 rounded-xl shadow-lg min-w-[140px] p-1 flex flex-col gap-0.5"
					onclick={(e) => e.stopPropagation()}
				>
					{#each [{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] as opt}
						<button
							onclick={() => handleStatusSelect(opt.value as any)}
							class="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium border-none bg-transparent cursor-pointer text-left rounded-lg text-foreground transition-colors duration-150 hover:bg-neutral-100"
						>
							<span>{opt.label}</span>
							{#if filterStatus === opt.value}
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check" style="color:#111827"><path d="M20 6 9 17l-5-5"/></svg>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Table card -->
<div class="bg-card border border-border rounded-xl overflow-hidden shadow-sm max-md:overflow-x-auto max-md:w-full max-md:[-webkit-overflow-scrolling:touch]">
	{#if loading}
		<div class="py-16 text-center text-muted-foreground flex items-center justify-center gap-2.5">
			<LoaderCircleIcon class="animate-spin" size={18} />
			Loading roles...
		</div>
	{:else if filteredRoles.length === 0}
		<div class="py-16 text-center text-muted-foreground">
			{roles.length === 0
				? 'No records found'
				: 'No roles match the current filter.'}
		</div>
	{:else}
		<table class="w-full border-collapse">
			<thead class="bg-[#F9FAFB]">
				<tr class="border-b border-border">
					<th class="px-5 py-3.5 text-left text-sm font-bold text-foreground whitespace-nowrap">
						<button
							onclick={() => toggleSort('name')}
							class="flex items-center gap-1.5 cursor-pointer border-none bg-transparent text-sm font-bold text-foreground p-0"
						>
							Role Name
							{#if sortColumn === 'name'}
								{#if sortDirection === 'asc'}
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up" style="margin-left: 6px; flex-shrink: 0;"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
								{:else}
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down" style="margin-left: 6px; flex-shrink: 0;"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
								{/if}
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-down" style="margin-left: 6px; flex-shrink: 0; opacity: 0.4;"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
							{/if}
						</button>
					</th>
					<th class="px-5 py-3.5 text-left text-sm font-bold text-foreground whitespace-nowrap">
						<button
							onclick={() => toggleSort('status')}
							class="flex items-center gap-1.5 cursor-pointer border-none bg-transparent text-sm font-bold text-foreground p-0"
						>
							Status
							{#if sortColumn === 'status'}
								{#if sortDirection === 'asc'}
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up" style="margin-left: 6px; flex-shrink: 0;"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
								{:else}
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down" style="margin-left: 6px; flex-shrink: 0;"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
								{/if}
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-down" style="margin-left: 6px; flex-shrink: 0; opacity: 0.4;"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
							{/if}
						</button>
					</th>
					<th class="px-5 py-3.5 text-right text-sm font-bold text-foreground whitespace-nowrap">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each paginatedRoles as role (role.cuid)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<tr class="border-t border-border transition-colors duration-200 hover:bg-muted cursor-pointer" onclick={() => openEdit(role)}>
						<td class="px-5 py-3.5">
							<div class="flex items-center gap-2">
								<span class="text-sm font-semibold">{role.name}</span>
							</div>
						</td>
						<td class="px-5 py-3.5">
							{#if role.status}
								<span class="inline-flex items-center justify-center w-16 py-1 rounded-full text-[11px] font-semibold bg-[#111827] text-white">Active</span>
							{:else}
								<span class="inline-flex items-center justify-center w-16 py-1 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-700">Inactive</span>
							{/if}
						</td>
						<td class="px-5 py-3.5 text-right relative" onclick={(e) => e.stopPropagation()}>
							<div class="inline-flex items-center justify-end">
								<button
									onclick={(e) => toggleDropdown(role.cuid, e)}
									aria-label="Actions"
									title="Actions"
									class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-transparent cursor-pointer transition-colors duration-150 text-foreground hover:bg-muted"
								>
									<MoreVerticalIcon size={15} />
								</button>

								{#if activeDropdownId === role.cuid}
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									<!-- svelte-ignore a11y_no_static_element_interactions -->
									<div
										class="absolute right-5 top-11 z-50 bg-background border border-border rounded-lg shadow-md min-w-[110px] py-1"
										onclick={(e) => e.stopPropagation()}
									>
										<button
											onclick={() => { openEdit(role); activeDropdownId = null; }}
											class="w-full flex items-center gap-3 px-3 py-2 text-xs border-none bg-transparent cursor-pointer text-left text-foreground transition-colors duration-150 hover:bg-muted"
										>
											<Pencil2Icon size={13} />
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
		<div class="flex items-center justify-between px-5 py-3.5 border-t border-border">
			<p class="text-sm text-muted-foreground">
				Showing {total === 0 ? 0 : (page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total} records
			</p>
			<div class="flex items-center gap-2">
				<button
					disabled={page <= 1}
					onclick={prevPage}
					class="px-3 py-1.5 border border-border rounded-md bg-card text-xs font-medium cursor-pointer text-muted-foreground inline-flex items-center transition-colors duration-150 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
				><span style="margin-right: 8px;">&lt;</span>Previous</button>
				{#each pageNumbers as p}
					{#if p === page}
						<span class="bg-[#111827] text-white w-8 h-8 rounded-md font-bold inline-flex items-center justify-center text-sm">
							{p}
						</span>
					{:else}
						<button
							onclick={() => page = p}
							class="w-8 h-8 rounded-md border border-border bg-card text-foreground font-semibold cursor-pointer text-sm transition-all duration-150 hover:bg-muted"
						>{p}</button>
					{/if}
				{/each}
				<button
					disabled={page >= totalPages}
					onclick={nextPage}
					class="px-3 py-1.5 border border-border rounded-md bg-card text-xs font-medium cursor-pointer text-muted-foreground inline-flex items-center transition-colors duration-150 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
				>Next<span style="margin-left: 8px;">&gt;</span></button>
			</div>
		</div>
	{/if}
</div>

<!-- Create / Edit Modal -->
<Modal bind:show={showForm} title={editRole ? 'Edit Role' : 'Create New Role'} onclose={attemptCloseForm}>
	{#if showConfirmation}
		<div class="fixed inset-0 bg-black/55 backdrop-blur-sm z-300 flex items-center justify-center p-6 box-border">
			<div class="bg-white border-none rounded-3xl p-8 w-full max-w-[480px] shadow-2xl flex flex-col gap-0 text-left box-border">
				<h3 class="text-xl font-bold text-black m-0 mb-2.5 font-sans">Unsaved Changes</h3>
				<p class="text-[15px] text-[#737373] m-0 mb-7 leading-normal font-sans">You have unsaved changes. Do you want to continue editing or close without saving?</p>
				<div class="flex flex-row gap-3 justify-start items-center">
					<button
						type="button"
						onclick={continueEditing}
						class="px-5 py-2.5 rounded-xl bg-white border border-neutral-200 text-black text-[15px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-neutral-50 font-sans"
					>Continue Editing</button>
					<button
						type="button"
						onclick={discardChanges}
						class="px-5 py-2.5 rounded-xl bg-pieq-tertiary border-none text-white text-[15px] font-semibold cursor-pointer transition-opacity duration-150 hover:opacity-90 font-sans"
					>Close Without Saving</button>
				</div>
			</div>
		</div>
	{/if}

	<form onsubmit={submitForm} class="flex flex-col gap-4">
		<div class="flex flex-col gap-1.5">
			<label for="role-name" class="text-[13px] font-semibold">
				Role Name <span class="text-pieq-primary">*</span>
			</label>
			<input
				id="role-name"
				type="text"
				bind:value={formName}
				oninput={() => formError = ''}
				placeholder="e.g. HR Manager"
				class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground outline-none transition-all duration-200 box-border focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/15"
			/>
			{#if formError}
				<p class="text-pieq-tertiary text-xs m-0">{formError}</p>
			{/if}
		</div>

		{#if editRole}
			<div class="flex flex-col gap-1.5">
				<span class="text-[13px] font-semibold">
					Status
				</span>
				<div class="relative w-full">
					<button
						type="button"
						onclick={(e) => { e.stopPropagation(); showModalStatusDropdown = !showModalStatusDropdown; }}
						class="w-full bg-card border-[1.5px] border-neutral-300 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground inline-flex items-center justify-between cursor-pointer transition-all duration-200 outline-none shadow-sm hover:border-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/15"
						id="role-status"
					>
						<span>{formStatus ? 'Active' : 'Inactive'}</span>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down" style="color:#737373"><path d="m6 9 6 6 6-6"/></svg>
					</button>

					{#if showModalStatusDropdown}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="absolute top-[calc(100%+4px)] left-0 z-60 bg-white border border-neutral-200 rounded-xl shadow-lg w-full p-1 flex flex-col gap-0.5"
							onclick={(e) => e.stopPropagation()}
						>
							{#each [{ value: true, label: 'Active' }, { value: false, label: 'Inactive' }] as opt}
								<button
									type="button"
									onclick={() => { formStatus = opt.value; showModalStatusDropdown = false; formError = ''; }}
									class="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium border-none bg-transparent cursor-pointer text-left rounded-lg text-foreground transition-colors duration-150 hover:bg-neutral-100"
								>
									<span>{opt.label}</span>
									{#if formStatus === opt.value}
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check" style="color:#111827"><path d="M20 6 9 17l-5-5"/></svg>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<div class="flex justify-end gap-2 pt-1">
			<button
				type="button"
				onclick={attemptCloseForm}
				disabled={formLoading}
				class="px-4.5 py-2.25 rounded-lg bg-transparent border border-border text-foreground text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors duration-200 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
			>
				Cancel
			</button>
			<button
				type="submit"
				disabled={formLoading || (editRole ? !isUpdateChanged : !isCreateEnabled)}
				class="px-4.5 py-2.25 rounded-lg bg-pieq-primary text-white border-none text-[13px] font-semibold inline-flex items-center gap-1.5 transition-opacity duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
			>
				{#if formLoading}
					<LoaderCircleIcon class="animate-spin" size={14} />
				{/if}
				{formLoading ? 'Saving...' : editRole ? 'Update' : 'Save'}
			</button>
		</div>
	</form>
</Modal>
