<script lang="ts">
	import { onMount } from 'svelte';
	import type { CompanyLocation } from '$lib/types/organization_location';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Pencil2Icon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import CheckIcon from '@lucide/svelte/icons/check';
	import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
	import { Modal } from '$lib/components';
	import { toast } from '$lib/toast.svelte.js';
	import { confirmation } from '$lib/confirmation.svelte.js';
	import { onDestroy } from 'svelte';

	let locations = $state<CompanyLocation[]>([]);
	let page = $state(1);
	let limit = $state(10);
	let total = $derived(filteredLocations.length);
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

	let editLocation = $state<CompanyLocation | null>(null);
	let formName = $state('');
	let formAddress1 = $state('');
	let formAddress2 = $state('');
	let formCity = $state('');
	let formStateCuid = $state('');
	let formCountryCuid = $state('');
	let formPinCode = $state('');
	let formTimezone = $state('');
	let formStatus = $state(true);
	let formError = $state('');
	let formLoading = $state(false);

	let showConfirmation = $state(false);

	let originalName = '';
	let originalAddress1 = '';
	let originalAddress2 = '';
	let originalCity = '';
	let originalStateCuid = '';
	let originalCountryCuid = '';
	let originalPinCode = '';
	let originalTimezone = '';
	let originalStatus = true;

	function captureOriginalState() {
		originalName = editLocation ? editLocation.location_name : '';
		originalAddress1 = editLocation ? editLocation.address_line1 : '';
		originalAddress2 = editLocation ? (editLocation.address_line2 ?? '') : '';
		originalCity = editLocation ? editLocation.city : '';
		originalStateCuid = editLocation ? editLocation.state_cuid : '';
		originalCountryCuid = editLocation ? editLocation.country_cuid : '';
		originalPinCode = editLocation ? editLocation.pin_code : '';
		originalTimezone = editLocation ? (editLocation.timezone ?? 'UTC') : 'UTC';
		originalStatus = editLocation ? editLocation.is_active : true;
	}

	function resetStateTracking() {
		originalName = '';
		originalAddress1 = '';
		originalAddress2 = '';
		originalCity = '';
		originalStateCuid = '';
		originalCountryCuid = '';
		originalPinCode = '';
		originalTimezone = '';
		originalStatus = true;
		showConfirmation = false;
		formError = '';
	}

	function hasUnsavedChanges(): boolean {
		return formName.trim() !== originalName ||
			formAddress1.trim() !== originalAddress1 ||
			formAddress2.trim() !== originalAddress2 ||
			formCity.trim() !== originalCity ||
			formStateCuid !== originalStateCuid ||
			formCountryCuid !== originalCountryCuid ||
			formPinCode.trim() !== originalPinCode ||
			formTimezone.trim() !== originalTimezone ||
			formStatus !== originalStatus;
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
		if (!editLocation) return false;
		return formName.trim() !== originalName ||
			formAddress1.trim() !== originalAddress1 ||
			formAddress2.trim() !== originalAddress2 ||
			formCity.trim() !== originalCity ||
			formStateCuid !== originalStateCuid ||
			formCountryCuid !== originalCountryCuid ||
			formPinCode.trim() !== originalPinCode ||
			formTimezone.trim() !== originalTimezone ||
			formStatus !== originalStatus;
	});

	// Create validation
	let isCreateValid = $derived.by(() => {
		const nameTrimmed = formName.trim();
		if (!nameTrimmed || nameTrimmed.length < 2 || nameTrimmed.length > 255) return false;

		const address1Trimmed = formAddress1.trim();
		const cityTrimmed = formCity.trim();
		const pinTrimmed = formPinCode.trim();
		const tzTrimmed = formTimezone.trim();

		if (!address1Trimmed || !cityTrimmed || !formCountryCuid || !formStateCuid || !pinTrimmed || !tzTrimmed) return false;

		const lower = nameTrimmed.toLowerCase();
		if (
			lower.includes('<script') ||
			lower.includes('script>') ||
			lower.includes('drop table') ||
			lower.includes('select ') ||
			lower.includes('--') ||
			lower.includes('/*')
		) return false;

		if (/^\d+$/.test(nameTrimmed)) return false;
		if (!/[A-Za-z]/.test(nameTrimmed)) return false;
		if (/[A-Za-z]\d|\d[A-Za-z]/.test(nameTrimmed)) return false;

		return true;
	});

	// Dropdown choices
	let countries = $state<any[]>([]);
	let states = $state<any[]>([]);

	let filteredStates = $derived(states.filter(s => s.country_cuid === formCountryCuid));

	async function fetchDropdowns() {
		try {
			const resCountries = await fetch('/api/countries');
			const jsonCountries = await resCountries.json();
			if (resCountries.ok) {
				countries = jsonCountries.data ?? [];
			}
			const resStates = await fetch('/api/states');
			const jsonStates = await resStates.json();
			if (resStates.ok) {
				states = jsonStates.data ?? [];
			}
		} catch (e) {
			console.error('Failed to fetch dropdown choices', e);
		}
	}

	function getCountryName(countryCuid: string): string {
		const country = countries.find(c => c.cuid === countryCuid);
		return country ? country.country_name : countryCuid;
	}

	function getStateName(stateCuid: string): string {
		const state = states.find(s => s.cuid === stateCuid);
		return state ? state.state_name : stateCuid;
	}

	function formatDate(dateVal: any): string {
		if (!dateVal) return 'N/A';
		const d = new Date(dateVal);
		return d.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

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
	let paginatedLocations = $derived(filteredLocations.slice((page - 1) * limit, page * limit));

	$effect(() => {
		if (page > totalPages) {
			page = totalPages;
		}
		if (page < 1) {
			page = 1;
		}
	});

	let filteredLocations = $derived.by(() => {
		let list = locations;
		if (filterStatus === 'active') list = locations.filter((loc) => loc.is_active);
		else if (filterStatus === 'inactive') list = locations.filter((loc) => !loc.is_active);

		if (searchQuery.trim() !== '') {
			const query = searchQuery.toLowerCase().trim();
			list = list.filter((loc) => {
				const locName = (loc.location_name ?? '').toLowerCase();
				const city = (loc.city ?? '').toLowerCase();
				const stateName = getStateName(loc.state_cuid ?? '').toLowerCase();
				const countryName = getCountryName(loc.country_cuid ?? '').toLowerCase();
				const pinCode = (loc.pin_code ?? '').toLowerCase();

				return (
					locName.includes(query) ||
					city.includes(query) ||
					stateName.includes(query) ||
					countryName.includes(query) ||
					pinCode.includes(query)
				);
			});
		}
		return list;
	});

	async function fetchLocations() {
		loading = true;
		try {
			const res = await fetch(`/api/organization_location?includeInactive=true`);
			const json = await res.json();
			if (res.ok) {
				locations = json.data ?? [];
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
		formAddress1 = '';
		formAddress2 = '';
		formCity = '';
		formCountryCuid = '';
		formStateCuid = '';
		formPinCode = '';
		formTimezone = 'UTC';
		formStatus = true;
		formError = '';
		captureOriginalState();
		showForm = true;
	}

	function openEdit(loc: CompanyLocation) {
		editLocation = loc;
		formName = loc.location_name;
		formAddress1 = loc.address_line1 ?? '';
		formAddress2 = loc.address_line2 ?? '';
		formCity = loc.city ?? '';
		formCountryCuid = loc.country_cuid ?? '';
		formStateCuid = loc.state_cuid ?? '';
		formPinCode = loc.pin_code ?? '';
		formTimezone = loc.timezone ?? 'UTC';
		formStatus = loc.is_active;
		formError = '';
		captureOriginalState();
		showForm = true;
	}

	function closeForm() {
		showForm = false;
		formName = '';
		formAddress1 = '';
		formAddress2 = '';
		formCity = '';
		formCountryCuid = '';
		formStateCuid = '';
		formPinCode = '';
		formTimezone = '';
		formError = '';
		editLocation = null;
		resetStateTracking();
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

		const address1Trimmed = formAddress1.trim();
		const cityTrimmed = formCity.trim();
		const pinTrimmed = formPinCode.trim();
		const tzTrimmed = formTimezone.trim();

		if (!address1Trimmed) {
			formError = 'Address Line 1 is required.';
			toast.error(formError);
			return;
		}
		if (!cityTrimmed) {
			formError = 'City is required.';
			toast.error(formError);
			return;
		}
		if (!formCountryCuid) {
			formError = 'Country is required.';
			toast.error(formError);
			return;
		}
		if (!formStateCuid) {
			formError = 'State is required.';
			toast.error(formError);
			return;
		}
		if (!pinTrimmed) {
			formError = 'Pin Code is required.';
			toast.error(formError);
			return;
		}
		if (!tzTrimmed) {
			formError = 'Timezone is required.';
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

		try {
			const url = editLocation ? `/api/organization_location/${editLocation.cuid}` : '/api/organization_location';
			const method = editLocation ? 'PUT' : 'POST';
			const payload: any = {
				location_name: nameTrimmed,
				address_line1: address1Trimmed,
				address_line2: formAddress2 ? formAddress2.trim() : null,
				city: cityTrimmed,
				state_cuid: formStateCuid,
				country_cuid: formCountryCuid,
				pin_code: pinTrimmed,
				timezone: tzTrimmed
			};
			if (editLocation) {
				payload.is_active = formStatus;
			}
			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
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

	async function deactivateLocation(cuid: string) {
		confirmation.ask({
			title: 'Deactivate Location',
			message: 'Deactivate this location? It will remain visible but marked as inactive.',
			confirmText: 'Deactivate',
			cancelText: 'Cancel',
			isDestructive: true,
			onConfirm: async () => {
				try {
					const res = await fetch(`/api/organization_location/${cuid}`, { method: 'DELETE' });
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

	async function activateLocation(cuid: string) {
		confirmation.ask({
			title: 'Activate Location',
			message: 'Activate this location? It will be marked as active.',
			confirmText: 'Activate',
			cancelText: 'Cancel',
			isDestructive: false,
			onConfirm: async () => {
				try {
					const res = await fetch(`/api/organization_location/${cuid}`, { method: 'PATCH' });
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
		}
	}

	async function nextPage() {
		if (page < totalPages) {
			page += 1;
		}
	}

	onMount(async () => {
		await fetchLocations();
		await fetchDropdowns();
	});
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

<!-- Toolbar: filter and search -->
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:16px;flex-wrap:wrap">
	<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
		<div style="display:flex;align-items:center;gap:8px">
			<span style="font-size:13px;color:var(--muted-foreground)">Search:</span>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search location, city, pin..."
				id="location-search-input"
				style="border:1px solid var(--border);background:var(--card);color:var(--foreground);font-size:13px;padding:6px 12px;border-radius:8px;outline:none;transition:border-color .2s;min-width:220px"
				onfocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--pieq-primary)')}
				onblur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
			/>
		</div>
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
					<th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground)">Location Name</th>
					<th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground)">Address</th>
					<th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground)">City</th>
					<th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground)">State</th>
					<th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground)">Country</th>
					<th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground)">Pin Code</th>
					<th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground)">Timezone</th>
					<th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground)">Status</th>
					<th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground)">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each paginatedLocations as loc (loc.cuid)}
					<tr
						style="border-top:1px solid var(--border);transition:background-color .2s ease"
						onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--muted)'; }}
						onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
					>
						<td style="padding:14px 16px">
							<div style="display:flex;align-items:center;gap:8px">
								<span style="color:#C2652A">
									<MapPinIcon size={15} />
								</span>
								<span style="font-size:14px;font-weight:600">{loc.location_name}</span>
							</div>
						</td>
						<td style="padding:14px 16px;font-size:13px">{loc.address_line1}{loc.address_line2 ? ', ' + loc.address_line2 : ''}</td>
						<td style="padding:14px 16px;font-size:13px">{loc.city}</td>
						<td style="padding:14px 16px;font-size:13px">{getStateName(loc.state_cuid)}</td>
						<td style="padding:14px 16px;font-size:13px">{getCountryName(loc.country_cuid)}</td>
						<td style="padding:14px 16px;font-size:13px">{loc.pin_code}</td>
						<td style="padding:14px 16px;font-size:13px">{loc.timezone}</td>
						<td style="padding:14px 16px">
							{#if loc.is_active}
								<span class="badge-active">Active</span>
							{:else}
								<span class="badge-inactive">Inactive</span>
							{/if}
						</td>
						<td style="padding:14px 16px;text-align:right;position:relative">
							<div style="display:inline-flex;align-items:center;justify-content:flex-end">
								<button
									onclick={(e) => toggleDropdown(loc.cuid, e)}
									aria-label="Actions"
									title="Actions"
									style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:7px;border:1px solid var(--border);background:none;cursor:pointer;transition:background .15s;color:var(--foreground)"
									onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--muted)')}
									onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
								>
									<MoreVerticalIcon size={15} />
								</button>
 
								{#if activeDropdownId === loc.cuid}
									<div
										style="position:absolute;right:20px;top:44px;z-index:50;background:var(--background);border:1px solid var(--border);border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.08);min-width:110px;padding:4px 0"
										onclick={(e) => e.stopPropagation()}
									>
										<button
											onclick={() => { openEdit(loc); activeDropdownId = null; }}
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
<Modal bind:show={showForm} title={editLocation ? 'Edit Location' : 'Create New Location'} onclose={attemptCloseForm}>
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
			<label for="location-name" style="font-size:13px;font-weight:600">
				Location Name <span style="color:#C2652A">*</span>
			</label>
			<input
				id="location-name"
				type="text"
				bind:value={formName}
				oninput={() => formError = ''}
				placeholder="e.g. Chennai - HQ"
				style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:border-color .2s;box-sizing:border-box"
				onfocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#C2652A')}
				onblur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
			/>
			{#if formError}
				<p style="color:#dc2626;font-size:12px;margin:0">{formError}</p>
			{/if}
		</div>

		<div style="display:flex;flex-direction:column;gap:6px">
			<label for="location-address1" style="font-size:13px;font-weight:600">
				Address Line 1 <span style="color:#C2652A">*</span>
			</label>
			<input
				id="location-address1"
				type="text"
				bind:value={formAddress1}
				oninput={() => formError = ''}
				placeholder="e.g. 123 Enterprise Way"
				style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:border-color .2s;box-sizing:border-box"
				onfocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#C2652A')}
				onblur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
			/>
		</div>

		<div style="display:flex;flex-direction:column;gap:6px">
			<label for="location-address2" style="font-size:13px;font-weight:600">
				Address Line 2 (Optional)
			</label>
			<input
				id="location-address2"
				type="text"
				bind:value={formAddress2}
				oninput={() => formError = ''}
				placeholder="e.g. Suite 400"
				style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:border-color .2s;box-sizing:border-box"
				onfocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#C2652A')}
				onblur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
			/>
		</div>

		<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
			<div style="display:flex;flex-direction:column;gap:6px">
				<label for="location-city" style="font-size:13px;font-weight:600">
					City <span style="color:#C2652A">*</span>
				</label>
				<input
					id="location-city"
					type="text"
					bind:value={formCity}
					oninput={() => formError = ''}
					placeholder="e.g. Chennai"
					style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:border-color .2s;box-sizing:border-box"
					onfocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#C2652A')}
					onblur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
				/>
			</div>
			<div style="display:flex;flex-direction:column;gap:6px">
				<label for="location-pincode" style="font-size:13px;font-weight:600">
					Pin Code <span style="color:#C2652A">*</span>
				</label>
				<input
					id="location-pincode"
					type="text"
					bind:value={formPinCode}
					oninput={() => formError = ''}
					placeholder="e.g. 600001"
					style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:border-color .2s;box-sizing:border-box"
					onfocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#C2652A')}
					onblur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
				/>
			</div>
		</div>

		<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
			<div style="display:flex;flex-direction:column;gap:6px">
				<label for="location-country" style="font-size:13px;font-weight:600">
					Country <span style="color:#C2652A">*</span>
				</label>
				<select
					id="location-country"
					bind:value={formCountryCuid}
					onchange={() => formError = ''}
					style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:border-color .2s;box-sizing:border-box"
					onfocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#C2652A')}
					onblur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
				>
					<option value="">Select Country</option>
					{#each countries as country}
						<option value={country.cuid}>{country.country_name}</option>
					{/each}
				</select>
			</div>
			<div style="display:flex;flex-direction:column;gap:6px">
				<label for="location-state" style="font-size:13px;font-weight:600">
					State <span style="color:#C2652A">*</span>
				</label>
				<select
					id="location-state"
					bind:value={formStateCuid}
					onchange={() => formError = ''}
					disabled={!formCountryCuid}
					style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:border-color .2s;box-sizing:border-box;opacity:{!formCountryCuid ? 0.5 : 1}"
					onfocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#C2652A')}
					onblur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
				>
					<option value="">Select State</option>
					{#each filteredStates as state}
						<option value={state.cuid}>{state.state_name}</option>
					{/each}
				</select>
			</div>
		</div>

		<div style="display:flex;flex-direction:column;gap:6px">
			<label for="location-timezone" style="font-size:13px;font-weight:600">
				Timezone <span style="color:#C2652A">*</span>
			</label>
			<input
				id="location-timezone"
				type="text"
				bind:value={formTimezone}
				oninput={() => formError = ''}
				placeholder="e.g. Asia/Kolkata or UTC"
				style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:border-color .2s;box-sizing:border-box"
				onfocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#C2652A')}
				onblur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
			/>
		</div>

		{#if editLocation}
			<div style="display:flex;flex-direction:column;gap:6px">
				<label for="location-status" style="font-size:13px;font-weight:600">
					Status
				</label>
				<select
					id="location-status"
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
				disabled={formLoading || (editLocation ? !isUpdateChanged : !isCreateValid)}
				style="padding:9px 18px;border-radius:8px;background:#C2652A;color:white;border:none;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;transition:opacity 0.2s;opacity:{(formLoading || (editLocation ? !isUpdateChanged : !isCreateValid)) ? 0.4 : 1};cursor:{(formLoading || (editLocation ? !isUpdateChanged : !isCreateValid)) ? 'not-allowed' : 'pointer'}"
			>
				{#if formLoading}
					<LoaderCircleIcon class="animate-spin" size={14} />
				{/if}
				{formLoading ? 'Saving...' : editLocation ? 'Update Location' : 'Create Location'}
			</button>
		</div>
	</form>
</Modal>
