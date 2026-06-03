<script lang="ts">
	import { onMount } from 'svelte';
	import type { Shift } from '$lib/types/shift';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Pencil2Icon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import CheckIcon from '@lucide/svelte/icons/check';
	import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
	import { Modal } from '$lib/components';
	import { toast } from '$lib/toast.svelte.js';
	import { confirmation } from '$lib/confirmation.svelte.js';
	import { onDestroy } from 'svelte';

	let shifts = $state<Shift[]>([]);
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

	let editShift = $state<Shift | null>(null);
	let formName = $state('');
	let formStartTime = $state('09:00');
	let formEndTime = $state('18:00');
	let formStatus = $state(true);
	let formError = $state('');
	let formLoading = $state(false);

	let showConfirmation = $state(false);

	let originalName = '';
	let originalStartTime = '';
	let originalEndTime = '';
	let originalStatus = true;

	function captureOriginalState() {
		originalName = editShift ? editShift.shift_name : '';
		originalStartTime = editShift ? formatTimeForInput(editShift.start_time) : '09:00';
		originalEndTime = editShift ? formatTimeForInput(editShift.end_time) : '18:00';
		originalStatus = editShift ? editShift.status : true;
	}

	function resetStateTracking() {
		originalName = '';
		originalStartTime = '';
		originalEndTime = '';
		originalStatus = true;
		showConfirmation = false;
		formError = '';
	}

	function hasUnsavedChanges(): boolean {
		return formName.trim() !== originalName ||
			formStartTime !== originalStartTime ||
			formEndTime !== originalEndTime ||
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
		if (!editShift) return false;
		return formName.trim() !== originalName ||
			formStartTime !== originalStartTime ||
			formEndTime !== originalEndTime ||
			formStatus !== originalStatus;
	});

	// Create enablement: enabled once required fields contain any value
	let isCreateEnabled = $derived(formName.trim() !== '' && formStartTime !== '' && formEndTime !== '');

	let activeDropdownId = $state<string | null>(null);

	let calculatedMinHours = $derived.by(() => {
		if (!formStartTime || !formEndTime) return 0;
		const [startH, startM] = formStartTime.split(':').map(Number);
		const [endH, endM] = formEndTime.split(':').map(Number);
		if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0;

		const startTotalMinutes = startH * 60 + startM;
		let endTotalMinutes = endH * 60 + endM;

		if (endTotalMinutes < startTotalMinutes) {
			// Crosses midnight (e.g. night shift)
			endTotalMinutes += 24 * 60;
		}

		const diffMinutes = endTotalMinutes - startTotalMinutes;
		const hours = diffMinutes / 60;
		return Math.round(hours * 100) / 100;
	});

	function toggleDropdown(cuid: string, event: MouseEvent) {
		event.stopPropagation();
		if (activeDropdownId === cuid) {
			activeDropdownId = null;
		} else {
			activeDropdownId = cuid;
		}
	}

	let showStatusDropdown = $state(false);

	function closeDropdowns() {
		activeDropdownId = null;
		showStatusDropdown = false;
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

	let sortedShifts = $derived.by(() => {
		let list = [...filteredShifts];
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

	let paginatedShifts = $derived(sortedShifts.slice((page - 1) * limit, page * limit));

	let totalShifts = $derived(shifts.length);
	let activeShiftsCount = $derived(shifts.filter((s) => s.status).length);
	let avgMinWorkHours = $derived.by(() => {
		if (shifts.length === 0) return 0.0;
		const sum = shifts.reduce((acc, s) => {
			const val = parseFloat(s.minimum_work_hours as any);
			return acc + (isNaN(val) ? 0 : val);
		}, 0);
		return parseFloat((sum / shifts.length).toFixed(2));
	});

	$effect(() => {
		if (page > totalPages) {
			page = totalPages;
		}
		if (page < 1) {
			page = 1;
		}
	});

	let filteredShifts = $derived.by(() => {
		let list = shifts;
		if (filterStatus === 'active') list = shifts.filter((s) => s.status);
		else if (filterStatus === 'inactive') list = shifts.filter((s) => !s.status);

		if (searchQuery.trim() !== '') {
			const query = searchQuery.toLowerCase().trim();
			list = list.filter((s) => s.shift_name.toLowerCase().includes(query));
		}
		return list;
	});

	let total = $derived(filteredShifts.length);
	let totalPages = $derived(Math.max(1, Math.ceil(total / limit)));
	let pageNumbers = $derived(Array.from({ length: totalPages }, (_, i) => i + 1));

	async function fetchShifts() {
		loading = true;
		try {
			const res = await fetch(`/api/shifts?includeInactive=true`);
			const json = await res.json();
			if (res.ok) {
				shifts = json.data ?? [];
			}
		} catch (e) {
			console.error('Failed to fetch shifts', e);
		} finally {
			loading = false;
		}
	}

	function formatTimeForInput(timeVal: any): string {
		if (!timeVal) return '00:00';
		const d = new Date(timeVal);
		if (isNaN(d.getTime())) {
			if (typeof timeVal === 'string' && timeVal.includes(':')) {
				return timeVal.slice(0, 5);
			}
			return '00:00';
		}
		const hours = String(d.getUTCHours()).padStart(2, '0');
		const minutes = String(d.getUTCMinutes()).padStart(2, '0');
		return `${hours}:${minutes}`;
	}

	function formatTimeForDisplay(timeVal: any): string {
		if (!timeVal) return 'N/A';
		const d = new Date(timeVal);
		if (isNaN(d.getTime())) {
			return String(timeVal);
		}
		const hours = String(d.getUTCHours()).padStart(2, '0');
		const minutes = String(d.getUTCMinutes()).padStart(2, '0');
		return `${hours}:${minutes}`;
	}

	function openCreate() {
		editShift = null;
		formName = '';
		formStartTime = '09:00';
		formEndTime = '18:00';
		formStatus = true;
		formError = '';
		captureOriginalState();
		showForm = true;
	}

	function openEdit(shift: Shift) {
		editShift = shift;
		formName = shift.shift_name;
		formStartTime = formatTimeForInput(shift.start_time);
		formEndTime = formatTimeForInput(shift.end_time);
		formStatus = shift.status;
		formError = '';
		captureOriginalState();
		showForm = true;
	}

	function closeForm() {
		showForm = false;
		formName = '';
		formError = '';
		editShift = null;
		resetStateTracking();
	}

	async function submitForm(e: Event) {
		e.preventDefault();
		const nameTrimmed = formName.trim();
		if (!nameTrimmed) {
			formError = 'Shift name is required.';
			toast.error(formError);
			return;
		}
		if (nameTrimmed.length < 2) {
			formError = 'Shift name must be at least 2 characters.';
			toast.error(formError);
			return;
		}
		if (/\d/.test(nameTrimmed)) {
			formError = 'Shift name cannot contain numbers.';
			toast.error(formError);
			return;
		}
		if (!/^[A-Za-z ]+$/.test(nameTrimmed)) {
			formError = 'Shift name cannot contain special characters.';
			toast.error(formError);
			return;
		}
		if (nameTrimmed.length > 255) {
			formError = 'Shift name exceeds maximum length of 255 characters.';
			toast.error(formError);
			return;
		}

		if (!formStartTime || !formEndTime) {
			formError = 'Start Time and End Time are required.';
			toast.error(formError);
			return;
		}

		formLoading = true;
		formError = '';
		try {
			const url = editShift ? `/api/shifts/shiftCuid=${editShift.cuid}` : '/api/shifts';
			const method = editShift ? 'PUT' : 'POST';

			const startTimeIso = `1970-01-01T${formStartTime}:00.000Z`;
			const endTimeIso = `1970-01-01T${formEndTime}:00.000Z`;

			const payload: any = {
				shift_name: nameTrimmed,
				start_time: startTimeIso,
				end_time: endTimeIso,
				minimum_work_hours: calculatedMinHours
			};
			if (editShift) {
				payload.status = formStatus;
			}
			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const json = await res.json();
			if (res.ok) {
				const isEdit = !!editShift;
				closeForm();
				await fetchShifts();
				toast.success(isEdit ? 'Shift updated successfully' : 'Shift created successfully');
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

	async function deactivateShift(cuid: string) {
		confirmation.ask({
			title: 'Deactivate Shift',
			message: 'Deactivate this shift? It will remain visible but marked as inactive.',
			confirmText: 'Deactivate',
			cancelText: 'Cancel',
			isDestructive: true,
			onConfirm: async () => {
				try {
					const res = await fetch(`/api/shifts/shiftCuid=${cuid}`, { method: 'DELETE' });
					const json = await res.json();
					if (res.ok) {
						await fetchShifts();
						toast.success('Shift deactivated successfully');
					} else {
						toast.error(json.error || 'Failed to deactivate shift');
					}
				} catch {
					toast.error('Network error occurred while deactivating shift');
				}
			}
		});
	}

	async function activateShift(cuid: string) {
		confirmation.ask({
			title: 'Activate Shift',
			message: 'Activate this shift? It will be marked as active.',
			confirmText: 'Activate',
			cancelText: 'Cancel',
			isDestructive: false,
			onConfirm: async () => {
				try {
					const res = await fetch(`/api/shifts/shiftCuid=${cuid}`, { method: 'PATCH' });
					const json = await res.json();
					if (res.ok) {
						await fetchShifts();
						toast.success('Shift activated successfully');
					} else {
						toast.error(json.error || 'Failed to activate shift');
					}
				} catch {
					toast.error('Network error occurred while activating shift');
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

	onMount(fetchShifts);
</script>

<svelte:head>
	<title>Shift Master – PieQ HRMS</title>
</svelte:head>

<!-- Page header -->
<div class="flex items-center justify-between mb-7 max-md:flex-col max-md:items-stretch max-md:gap-4">
	<div>
		<h1 class="text-[26px] font-bold text-foreground m-0 leading-[1.2]">
			Shift Master
		</h1>
	</div>

	<button class="inline-flex items-center gap-1.5 bg-pieq-primary text-white text-[13px] font-semibold px-4 py-2 rounded-lg no-underline transition-[background-color,transform] duration-200 hover:bg-[#a8541f] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border-none max-md:self-start" onclick={openCreate} id="add-shift-btn">
		<PlusIcon size={16} />
		Add Shift
	</button>
</div>

<!-- Stats Grid -->
<div class="grid gap-4 mb-7 grid-cols-[repeat(auto-fit,minmax(160px,1fr))] max-md:grid-cols-[repeat(auto-fit,minmax(140px,1fr))] max-md:gap-3 max-md:mb-5">
	<div class="bg-card border border-border rounded-xl p-5 shadow-sm">
		<div class="text-xs font-medium text-muted-foreground tracking-wide mb-1.5">Total Shifts</div>
		<div class="text-[32px] font-bold text-foreground leading-none tabular-nums">{totalShifts}</div>
	</div>
	<div class="bg-card border border-border rounded-xl p-5 shadow-sm">
		<div class="text-xs font-medium text-muted-foreground tracking-wide mb-1.5">Active Shifts</div>
		<div class="text-[32px] font-bold leading-none tabular-nums text-pieq-primary">{activeShiftsCount}</div>
	</div>
	<div class="bg-card border border-border rounded-xl p-5 shadow-sm">
		<div class="text-xs font-medium text-muted-foreground tracking-wide mb-1.5">Avg Min Work Hours</div>
		<div class="text-[32px] font-bold leading-none tabular-nums text-pieq-tertiary">{avgMinWorkHours} hrs</div>
	</div>
</div>

<!-- Toolbar: filter and search -->
<div class="flex items-center justify-between mb-5 gap-4 w-full max-md:flex-col max-md:items-stretch max-md:gap-3">
	<div class="relative flex-1 max-w-[500px] flex items-center max-md:max-w-full max-md:w-full">
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search absolute left-3.5 text-muted-foreground pointer-events-none"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search by shift name..."
			id="shift-search-input"
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
				id="shift-filter-select-trigger"
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
			Loading shifts...
		</div>
	{:else if filteredShifts.length === 0}
		<div class="py-16 text-center text-muted-foreground">
			{shifts.length === 0
				? 'No shifts found. Click Add Shift to create one.'
				: 'No shifts match the current filter.'}
		</div>
	{:else}
		<table class="w-full border-collapse">
			<thead class="bg-[#F9FAFB]">
				<tr class="border-b border-border">
					<th class="px-5 py-3.5 text-left text-sm font-bold text-foreground whitespace-nowrap">
						<button
							onclick={() => toggleSort('shift_name')}
							class="flex items-center gap-1.5 cursor-pointer border-none bg-transparent text-sm font-bold text-foreground p-0"
						>
							Shift Name
							{#if sortColumn === 'shift_name'}
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
							onclick={() => toggleSort('start_time')}
							class="flex items-center gap-1.5 cursor-pointer border-none bg-transparent text-sm font-bold text-foreground p-0"
						>
							Start Time
							{#if sortColumn === 'start_time'}
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
							onclick={() => toggleSort('end_time')}
							class="flex items-center gap-1.5 cursor-pointer border-none bg-transparent text-sm font-bold text-foreground p-0"
						>
							End Time
							{#if sortColumn === 'end_time'}
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
							onclick={() => toggleSort('minimum_work_hours')}
							class="flex items-center gap-1.5 cursor-pointer border-none bg-transparent text-sm font-bold text-foreground p-0"
						>
							Min Work Hours
							{#if sortColumn === 'minimum_work_hours'}
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
				{#each paginatedShifts as shift (shift.cuid)}
					<tr class="border-t border-border transition-colors duration-200 hover:bg-muted">
						<td class="px-5 py-3.5">
							<div class="flex items-center gap-2">
								<span class="text-sm font-semibold">{shift.shift_name}</span>
							</div>
						</td>
						<td class="px-5 py-3.5 text-sm">{formatTimeForDisplay(shift.start_time)}</td>
						<td class="px-5 py-3.5 text-sm">{formatTimeForDisplay(shift.end_time)}</td>
						<td class="px-5 py-3.5 text-sm font-semibold">{shift.minimum_work_hours} hrs</td>
						<td class="px-5 py-3.5">
							{#if shift.status}
								<span class="inline-flex items-center justify-center w-16 py-1 rounded-full text-[11px] font-semibold bg-[#111827] text-white">Active</span>
							{:else}
								<span class="inline-flex items-center justify-center w-16 py-1 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-700">Inactive</span>
							{/if}
						</td>
						<td class="px-5 py-3.5 text-right relative">
							<div class="inline-flex items-center justify-end">
								<button
									onclick={(e) => toggleDropdown(shift.cuid, e)}
									aria-label="Actions"
									title="Actions"
									class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-transparent cursor-pointer transition-colors duration-150 text-foreground hover:bg-muted"
								>
									<MoreVerticalIcon size={15} />
								</button>

								{#if activeDropdownId === shift.cuid}
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									<!-- svelte-ignore a11y_no_static_element_interactions -->
									<div
										class="absolute right-5 top-11 z-50 bg-background border border-border rounded-lg shadow-md min-w-[110px] py-1"
										onclick={(e) => e.stopPropagation()}
									>
										<button
											onclick={() => { openEdit(shift); activeDropdownId = null; }}
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
<Modal bind:show={showForm} title={editShift ? 'Edit Shift' : 'Create New Shift'} onclose={attemptCloseForm}>
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
			<label for="shift-name" class="text-[13px] font-semibold">
				Shift Name <span class="text-pieq-primary">*</span>
			</label>
			<input
				id="shift-name"
				type="text"
				bind:value={formName}
				oninput={() => formError = ''}
				placeholder="e.g. Morning Shift"
				class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground outline-none transition-all duration-200 box-border focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/15"
			/>
			{#if formError}
				<p class="text-pieq-tertiary text-xs m-0">{formError}</p>
			{/if}
		</div>

		<div class="grid grid-cols-2 gap-3">
			<div class="flex flex-col gap-1.5">
				<label for="shift-start-time" class="text-[13px] font-semibold">
					Start Time <span class="text-pieq-primary">*</span>
				</label>
				<input
					id="shift-start-time"
					type="time"
					bind:value={formStartTime}
					oninput={() => formError = ''}
					class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground outline-none transition-all duration-200 box-border focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/15"
				/>
			</div>
			<div class="flex flex-col gap-1.5">
				<label for="shift-end-time" class="text-[13px] font-semibold">
					End Time <span class="text-pieq-primary">*</span>
				</label>
				<input
					id="shift-end-time"
					type="time"
					bind:value={formEndTime}
					oninput={() => formError = ''}
					class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground outline-none transition-all duration-200 box-border focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/15"
				/>
			</div>
		</div>

		<div class="flex flex-col gap-1.5">
			<label for="shift-min-hours" class="text-[13px] font-semibold">
				Minimum Work Hours
			</label>
			<input
				id="shift-min-hours"
				type="text"
				value="{calculatedMinHours} hours"
				disabled
				class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-muted text-muted-foreground outline-none box-border cursor-not-allowed"
			/>
		</div>

		{#if editShift}
			<div class="flex flex-col gap-1.5">
				<label for="shift-status" class="text-[13px] font-semibold">
					Status
				</label>
				<select
					id="shift-status"
					bind:value={formStatus}
					class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground outline-none transition-all duration-200 box-border focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/15"
				>
					<option value={true}>Active</option>
					<option value={false}>Inactive</option>
				</select>
			</div>
		{/if}

		<div class="flex justify-end pt-1">
			<button
				type="submit"
				disabled={formLoading || (editShift ? !isUpdateChanged : !isCreateEnabled)}
				class="px-4.5 py-2.25 rounded-lg bg-pieq-primary text-white border-none text-[13px] font-semibold inline-flex items-center gap-1.5 transition-opacity duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
			>
				{#if formLoading}
					<LoaderCircleIcon class="animate-spin" size={14} />
				{/if}
				{formLoading ? 'Saving...' : editShift ? 'Update Shift' : 'Create Shift'}
			</button>
		</div>
	</form>
</Modal>
