<script lang="ts">
	import { onMount } from 'svelte';
	import type { CompanyLocation } from '$lib/types/organization_location';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Pencil2Icon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { Modal } from '$lib/components';
	import { toast } from '$lib/toast.svelte.js';
	import { confirmation } from '$lib/confirmation.svelte.js';

	let locations = $state<CompanyLocation[]>([]);
	let page = $state(1);
	let limit = $state(10);
	let total = $state(0);
	let loading = $state(false);

	// Modal state
	let showForm = $state(false);
	let editLocation = $state<CompanyLocation | null>(null);
	let formName = $state('');
	let formError = $state('');
	let formLoading = $state(false);

	// Filter
	let filterStatus = $state<'all' | 'active' | 'inactive'>('all');

	let totalPages = $derived(Math.max(1, Math.ceil(total / limit)));

	let filteredLocations = $derived.by(() => {
		if (filterStatus === 'active') return locations.filter((loc) => loc.is_active);
		if (filterStatus === 'inactive') return locations.filter((loc) => !loc.is_active);
		return locations;
	});

	async function fetchLocations() {
		loading = true;
		try {
			const res = await fetch(`/api/organization_location?page=${page}&limit=${limit}&includeInactive=true`);
			const json = await res.json();
			if (res.ok) {
				locations = json.data ?? [];
				total = json.pagination?.total ?? 0;
			}
		} catch (e) {
			console.error('Failed to fetch locations', e);
		} finally {
			loading = false;
		}
	}

	function openCreate() {
		editLocation = null;
		formName = '';
		formError = '';
		showForm = true;
	}

	function openEdit(loc: CompanyLocation) {
		editLocation = loc;
		formName = loc.location_name;
		formError = '';
		showForm = true;
	}

	function closeForm() {
		showForm = false;
		formName = '';
		formError = '';
		editLocation = null;
	}

	async function submitForm(e: Event) {
		e.preventDefault();
		const nameTrimmed = formName.trim();
		if (!nameTrimmed) {
			formError = 'Company Location name is required.';
			toast.error(formError);
			return;
		}
		if (nameTrimmed.length < 2) {
			formError = 'Company Location name must be at least 2 characters.';
			toast.error(formError);
			return;
		}
		if (nameTrimmed.length > 255) {
			formError = 'Company Location name exceeds maximum length of 255 characters.';
			toast.error(formError);
			return;
		}
		
		const lower = nameTrimmed.toLowerCase();
		if (
			lower.includes('<script') ||
			lower.includes('script>') ||
			lower.includes('drop table') ||
			lower.includes('select ') ||
			lower.includes('--') ||
			lower.includes('/*')
		) {
			formError = 'Company Location name contains potential security threat.';
			toast.error(formError);
			return;
		}

		if (/^\d+$/.test(nameTrimmed)) {
			formError = 'Company Location name cannot contain only numbers.';
			toast.error(formError);
			return;
		}

		if (!/[A-Za-z]/.test(nameTrimmed)) {
			formError = 'Company Location name must contain at least one alphabet.';
			toast.error(formError);
			return;
		}

		if (/[A-Za-z]\d|\d[A-Za-z]/.test(nameTrimmed)) {
			formError = 'Company Location name cannot contain numbers.';
			toast.error(formError);
			return;
		}

		formLoading = true;
		formError = '';
		try {
			const url = editLocation ? `/api/organization_location/${editLocation.location_id}` : '/api/organization_location';
			const method = editLocation ? 'PUT' : 'POST';
			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ location_name: nameTrimmed })
			});
			const json = await res.json();
			if (res.ok) {
				const isEdit = !!editLocation;
				closeForm();
				await fetchLocations();
				toast.success(isEdit ? 'Company Location updated successfully' : 'Company Location created successfully');
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

	async function deactivateLocation(id: number) {
		confirmation.ask({
			title: 'Deactivate Location',
			message: 'Deactivate this location? It will remain visible but marked as inactive.',
			confirmText: 'Deactivate',
			cancelText: 'Cancel',
			isDestructive: true,
			onConfirm: async () => {
				try {
					const res = await fetch(`/api/organization_location/${id}`, { method: 'DELETE' });
					const json = await res.json();
					if (res.ok) {
						await fetchLocations();
						toast.success('Company Location deactivated successfully');
					} else {
						toast.error(json.error || 'Failed to deactivate location');
					}
				} catch {
					toast.error('Network error occurred while deactivating location');
				}
			}
		});
	}

	async function activateLocation(id: number) {
		confirmation.ask({
			title: 'Activate Location',
			message: 'Activate this location? It will be marked as active.',
			confirmText: 'Activate',
			cancelText: 'Cancel',
			isDestructive: false,
			onConfirm: async () => {
				try {
					const res = await fetch(`/api/organization_location/${id}`, { method: 'PATCH' });
					const json = await res.json();
					if (res.ok) {
						await fetchLocations();
						toast.success('Company Location activated successfully');
					} else {
						toast.error(json.error || 'Failed to activate location');
					}
				} catch {
					toast.error('Network error occurred while activating location');
				}
			}
		});
	}

	async function prevPage() {
		if (page > 1) {
			page -= 1;
			await fetchLocations();
		}
	}

	async function nextPage() {
		if (page < totalPages) {
			page += 1;
			await fetchLocations();
		}
	}

	onMount(fetchLocations);
</script>

<svelte:head>
	<title>Company Location Master – PieQ HRMS</title>
</svelte:head>

<!-- Page header -->
<div class="page-topbar">
	<div>
		<span
			style="display:inline-block;background:#C2652A1a;color:#C2652A;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:3px 10px;border-radius:99px;margin-bottom:6px"
		>HRMS Module</span>
		<h1 style="font-size:26px;font-weight:700;color:var(--foreground);margin:0;line-height:1.2">
			Company Location Master
		</h1>
		<p style="color:var(--muted-foreground);font-size:13px;margin-top:4px">
			Create and manage company office branches, headquarters, and location structures.
		</p>
	</div>

	<button class="btn-add-entity" onclick={openCreate} id="add-location-btn">
		<PlusIcon size={16} />
		Add Location
	</button>
</div>

<!-- Toolbar: filter -->
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
	<div style="display:flex;align-items:center;gap:8px">
		<span style="font-size:13px;color:var(--muted-foreground)">Filter:</span>
		<select
			bind:value={filterStatus}
			class="filter-select"
			id="location-filter-select"
		>
			<option value="all">All</option>
			<option value="active">Active</option>
			<option value="inactive">Inactive</option>
		</select>
	</div>
	<p style="font-size:12px;color:var(--muted-foreground)">
		{filteredLocations.length} of {locations.length} location{locations.length !== 1 ? 's' : ''}
	</p>
</div>

<!-- Table card -->
<div class="enterprise-table-card">
	{#if loading}
		<div style="padding:64px;text-align:center;color:var(--muted-foreground);display:flex;align-items:center;justify-content:center;gap:10px">
			<LoaderCircleIcon class="animate-spin" size={18} />
			Loading locations...
		</div>
	{:else if filteredLocations.length === 0}
		<div style="padding:64px;text-align:center;color:var(--muted-foreground)">
			{locations.length === 0
				? 'No locations found. Click Add Location to create one.'
				: 'No locations match the current filter.'}
		</div>
	{:else}
		<table style="width:100%;border-collapse:collapse">
			<thead style="background:var(--muted)">
				<tr>
					<th style="padding:12px 20px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground)">#</th>
					<th style="padding:12px 20px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground)">Location Name</th>
					<th style="padding:12px 20px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground)">Status</th>
					<th style="padding:12px 20px;text-align:right;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground)">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredLocations as loc (loc.location_id)}
					<tr
						style="border-top:1px solid var(--border);transition:background-color .2s ease"
						onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--muted)'; }}
						onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
					>
						<td style="padding:14px 20px;font-size:13px;color:var(--muted-foreground)">{loc.location_id}</td>
						<td style="padding:14px 20px">
							<div style="display:flex;align-items:center;gap:8px">
								<span style="color:#C2652A">
									<MapPinIcon size={15} />
								</span>
								<span style="font-size:14px;font-weight:600">{loc.location_name}</span>
							</div>
						</td>
						<td style="padding:14px 20px">
							{#if loc.is_active}
								<span class="badge-active">Active</span>
							{:else}
								<span class="badge-inactive">Inactive</span>
							{/if}
						</td>
						<td style="padding:14px 20px;text-align:right">
							<div style="display:flex;align-items:center;justify-content:flex-end;gap:8px">
								<button
									onclick={() => openEdit(loc)}
									aria-label="Edit location"
									title="Edit location"
									style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:7px;border:1px solid var(--border);background:none;cursor:pointer;transition:background .15s;color:var(--foreground)"
									onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--muted)')}
									onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
								>
									<Pencil2Icon size={14} />
								</button>
								{#if loc.is_active}
									<button
										onclick={() => deactivateLocation(loc.location_id)}
										aria-label="Deactivate location"
										title="Deactivate location"
										style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:7px;border:1px solid #fca5a520;background:none;cursor:pointer;transition:background .15s;color:#dc2626"
										onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.background = '#fef2f2')}
										onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
									>
										<Trash2Icon size={14} />
									</button>
								{:else}
									<button
										onclick={() => activateLocation(loc.location_id)}
										aria-label="Activate location"
										title="Activate location"
										style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:7px;border:1px solid #bbf7d040;background:none;cursor:pointer;transition:background .15s;color:#16a34a"
										onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.background = '#f0fdf4')}
										onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
									>
										<CheckIcon size={14} />
									</button>
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
				Page {page} of {totalPages} &bull; {total} total location{total !== 1 ? 's' : ''}
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
<Modal bind:show={showForm} title={editLocation ? 'Edit Location' : 'Create New Location'} onclose={closeForm}>
	<form onsubmit={submitForm} style="display:flex;flex-direction:column;gap:16px">
		<div style="display:flex;flex-direction:column;gap:6px">
			<label for="location-name" style="font-size:13px;font-weight:600">
				Location Name <span style="color:#C2652A">*</span>
			</label>
			<input
				id="location-name"
				type="text"
				bind:value={formName}
				placeholder="e.g. Chennai - HQ"
				style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:border-color .2s;box-sizing:border-box"
				onfocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#C2652A')}
				onblur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
			/>
			{#if formError}
				<p style="color:#dc2626;font-size:12px;margin:0">{formError}</p>
			{/if}
		</div>

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
				{formLoading ? 'Saving...' : editLocation ? 'Update Location' : 'Create Location'}
			</button>
		</div>
	</form>
</Modal>
