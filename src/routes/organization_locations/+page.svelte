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

	let showModalCountryDropdown = $state(false);
	let showModalStateDropdown = $state(false);
	let showModalStatusDropdown = $state(false);

	function closeDropdowns() {
		activeDropdownId = null;
		showStatusDropdown = false;
		showCountryDropdown = false;
		showStateDropdown = false;
		showModalCountryDropdown = false;
		showModalStateDropdown = false;
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

	// Filter
	let filterStatus = $state<'all' | 'active' | 'inactive'>('all');
	let filterCountry = $state<string>('all');
	let filterState = $state<string>('all');

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

	$effect(() => {
		if (filterCountry !== 'all') {
			const activeStates = states.filter(s => s.country_cuid === filterCountry);
			if (filterState !== 'all' && !activeStates.some(s => s.cuid === filterState)) {
				filterState = 'all';
			}
		}
	});

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
				if (valA === null || valA === undefined) return sortDirection === 'asc' ? 1 : -1;
				if (valB === null || valB === undefined) return sortDirection === 'asc' ? -1 : 1;
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

	let total = $derived(filteredLocations.length);
	let totalPages = $derived(Math.max(1, Math.ceil(total / limit)));
	let pageNumbers = $derived(Array.from({ length: totalPages }, (_, i) => i + 1));

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
		showModalCountryDropdown = false;
		showModalStateDropdown = false;
		showModalStatusDropdown = false;
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
<div class="flex items-center justify-between mb-7 max-md:flex-col max-md:items-stretch max-md:gap-4">
	<div>
		<h1 class="text-[26px] font-bold text-foreground m-0 leading-[1.2]">
			Company Location Master
		</h1>
	</div>

	<button class="inline-flex items-center gap-1.5 bg-pieq-primary text-white text-[13px] font-semibold px-4 py-2 rounded-lg no-underline transition-[background-color,transform] duration-200 hover:bg-[#a8541f] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border-none max-md:self-start" onclick={openCreate} id="add-location-btn">
		<PlusIcon size={16} />
		Add Location
	</button>
</div>

<!-- Stats Grid -->
<div class="grid gap-4 mb-7 grid-cols-[repeat(auto-fit,minmax(160px,1fr))] max-md:grid-cols-[repeat(auto-fit,minmax(140px,1fr))] max-md:gap-3 max-md:mb-5">
	<div class="bg-card border border-border rounded-xl p-5 shadow-sm">
		<div class="text-xs font-medium text-muted-foreground tracking-wide mb-1.5">Total Locations</div>
		<div class="text-[32px] font-bold text-foreground leading-none tabular-nums">{totalLocations}</div>
	</div>
	<div class="bg-card border border-border rounded-xl p-5 shadow-sm">
		<div class="text-xs font-medium text-muted-foreground tracking-wide mb-1.5">Active Locations</div>
		<div class="text-[32px] font-bold leading-none tabular-nums text-pieq-primary">{activeLocationsCount}</div>
	</div>
	<div class="bg-card border border-border rounded-xl p-5 shadow-sm">
		<div class="text-xs font-medium text-muted-foreground tracking-wide mb-1.5">Inactive Locations</div>
		<div class="text-[32px] font-bold leading-none tabular-nums text-pieq-tertiary">{inactiveLocationsCount}</div>
	</div>
</div>

<!-- Toolbar: filter and search -->
<div class="flex items-center justify-between mb-5 gap-4 w-full max-md:flex-col max-md:items-stretch max-md:gap-3">
	<div class="relative flex-1 max-w-[500px] flex items-center max-md:max-w-full max-md:w-full">
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search absolute left-3.5 text-muted-foreground pointer-events-none"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search location, city, pin..."
			id="location-search-input"
			class="w-full border border-border bg-card text-foreground text-sm py-2.25 pl-10 pr-3 rounded-xl outline-none transition-all duration-200 shadow-sm focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/15"
			oninput={() => formError = ''}
		/>
	</div>
	
	<div class="flex items-center gap-3 max-md:w-full max-md:justify-between max-md:flex-wrap max-md:gap-2">
		<!-- Status Filter -->
		<div class="flex items-center gap-1.5 relative max-md:w-full max-md:flex-1 max-md:min-w-[110px]">
			<button
				onclick={(e) => { e.stopPropagation(); showStatusDropdown = !showStatusDropdown; showCountryDropdown = false; showStateDropdown = false; }}
				class="bg-card border-[1.5px] border-neutral-300 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground inline-flex items-center justify-between gap-12 min-w-[140px] cursor-pointer transition-all duration-200 outline-none shadow-sm hover:border-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/15 max-md:w-full max-md:min-w-full max-md:gap-3"
				id="location-filter-select-trigger"
			>
				<span>{selectedStatusLabel}</span>
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

		<!-- Country Filter -->
		<div class="flex items-center gap-1.5 relative max-md:w-full max-md:flex-1 max-md:min-w-[110px]">
			<button
				onclick={(e) => { e.stopPropagation(); showCountryDropdown = !showCountryDropdown; showStatusDropdown = false; showStateDropdown = false; }}
				class="bg-card border-[1.5px] border-neutral-300 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground inline-flex items-center justify-between gap-6 min-w-[175px] cursor-pointer transition-all duration-200 outline-none shadow-sm hover:border-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/15 max-md:w-full max-md:min-w-full max-md:gap-3"
				id="location-country-filter-trigger"
			>
				<span>{selectedCountryLabel}</span>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-funnel" style="color:#737373"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
			</button>

			{#if showCountryDropdown}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="absolute top-[calc(100%+4px)] right-0 z-60 bg-white border border-neutral-200 rounded-xl shadow-lg min-w-[175px] max-h-[250px] overflow-y-auto p-1 flex flex-col gap-0.5"
					onclick={(e) => e.stopPropagation()}
				>
					<button
						onclick={() => handleCountrySelect('all')}
						class="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium border-none bg-transparent cursor-pointer text-left rounded-lg text-foreground transition-colors duration-150 hover:bg-neutral-100"
					>
						<span>All Countries</span>
						{#if filterCountry === 'all'}
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check" style="color:#111827"><path d="M20 6 9 17l-5-5"/></svg>
						{/if}
					</button>
					{#each countries as c}
						<button
							onclick={() => handleCountrySelect(c.cuid)}
							class="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium border-none bg-transparent cursor-pointer text-left rounded-lg text-foreground transition-colors duration-150 hover:bg-neutral-100"
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
		<div class="flex items-center gap-1.5 relative max-md:w-full max-md:flex-1 max-md:min-w-[110px]">
			<button
				onclick={(e) => { e.stopPropagation(); showStateDropdown = !showStateDropdown; showStatusDropdown = false; showCountryDropdown = false; }}
				class="bg-card border-[1.5px] border-neutral-300 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground inline-flex items-center justify-between gap-6 min-w-[175px] cursor-pointer transition-all duration-200 outline-none shadow-sm hover:border-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/15 max-md:w-full max-md:min-w-full max-md:gap-3"
				id="location-state-filter-trigger"
			>
				<span>{selectedStateLabel}</span>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-funnel" style="color:#737373"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
			</button>

			{#if showStateDropdown}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="absolute top-[calc(100%+4px)] right-0 z-60 bg-white border border-neutral-200 rounded-xl shadow-lg min-w-[175px] max-h-[250px] overflow-y-auto p-1 flex flex-col gap-0.5"
					onclick={(e) => e.stopPropagation()}
				>
					<button
						onclick={() => handleStateSelect('all')}
						class="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium border-none bg-transparent cursor-pointer text-left rounded-lg text-foreground transition-colors duration-150 hover:bg-neutral-100"
					>
						<span>All States</span>
						{#if filterState === 'all'}
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check" style="color:#111827"><path d="M20 6 9 17l-5-5"/></svg>
						{/if}
					</button>
					{#each (filterCountry === 'all' ? states : states.filter(s => s.country_cuid === filterCountry)) as s}
						<button
							onclick={() => handleStateSelect(s.cuid)}
							class="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium border-none bg-transparent cursor-pointer text-left rounded-lg text-foreground transition-colors duration-150 hover:bg-neutral-100"
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
<div class="bg-card border border-border rounded-xl overflow-hidden shadow-sm max-md:overflow-x-auto max-md:w-full max-md:[-webkit-overflow-scrolling:touch]">
	{#if loading}
		<div class="py-16 text-center text-muted-foreground flex items-center justify-center gap-2.5">
			<LoaderCircleIcon class="animate-spin" size={18} />
			Loading locations...
		</div>
	{:else if filteredLocations.length === 0}
		<div class="py-16 text-center text-muted-foreground">
			{locations.length === 0
				? 'No locations found. Click Add Location to create one.'
				: 'No locations match the current filter.'}
		</div>
	{:else}
		<table class="w-full border-collapse">
			<thead class="bg-[#F9FAFB]">
				<tr class="border-b border-border">
					<th class="px-4 py-3.5 text-left text-sm font-bold text-foreground whitespace-nowrap">
						<button
							onclick={() => toggleSort('location_name')}
							class="flex items-center gap-1.5 cursor-pointer border-none bg-transparent text-sm font-bold text-foreground p-0"
						>
							Location Name
							{#if sortColumn === 'location_name'}
								{#if sortDirection === 'asc'}
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up ml-1.5 shrink-0"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
								{:else}
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down ml-1.5 shrink-0"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
								{/if}
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-down ml-1.5 shrink-0 opacity-40"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
							{/if}
						</button>
					</th>
					<th class="px-4 py-3.5 text-left text-sm font-bold text-foreground whitespace-nowrap">
						<button
							onclick={() => toggleSort('address_line1')}
							class="flex items-center gap-1.5 cursor-pointer border-none bg-transparent text-sm font-bold text-foreground p-0"
						>
							Address
							{#if sortColumn === 'address_line1'}
								{#if sortDirection === 'asc'}
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up ml-1.5 shrink-0"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
								{:else}
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down ml-1.5 shrink-0"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
								{/if}
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-down ml-1.5 shrink-0 opacity-40"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
							{/if}
						</button>
					</th>
					<th class="px-4 py-3.5 text-left text-sm font-bold text-foreground whitespace-nowrap">
						<button
							onclick={() => toggleSort('city')}
							class="flex items-center gap-1.5 cursor-pointer border-none bg-transparent text-sm font-bold text-foreground p-0"
						>
							City
							{#if sortColumn === 'city'}
								{#if sortDirection === 'asc'}
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up ml-1.5 shrink-0"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
								{:else}
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down ml-1.5 shrink-0"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
								{/if}
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-down ml-1.5 shrink-0 opacity-40"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
							{/if}
						</button>
					</th>
					<th class="px-4 py-3.5 text-left text-sm font-bold text-foreground whitespace-nowrap">
						<button
							onclick={() => toggleSort('state_cuid')}
							class="flex items-center gap-1.5 cursor-pointer border-none bg-transparent text-sm font-bold text-foreground p-0"
						>
							State
							{#if sortColumn === 'state_cuid'}
								{#if sortDirection === 'asc'}
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up ml-1.5 shrink-0"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
								{:else}
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down ml-1.5 shrink-0"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
								{/if}
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-down ml-1.5 shrink-0 opacity-40"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
							{/if}
						</button>
					</th>
					<th class="px-4 py-3.5 text-left text-sm font-bold text-foreground whitespace-nowrap">
						<button
							onclick={() => toggleSort('country_cuid')}
							class="flex items-center gap-1.5 cursor-pointer border-none bg-transparent text-sm font-bold text-foreground p-0"
						>
							Country
							{#if sortColumn === 'country_cuid'}
								{#if sortDirection === 'asc'}
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up ml-1.5 shrink-0"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
								{:else}
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down ml-1.5 shrink-0"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
								{/if}
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-down ml-1.5 shrink-0 opacity-40"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
							{/if}
						</button>
					</th>
					<th class="px-4 py-3.5 text-left text-sm font-bold text-foreground whitespace-nowrap">
						<button
							onclick={() => toggleSort('pin_code')}
							class="flex items-center gap-1.5 cursor-pointer border-none bg-transparent text-sm font-bold text-foreground p-0"
						>
							Pin Code
							{#if sortColumn === 'pin_code'}
								{#if sortDirection === 'asc'}
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up ml-1.5 shrink-0"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
								{:else}
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down ml-1.5 shrink-0"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
								{/if}
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-down ml-1.5 shrink-0 opacity-40"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
							{/if}
						</button>
					</th>
					<th class="px-4 py-3.5 text-left text-sm font-bold text-foreground whitespace-nowrap">
						<button
							onclick={() => toggleSort('timezone')}
							class="flex items-center gap-1.5 cursor-pointer border-none bg-transparent text-sm font-bold text-foreground p-0"
						>
							Timezone
							{#if sortColumn === 'timezone'}
								{#if sortDirection === 'asc'}
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up ml-1.5 shrink-0"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
								{:else}
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down ml-1.5 shrink-0"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
								{/if}
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-down ml-1.5 shrink-0 opacity-40"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
							{/if}
						</button>
					</th>
					<th class="px-4 py-3.5 text-left text-sm font-bold text-foreground whitespace-nowrap">
						<button
							onclick={() => toggleSort('is_active')}
							class="flex items-center gap-1.5 cursor-pointer border-none bg-transparent text-sm font-bold text-foreground p-0"
						>
							Status
							{#if sortColumn === 'is_active'}
								{#if sortDirection === 'asc'}
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up ml-1.5 shrink-0"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
								{:else}
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down ml-1.5 shrink-0"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
								{/if}
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-down ml-1.5 shrink-0 opacity-40"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
							{/if}
						</button>
					</th>
					<th class="px-4 py-3.5 text-right text-sm font-bold text-foreground whitespace-nowrap">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each paginatedLocations as loc (loc.cuid)}
					<tr class="border-t border-border transition-colors duration-200 hover:bg-muted">
						<td class="px-4 py-3.5">
							<div class="flex items-center gap-2">
								<span class="text-sm font-semibold">{loc.location_name}</span>
							</div>
						</td>
						<td class="px-4 py-3.5 text-sm">{loc.address_line1}{loc.address_line2 ? ', ' + loc.address_line2 : ''}</td>
						<td class="px-4 py-3.5 text-sm">{loc.city}</td>
						<td class="px-4 py-3.5 text-sm">{getStateName(loc.state_cuid)}</td>
						<td class="px-4 py-3.5 text-sm">{getCountryName(loc.country_cuid)}</td>
						<td class="px-4 py-3.5 text-sm">{loc.pin_code}</td>
						<td class="px-4 py-3.5 text-sm">{loc.timezone}</td>
						<td class="px-4 py-3.5">
							{#if loc.is_active}
								<span class="inline-flex items-center justify-center w-16 py-1 rounded-full text-[11px] font-semibold bg-[#111827] text-white">Active</span>
							{:else}
								<span class="inline-flex items-center justify-center w-16 py-1 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-700">Inactive</span>
							{/if}
						</td>
						<td class="px-4 py-3.5 text-right relative">
							<div class="inline-flex items-center justify-end">
								<button
									onclick={(e) => toggleDropdown(loc.cuid, e)}
									aria-label="Actions"
									title="Actions"
									class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-transparent cursor-pointer transition-colors duration-150 text-foreground hover:bg-muted"
								>
									<MoreVerticalIcon size={15} />
								</button>

								{#if activeDropdownId === loc.cuid}
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									<!-- svelte-ignore a11y_no_static_element_interactions -->
									<div
										class="absolute right-4 top-11 z-50 bg-background border border-border rounded-lg shadow-md min-w-[110px] py-1"
										onclick={(e) => e.stopPropagation()}
									>
										<button
											onclick={() => { openEdit(loc); activeDropdownId = null; }}
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
				><span class="mr-2">&lt;</span>Previous</button>
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
				>Next<span class="ml-2">&gt;</span></button>
			</div>
		</div>
	{/if}
</div>

<!-- Create / Edit Modal -->
<Modal bind:show={showForm} title={editLocation ? 'Edit Location' : 'Create New Location'} onclose={attemptCloseForm}>
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
			<label for="location-name" class="text-[13px] font-semibold">
				Location Name <span class="text-pieq-primary">*</span>
			</label>
			<input
				id="location-name"
				type="text"
				bind:value={formName}
				oninput={() => formError = ''}
				placeholder="e.g. Chennai - HQ"
				class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground outline-none transition-all duration-200 box-border focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/15"
			/>
			{#if formError}
				<p class="text-pieq-tertiary text-xs m-0">{formError}</p>
			{/if}
		</div>

		<div class="flex flex-col gap-1.5">
			<label for="location-address1" class="text-[13px] font-semibold">
				Address Line 1 <span class="text-pieq-primary">*</span>
			</label>
			<input
				id="location-address1"
				type="text"
				bind:value={formAddress1}
				oninput={() => formError = ''}
				placeholder="e.g. 123 Enterprise Way"
				class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground outline-none transition-all duration-200 box-border focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/15"
			/>
		</div>

		<div class="flex flex-col gap-1.5">
			<label for="location-address2" class="text-[13px] font-semibold">
				Address Line 2 (Optional)
			</label>
			<input
				id="location-address2"
				type="text"
				bind:value={formAddress2}
				oninput={() => formError = ''}
				placeholder="e.g. Suite 400"
				class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground outline-none transition-all duration-200 box-border focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/15"
			/>
		</div>

		<div class="grid grid-cols-2 gap-3">
			<div class="flex flex-col gap-1.5">
				<label for="location-city" class="text-[13px] font-semibold">
					City <span class="text-pieq-primary">*</span>
				</label>
				<input
					id="location-city"
					type="text"
					bind:value={formCity}
					oninput={() => formError = ''}
					placeholder="e.g. Chennai"
					class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground outline-none transition-all duration-200 box-border focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/15"
				/>
			</div>
			<div class="flex flex-col gap-1.5">
				<label for="location-pincode" class="text-[13px] font-semibold">
					Pin Code <span class="text-pieq-primary">*</span>
				</label>
				<input
					id="location-pincode"
					type="text"
					bind:value={formPinCode}
					oninput={() => formError = ''}
					placeholder="e.g. 600001"
					class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground outline-none transition-all duration-200 box-border focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/15"
				/>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-3">
			<div class="flex flex-col gap-1.5">
				<span class="text-[13px] font-semibold">
					Country <span class="text-pieq-primary">*</span>
				</span>
				<div class="relative w-full">
					<button
						type="button"
						onclick={(e) => { e.stopPropagation(); showModalCountryDropdown = !showModalCountryDropdown; showModalStateDropdown = false; showModalStatusDropdown = false; }}
						class="w-full bg-card border-[1.5px] border-neutral-300 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground inline-flex items-center justify-between cursor-pointer transition-all duration-200 outline-none shadow-sm hover:border-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/15"
						id="location-country"
					>
						<span>{countries.find(c => c.cuid === formCountryCuid)?.country_name || 'Select Country'}</span>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down" style="color:#737373"><path d="m6 9 6 6 6-6"/></svg>
					</button>

					{#if showModalCountryDropdown}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="absolute top-[calc(100%+4px)] left-0 z-60 bg-white border border-neutral-200 rounded-xl shadow-lg w-full max-h-[250px] overflow-y-auto p-1 flex flex-col gap-0.5"
							onclick={(e) => e.stopPropagation()}
						>
							<button
								type="button"
								onclick={() => { formCountryCuid = ''; formStateCuid = ''; showModalCountryDropdown = false; formError = ''; }}
								class="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium border-none bg-transparent cursor-pointer text-left rounded-lg text-foreground transition-colors duration-150 hover:bg-neutral-100"
							>
								<span>Select Country</span>
								{#if !formCountryCuid}
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check" style="color:#111827"><path d="M20 6 9 17l-5-5"/></svg>
								{/if}
							</button>
							{#each countries as country}
								<button
									type="button"
									onclick={() => { formCountryCuid = country.cuid; formStateCuid = ''; showModalCountryDropdown = false; formError = ''; }}
									class="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium border-none bg-transparent cursor-pointer text-left rounded-lg text-foreground transition-colors duration-150 hover:bg-neutral-100"
								>
									<span>{country.country_name}</span>
									{#if formCountryCuid === country.cuid}
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check" style="color:#111827"><path d="M20 6 9 17l-5-5"/></svg>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
			<div class="flex flex-col gap-1.5">
				<span class="text-[13px] font-semibold">
					State <span class="text-pieq-primary">*</span>
				</span>
				<div class="relative w-full">
					<button
						type="button"
						onclick={(e) => { e.stopPropagation(); showModalStateDropdown = !showModalStateDropdown; showModalCountryDropdown = false; showModalStatusDropdown = false; }}
						disabled={!formCountryCuid}
						class="w-full bg-card border-[1.5px] border-neutral-300 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground inline-flex items-center justify-between cursor-pointer transition-all duration-200 outline-none shadow-sm hover:border-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/15 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
						id="location-state"
					>
						<span>{filteredStates.find(s => s.cuid === formStateCuid)?.state_name || 'Select State'}</span>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down" style="color:#737373"><path d="m6 9 6 6 6-6"/></svg>
					</button>

					{#if showModalStateDropdown}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="absolute top-[calc(100%+4px)] left-0 z-60 bg-white border border-neutral-200 rounded-xl shadow-lg w-full max-h-[250px] overflow-y-auto p-1 flex flex-col gap-0.5"
							onclick={(e) => e.stopPropagation()}
						>
							<button
								type="button"
								onclick={() => { formStateCuid = ''; showModalStateDropdown = false; formError = ''; }}
								class="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium border-none bg-transparent cursor-pointer text-left rounded-lg text-foreground transition-colors duration-150 hover:bg-neutral-100"
							>
								<span>Select State</span>
								{#if !formStateCuid}
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check" style="color:#111827"><path d="M20 6 9 17l-5-5"/></svg>
								{/if}
							</button>
							{#each filteredStates as state}
								<button
									type="button"
									onclick={() => { formStateCuid = state.cuid; showModalStateDropdown = false; formError = ''; }}
									class="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium border-none bg-transparent cursor-pointer text-left rounded-lg text-foreground transition-colors duration-150 hover:bg-neutral-100"
								>
									<span>{state.state_name}</span>
									{#if formStateCuid === state.cuid}
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check" style="color:#111827"><path d="M20 6 9 17l-5-5"/></svg>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<div class="flex flex-col gap-1.5">
			<label for="location-timezone" class="text-[13px] font-semibold">
				Timezone <span class="text-pieq-primary">*</span>
			</label>
			<input
				id="location-timezone"
				type="text"
				bind:value={formTimezone}
				oninput={() => formError = ''}
				placeholder="e.g. Asia/Kolkata or UTC"
				class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground outline-none transition-all duration-200 box-border focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/15"
			/>
		</div>

		{#if editLocation}
			<div class="flex flex-col gap-1.5">
				<span class="text-[13px] font-semibold">
					Status
				</span>
				<div class="relative w-full">
					<button
						type="button"
						onclick={(e) => { e.stopPropagation(); showModalStatusDropdown = !showModalStatusDropdown; showModalCountryDropdown = false; showModalStateDropdown = false; }}
						class="w-full bg-card border-[1.5px] border-neutral-300 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground inline-flex items-center justify-between cursor-pointer transition-all duration-200 outline-none shadow-sm hover:border-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/15"
						id="location-status"
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

		<div class="flex justify-end pt-1">
			<button
				type="submit"
				disabled={formLoading || (editLocation ? !isUpdateChanged : !isCreateEnabled)}
				class="px-4.5 py-2.25 rounded-lg bg-pieq-primary text-white border-none text-[13px] font-semibold inline-flex items-center gap-1.5 transition-opacity duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
			>
				{#if formLoading}
					<LoaderCircleIcon class="animate-spin" size={14} />
				{/if}
				{formLoading ? 'Saving...' : editLocation ? 'Update Location' : 'Create Location'}
			</button>
		</div>
	</form>
</Modal>
