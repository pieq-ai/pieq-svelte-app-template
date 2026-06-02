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

	// Create enablement: enabled once required fields contain any value
	let isCreateEnabled = $derived(formName.trim() !== '' && formAddress1.trim() !== '' && formCity.trim() !== '' && formCountryCuid !== '' && formStateCuid !== '' && formPinCode.trim() !== '' && formTimezone.trim() !== '');

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

	let showStatusDropdown = $state(false);
	let showCountryDropdown = $state(false);
	let showStateDropdown = $state(false);

	function closeDropdowns() {
		activeDropdownId = null;
		showStatusDropdown = false;
		showCountryDropdown = false;
		showStateDropdown = false;
	}
	if (typeof window !== 'undefined') {
		window.addEventListener('click', closeDropdowns);
	}
	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('click', closeDropdowns);
		}
	});

	let selectedStatusLabel = $derived(
		filterStatus === 'all' ? 'All' : filterStatus === 'active' ? 'Active' : 'Inactive'
	);

	let selectedCountryLabel = $derived(
		filterCountry === 'all'
			? 'All Countries'
			: countries.find(c => c.cuid === filterCountry)?.country_name || 'All Countries'
	);

	let selectedStateLabel = $derived(
		filterState === 'all'
			? 'All States'
			: states.find(s => s.cuid === filterState)?.state_name || 'All States'
	);

	function handleStatusSelect(val: 'all' | 'active' | 'inactive') {
		filterStatus = val;
		showStatusDropdown = false;
	}

	function handleCountrySelect(val: string) {
		filterCountry = val;
		showCountryDropdown = false;
	}

	function handleStateSelect(val: string) {
		filterState = val;
		showStateDropdown = false;
	}

	// Filter
	let filterStatus = $state<'all' | 'active' | 'inactive'>('all');
	let filterCountry = $state<string>('all');
	let filterState = $state<string>('all');

	$effect(() => {
		if (filterCountry !== 'all') {
			const activeStates = states.filter(s => s.country_cuid === filterCountry);
			if (filterState !== 'all' && !activeStates.some(s => s.cuid === filterState)) {
				filterState = 'all';
			}
		}
	});

	let totalPages = $derived(Math.max(1, Math.ceil(total / limit)));
	let pageNumbers = $derived(Array.from({ length: totalPages }, (_, i) => i + 1));

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

	let sortedLocations = $derived.by(() => {
		let list = [...filteredLocations];
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

	let paginatedLocations = $derived(sortedLocations.slice((page - 1) * limit, page * limit));

	let totalLocations = $derived(locations.length);
	let activeLocationsCount = $derived(locations.filter((loc) => loc.is_active).length);
	let inactiveLocationsCount = $derived(locations.filter((loc) => !loc.is_active).length);

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

		if (filterCountry !== 'all') {
			list = list.filter((loc) => loc.country_cuid === filterCountry);
		}
		if (filterState !== 'all') {
			list = list.filter((loc) => loc.state_cuid === filterState);
		}

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
			const url = editLocation ? `/api/organization_location/locationCuid=${editLocation.cuid}` : '/api/organization_location';
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
					const res = await fetch(`/api/organization_location/locationCuid=${cuid}`, { method: 'DELETE' });
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
					const res = await fetch(`/api/organization_location/locationCuid=${cuid}`, { method: 'PATCH' });
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
			style="display:inline-block;background:#F453101a;color:#F45310;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:3px 10px;border-radius:99px;margin-bottom:6px"
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

<!-- Stats Grid -->
<div class="stats-grid">
	<div class="stat-card">
		<div class="stat-card-label">Total Locations</div>
		<div class="stat-card-value">{totalLocations}</div>
		<div style="font-size: 11px; color: var(--muted-foreground); margin-top: 6px;">Total registered company locations</div>
	</div>
	<div class="stat-card">
		<div class="stat-card-label">Active Locations</div>
		<div class="stat-card-value" style="color: #F45310">{activeLocationsCount}</div>
		<div style="font-size: 11px; color: var(--muted-foreground); margin-top: 6px;">Currently active company locations</div>
	</div>
	<div class="stat-card">
		<div class="stat-card-label">Inactive Locations</div>
		<div class="stat-card-value" style="color: #800020">{inactiveLocationsCount}</div>
		<div style="font-size: 11px; color: var(--muted-foreground); margin-top: 6px;">Currently inactive company locations</div>
	</div>
</div>

<!-- Toolbar: filter and search -->
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;gap:16px;width:100%">
	<div style="position:relative;flex:1;max-width:500px;display:flex;align-items:center">
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search" style="position:absolute;left:14px;color:var(--muted-foreground);pointer-events:none"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search location, city, pin..."
			id="location-search-input"
			style="width:100%;border:1px solid var(--border);background:var(--card);color:var(--foreground);font-size:14px;padding:9px 12px 9px 40px;border-radius:10px;outline:none;transition:all .2s;box-shadow:0 1px 2px rgba(0,0,0,0.02)"
			onfocus={(e) => {
				const t = e.currentTarget as HTMLElement;
				t.style.borderColor = '#a3a3a3';
				t.style.boxShadow = '0 0 0 4px rgba(115, 115, 115, 0.15)';
			}}
			onblur={(e) => {
				const t = e.currentTarget as HTMLElement;
				t.style.borderColor = 'var(--border)';
				t.style.boxShadow = 'none';
			}}
		/>
	</div>
	
	<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
		<!-- Status Filter -->
		<div style="position:relative;display:flex;align-items:center;">
			<button
				onclick={(e) => { e.stopPropagation(); showStatusDropdown = !showStatusDropdown; showCountryDropdown = false; showStateDropdown = false; }}
				style="background: var(--card); border: 1.5px solid #d1d5db; border-radius: 12px; padding: 10px 16px; font-size: 14px; font-weight: 500; color: var(--foreground); display: inline-flex; align-items: center; justify-content: space-between; gap: 48px; min-width: 140px; cursor: pointer; transition: all .2s; outline: none; box-shadow: 0 1px 2px rgba(0,0,0,0.02)"
				onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#a3a3a3')}
				onmouseleave={(e) => {
					const t = e.currentTarget as HTMLElement;
					if (document.activeElement !== t) {
						t.style.borderColor = '#d1d5db';
					}
				}}
				onfocus={(e) => {
					const t = e.currentTarget as HTMLElement;
					t.style.borderColor = '#a3a3a3';
					t.style.boxShadow = '0 0 0 4px rgba(115, 115, 115, 0.15)';
				}}
				onblur={(e) => {
					const t = e.currentTarget as HTMLElement;
					t.style.borderColor = '#d1d5db';
					t.style.boxShadow = 'none';
				}}
				id="location-filter-select-trigger"
			>
				<span>{selectedStatusLabel}</span>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-funnel" style="color:#737373"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
			</button>

			{#if showStatusDropdown}
				<div
					style="position: absolute; top: calc(100% + 4px); right: 0; z-index: 60; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1); min-width: 140px; padding: 4px; display: flex; flex-direction: column; gap: 2px;"
					onclick={(e) => e.stopPropagation()}
				>
					{#each [{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] as opt}
						<button
							onclick={() => handleStatusSelect(opt.value as any)}
							style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; font-size: 14px; font-weight: 500; border: none; background: none; cursor: pointer; text-align: left; border-radius: 8px; color: var(--foreground); transition: background 0.15s"
							onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.background = '#f3f4f6')}
							onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.background = 'none')}
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

		<!-- Country Filter -->
		<div style="position:relative;display:flex;align-items:center;">
			<button
				onclick={(e) => { e.stopPropagation(); showCountryDropdown = !showCountryDropdown; showStatusDropdown = false; showStateDropdown = false; }}
				style="background: var(--card); border: 1.5px solid #d1d5db; border-radius: 12px; padding: 10px 16px; font-size: 14px; font-weight: 500; color: var(--foreground); display: inline-flex; align-items: center; justify-content: space-between; gap: 24px; min-width: 175px; cursor: pointer; transition: all .2s; outline: none; box-shadow: 0 1px 2px rgba(0,0,0,0.02)"
				onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#a3a3a3')}
				onmouseleave={(e) => {
					const t = e.currentTarget as HTMLElement;
					if (document.activeElement !== t) {
						t.style.borderColor = '#d1d5db';
					}
				}}
				onfocus={(e) => {
					const t = e.currentTarget as HTMLElement;
					t.style.borderColor = '#a3a3a3';
					t.style.boxShadow = '0 0 0 4px rgba(115, 115, 115, 0.15)';
				}}
				onblur={(e) => {
					const t = e.currentTarget as HTMLElement;
					t.style.borderColor = '#d1d5db';
					t.style.boxShadow = 'none';
				}}
				id="location-country-filter-trigger"
			>
				<span>{selectedCountryLabel}</span>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-funnel" style="color:#737373"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
			</button>

			{#if showCountryDropdown}
				<div
					style="position: absolute; top: calc(100% + 4px); right: 0; z-index: 60; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1); min-width: 175px; max-height: 250px; overflow-y: auto; padding: 4px; display: flex; flex-direction: column; gap: 2px;"
					onclick={(e) => e.stopPropagation()}
				>
					<button
						onclick={() => handleCountrySelect('all')}
						style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; font-size: 14px; font-weight: 500; border: none; background: none; cursor: pointer; text-align: left; border-radius: 8px; color: var(--foreground); transition: background 0.15s"
						onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.background = '#f3f4f6')}
						onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.background = 'none')}
					>
						<span>All Countries</span>
						{#if filterCountry === 'all'}
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check" style="color:#111827"><path d="M20 6 9 17l-5-5"/></svg>
						{/if}
					</button>
					{#each countries as c}
						<button
							onclick={() => handleCountrySelect(c.cuid)}
							style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; font-size: 14px; font-weight: 500; border: none; background: none; cursor: pointer; text-align: left; border-radius: 8px; color: var(--foreground); transition: background 0.15s"
							onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.background = '#f3f4f6')}
							onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.background = 'none')}
						>
							<span>{c.country_name}</span>
							{#if filterCountry === c.cuid}
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check" style="color:#111827"><path d="M20 6 9 17l-5-5"/></svg>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- State Filter -->
		<div style="position:relative;display:flex;align-items:center;">
			<button
				onclick={(e) => { e.stopPropagation(); showStateDropdown = !showStateDropdown; showStatusDropdown = false; showCountryDropdown = false; }}
				style="background: var(--card); border: 1.5px solid #d1d5db; border-radius: 12px; padding: 10px 16px; font-size: 14px; font-weight: 500; color: var(--foreground); display: inline-flex; align-items: center; justify-content: space-between; gap: 24px; min-width: 175px; cursor: pointer; transition: all .2s; outline: none; box-shadow: 0 1px 2px rgba(0,0,0,0.02)"
				onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#a3a3a3')}
				onmouseleave={(e) => {
					const t = e.currentTarget as HTMLElement;
					if (document.activeElement !== t) {
						t.style.borderColor = '#d1d5db';
					}
				}}
				onfocus={(e) => {
					const t = e.currentTarget as HTMLElement;
					t.style.borderColor = '#a3a3a3';
					t.style.boxShadow = '0 0 0 4px rgba(115, 115, 115, 0.15)';
				}}
				onblur={(e) => {
					const t = e.currentTarget as HTMLElement;
					t.style.borderColor = '#d1d5db';
					t.style.boxShadow = 'none';
				}}
				id="location-state-filter-trigger"
			>
				<span>{selectedStateLabel}</span>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-funnel" style="color:#737373"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
			</button>

			{#if showStateDropdown}
				<div
					style="position: absolute; top: calc(100% + 4px); right: 0; z-index: 60; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1); min-width: 175px; max-height: 250px; overflow-y: auto; padding: 4px; display: flex; flex-direction: column; gap: 2px;"
					onclick={(e) => e.stopPropagation()}
				>
					<button
						onclick={() => handleStateSelect('all')}
						style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; font-size: 14px; font-weight: 500; border: none; background: none; cursor: pointer; text-align: left; border-radius: 8px; color: var(--foreground); transition: background 0.15s"
						onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.background = '#f3f4f6')}
						onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.background = 'none')}
					>
						<span>All States</span>
						{#if filterState === 'all'}
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check" style="color:#111827"><path d="M20 6 9 17l-5-5"/></svg>
						{/if}
					</button>
					{#each (filterCountry === 'all' ? states : states.filter(s => s.country_cuid === filterCountry)) as s}
						<button
							onclick={() => handleStateSelect(s.cuid)}
							style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; font-size: 14px; font-weight: 500; border: none; background: none; cursor: pointer; text-align: left; border-radius: 8px; color: var(--foreground); transition: background 0.15s"
							onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.background = '#f3f4f6')}
							onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.background = 'none')}
						>
							<span>{s.state_name}</span>
							{#if filterState === s.cuid}
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
			<thead style="background:#F9FAFB">
				<tr style="border-bottom:1px solid var(--border)">
					<th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:700;color:var(--foreground);white-space:nowrap">
						<button
							onclick={() => toggleSort('location_name')}
							style="display:flex;align-items:center;gap:6px;cursor:pointer;border:none;background:none;font-size:14px;font-weight:700;color:var(--foreground);padding:0"
						>
							Location Name
							{#if sortColumn === 'location_name'}
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
					<th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:700;color:var(--foreground);white-space:nowrap">
						<button
							onclick={() => toggleSort('address_line1')}
							style="display:flex;align-items:center;gap:6px;cursor:pointer;border:none;background:none;font-size:14px;font-weight:700;color:var(--foreground);padding:0"
						>
							Address
							{#if sortColumn === 'address_line1'}
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
					<th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:700;color:var(--foreground);white-space:nowrap">
						<button
							onclick={() => toggleSort('city')}
							style="display:flex;align-items:center;gap:6px;cursor:pointer;border:none;background:none;font-size:14px;font-weight:700;color:var(--foreground);padding:0"
						>
							City
							{#if sortColumn === 'city'}
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
					<th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:700;color:var(--foreground);white-space:nowrap">
						<button
							onclick={() => toggleSort('state_cuid')}
							style="display:flex;align-items:center;gap:6px;cursor:pointer;border:none;background:none;font-size:14px;font-weight:700;color:var(--foreground);padding:0"
						>
							State
							{#if sortColumn === 'state_cuid'}
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
					<th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:700;color:var(--foreground);white-space:nowrap">
						<button
							onclick={() => toggleSort('country_cuid')}
							style="display:flex;align-items:center;gap:6px;cursor:pointer;border:none;background:none;font-size:14px;font-weight:700;color:var(--foreground);padding:0"
						>
							Country
							{#if sortColumn === 'country_cuid'}
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
					<th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:700;color:var(--foreground);white-space:nowrap">
						<button
							onclick={() => toggleSort('pin_code')}
							style="display:flex;align-items:center;gap:6px;cursor:pointer;border:none;background:none;font-size:14px;font-weight:700;color:var(--foreground);padding:0"
						>
							Pin Code
							{#if sortColumn === 'pin_code'}
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
					<th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:700;color:var(--foreground);white-space:nowrap">
						<button
							onclick={() => toggleSort('timezone')}
							style="display:flex;align-items:center;gap:6px;cursor:pointer;border:none;background:none;font-size:14px;font-weight:700;color:var(--foreground);padding:0"
						>
							Timezone
							{#if sortColumn === 'timezone'}
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
					<th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:700;color:var(--foreground);white-space:nowrap">
						<button
							onclick={() => toggleSort('is_active')}
							style="display:flex;align-items:center;gap:6px;cursor:pointer;border:none;background:none;font-size:14px;font-weight:700;color:var(--foreground);padding:0"
						>
							Status
							{#if sortColumn === 'is_active'}
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
					<th style="padding:14px 16px;text-align:right;font-size:14px;font-weight:700;color:var(--foreground);white-space:nowrap">Actions</th>
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
											style="width:100%;display:flex;align-items:center;gap:12px;padding:8px 12px;font-size:13px;border:none;background:none;cursor:pointer;text-align:left;color:var(--foreground);transition:background .15s"
											onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--muted)')}
											onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
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
		<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-top:1px solid var(--border)">
			<p style="font-size:14px;color:var(--muted-foreground)">
				Showing {total === 0 ? 0 : (page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total} records
			</p>
			<div style="display:flex;align-items:center;gap:8px">
				<button
					disabled={page <= 1}
					onclick={prevPage}
					style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--card);font-size:13px;font-weight:500;cursor:pointer;color:var(--muted-foreground);opacity:{page <= 1 ? 0.4 : 1};display:inline-flex;align-items:center;transition:background 0.15s"
					onmouseenter={(e) => { if (page > 1) (e.currentTarget as HTMLElement).style.background = 'var(--muted)'; }}
					onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--card)'; }}
				><span style="margin-right: 8px;">&lt;</span>Previous</button>
				{#each pageNumbers as p}
					{#if p === page}
						<span style="background:#111827;color:#ffffff;width:32px;height:32px;border-radius:6px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;font-size:14px">
							{p}
						</span>
					{:else}
						<button
							onclick={() => page = p}
							style="width:32px;height:32px;border-radius:6px;border:1px solid var(--border);background:var(--card);color:var(--foreground);font-weight:600;cursor:pointer;font-size:14px;transition:all 0.15s"
							onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--muted)'; }}
							onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--card)'; }}
						>{p}</button>
					{/if}
				{/each}
				<button
					disabled={page >= totalPages}
					onclick={nextPage}
					style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--card);font-size:13px;font-weight:500;cursor:pointer;color:var(--muted-foreground);opacity:{page >= totalPages ? 0.4 : 1};display:inline-flex;align-items:center;transition:background 0.15s"
					onmouseenter={(e) => { if (page < totalPages) (e.currentTarget as HTMLElement).style.background = 'var(--muted)'; }}
					onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--card)'; }}
				>Next<span style="margin-left: 8px;">&gt;</span></button>
			</div>
		</div>
	{/if}
</div>

<!-- Create / Edit Modal -->
<Modal bind:show={showForm} title={editLocation ? 'Edit Location' : 'Create New Location'} onclose={attemptCloseForm}>
	{#if showConfirmation}
		<div style="position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);z-index:300;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box">
			<div style="background:#ffffff;border:none;border-radius:24px;padding:32px;width:100%;max-width:480px;box-shadow:0 20px 60px rgba(0,0,0,0.15);display:flex;flex-direction:column;gap:0;text-align:left;box-sizing:border-box">
				<h3 style="font-size:22px;font-weight:700;color:#000000;margin:0 0 10px 0;font-family:'Inter Variable',sans-serif">Unsaved Changes</h3>
				<p style="font-size:15px;color:#737373;margin:0 0 28px 0;line-height:1.5;font-family:'Inter Variable',sans-serif">You have unsaved changes. Do you want to continue editing or close without saving?</p>
				<div style="display:flex;flex-direction:row;gap:12px;justify-content:flex-start;align-items:center">
					<button
						type="button"
						onclick={continueEditing}
						style="padding:10px 20px;border-radius:12px;background:#ffffff;border:1px solid #e5e7eb;color:#000000;font-size:15px;font-weight:600;cursor:pointer;transition:background 0.15s;font-family:'Inter Variable',sans-serif"
						onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.background = '#f9fafb')}
						onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.background = '#ffffff')}
					>Continue Editing</button>
					<button
						type="button"
						onclick={discardChanges}
						style="padding:10px 20px;border-radius:12px;background:#800020;border:none;color:#ffffff;font-size:15px;font-weight:600;cursor:pointer;transition:opacity 0.15s;font-family:'Inter Variable',sans-serif"
						onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.9')}
						onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
					>Close Without Saving</button>
				</div>
			</div>
		</div>
	{/if}

	<form onsubmit={submitForm} style="display:flex;flex-direction:column;gap:16px">
		<div style="display:flex;flex-direction:column;gap:6px">
			<label for="location-name" style="font-size:13px;font-weight:600">
				Location Name <span style="color:#F45310">*</span>
			</label>
			<input
				id="location-name"
				type="text"
				bind:value={formName}
				oninput={() => formError = ''}
				placeholder="e.g. Chennai - HQ"
				style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:all .2s;box-sizing:border-box"
				onfocus={(e) => {
					const t = e.currentTarget as HTMLElement;
					t.style.borderColor = '#a3a3a3';
					t.style.boxShadow = '0 0 0 4px rgba(115, 115, 115, 0.15)';
				}}
				onblur={(e) => {
					const t = e.currentTarget as HTMLElement;
					t.style.borderColor = 'var(--border)';
					t.style.boxShadow = 'none';
				}}
			/>
			{#if formError}
				<p style="color:#800020;font-size:12px;margin:0">{formError}</p>
			{/if}
		</div>

		<div style="display:flex;flex-direction:column;gap:6px">
			<label for="location-address1" style="font-size:13px;font-weight:600">
				Address Line 1 <span style="color:#F45310">*</span>
			</label>
			<input
				id="location-address1"
				type="text"
				bind:value={formAddress1}
				oninput={() => formError = ''}
				placeholder="e.g. 123 Enterprise Way"
				style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:all .2s;box-sizing:border-box"
				onfocus={(e) => {
					const t = e.currentTarget as HTMLElement;
					t.style.borderColor = '#a3a3a3';
					t.style.boxShadow = '0 0 0 4px rgba(115, 115, 115, 0.15)';
				}}
				onblur={(e) => {
					const t = e.currentTarget as HTMLElement;
					t.style.borderColor = 'var(--border)';
					t.style.boxShadow = 'none';
				}}
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
				style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:all .2s;box-sizing:border-box"
				onfocus={(e) => {
					const t = e.currentTarget as HTMLElement;
					t.style.borderColor = '#a3a3a3';
					t.style.boxShadow = '0 0 0 4px rgba(115, 115, 115, 0.15)';
				}}
				onblur={(e) => {
					const t = e.currentTarget as HTMLElement;
					t.style.borderColor = 'var(--border)';
					t.style.boxShadow = 'none';
				}}
			/>
		</div>

		<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
			<div style="display:flex;flex-direction:column;gap:6px">
				<label for="location-city" style="font-size:13px;font-weight:600">
					City <span style="color:#F45310">*</span>
				</label>
				<input
					id="location-city"
					type="text"
					bind:value={formCity}
					oninput={() => formError = ''}
					placeholder="e.g. Chennai"
					style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:all .2s;box-sizing:border-box"
					onfocus={(e) => {
						const t = e.currentTarget as HTMLElement;
						t.style.borderColor = '#a3a3a3';
						t.style.boxShadow = '0 0 0 4px rgba(115, 115, 115, 0.15)';
					}}
					onblur={(e) => {
						const t = e.currentTarget as HTMLElement;
						t.style.borderColor = 'var(--border)';
						t.style.boxShadow = 'none';
					}}
				/>
			</div>
			<div style="display:flex;flex-direction:column;gap:6px">
				<label for="location-pincode" style="font-size:13px;font-weight:600">
					Pin Code <span style="color:#F45310">*</span>
				</label>
				<input
					id="location-pincode"
					type="text"
					bind:value={formPinCode}
					oninput={() => formError = ''}
					placeholder="e.g. 600001"
					style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:all .2s;box-sizing:border-box"
					onfocus={(e) => {
						const t = e.currentTarget as HTMLElement;
						t.style.borderColor = '#a3a3a3';
						t.style.boxShadow = '0 0 0 4px rgba(115, 115, 115, 0.15)';
					}}
					onblur={(e) => {
						const t = e.currentTarget as HTMLElement;
						t.style.borderColor = 'var(--border)';
						t.style.boxShadow = 'none';
					}}
				/>
			</div>
		</div>

		<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
			<div style="display:flex;flex-direction:column;gap:6px">
				<label for="location-country" style="font-size:13px;font-weight:600">
					Country <span style="color:#F45310">*</span>
				</label>
				<select
					id="location-country"
					bind:value={formCountryCuid}
					onchange={() => formError = ''}
					style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:all .2s;box-sizing:border-box"
					onfocus={(e) => {
						const t = e.currentTarget as HTMLElement;
						t.style.borderColor = '#a3a3a3';
						t.style.boxShadow = '0 0 0 4px rgba(115, 115, 115, 0.15)';
					}}
					onblur={(e) => {
						const t = e.currentTarget as HTMLElement;
						t.style.borderColor = 'var(--border)';
						t.style.boxShadow = 'none';
					}}
				>
					<option value="">Select Country</option>
					{#each countries as country}
						<option value={country.cuid}>{country.country_name}</option>
					{/each}
				</select>
			</div>
			<div style="display:flex;flex-direction:column;gap:6px">
				<label for="location-state" style="font-size:13px;font-weight:600">
					State <span style="color:#F45310">*</span>
				</label>
				<select
					id="location-state"
					bind:value={formStateCuid}
					onchange={() => formError = ''}
					disabled={!formCountryCuid}
					style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:all .2s;box-sizing:border-box;opacity:{!formCountryCuid ? 0.5 : 1}"
					onfocus={(e) => {
						const t = e.currentTarget as HTMLElement;
						t.style.borderColor = '#a3a3a3';
						t.style.boxShadow = '0 0 0 4px rgba(115, 115, 115, 0.15)';
					}}
					onblur={(e) => {
						const t = e.currentTarget as HTMLElement;
						t.style.borderColor = 'var(--border)';
						t.style.boxShadow = 'none';
					}}
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
				Timezone <span style="color:#F45310">*</span>
			</label>
			<input
				id="location-timezone"
				type="text"
				bind:value={formTimezone}
				oninput={() => formError = ''}
				placeholder="e.g. Asia/Kolkata or UTC"
				style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:all .2s;box-sizing:border-box"
				onfocus={(e) => {
					const t = e.currentTarget as HTMLElement;
					t.style.borderColor = '#a3a3a3';
					t.style.boxShadow = '0 0 0 4px rgba(115, 115, 115, 0.15)';
				}}
				onblur={(e) => {
					const t = e.currentTarget as HTMLElement;
					t.style.borderColor = 'var(--border)';
					t.style.boxShadow = 'none';
				}}
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
					style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:all .2s;box-sizing:border-box"
					onfocus={(e) => {
						const t = e.currentTarget as HTMLElement;
						t.style.borderColor = '#a3a3a3';
						t.style.boxShadow = '0 0 0 4px rgba(115, 115, 115, 0.15)';
					}}
					onblur={(e) => {
						const t = e.currentTarget as HTMLElement;
						t.style.borderColor = 'var(--border)';
						t.style.boxShadow = 'none';
					}}
				>
					<option value={true}>Active</option>
					<option value={false}>Inactive</option>
				</select>
			</div>
		{/if}

		<div style="display:flex;justify-content:flex-end;padding-top:4px">
			<button
				type="submit"
				disabled={formLoading || (editLocation ? !isUpdateChanged : !isCreateEnabled)}
				style="padding:9px 18px;border-radius:8px;background:#F45310;color:white;border:none;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;transition:opacity 0.2s;opacity:{(formLoading || (editLocation ? !isUpdateChanged : !isCreateEnabled)) ? 0.4 : 1};cursor:{(formLoading || (editLocation ? !isUpdateChanged : !isCreateEnabled)) ? 'not-allowed' : 'pointer'}"
			>
				{#if formLoading}
					<LoaderCircleIcon class="animate-spin" size={14} />
				{/if}
				{formLoading ? 'Saving...' : editLocation ? 'Update Location' : 'Create Location'}
			</button>
		</div>
	</form>
</Modal>
