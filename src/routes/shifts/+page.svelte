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
<div class="page-topbar">
	<div>
		<span
			style="display:inline-block;background:#F453101a;color:#F45310;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:3px 10px;border-radius:99px;margin-bottom:6px"
		>HRMS Module</span>
		<h1 style="font-size:26px;font-weight:700;color:var(--foreground);margin:0;line-height:1.2">
			Shift Master
		</h1>
	</div>

	<button class="btn-add-entity" onclick={openCreate} id="add-shift-btn">
		<PlusIcon size={16} />
		Add Shift
	</button>
</div>

<!-- Stats Grid -->
<div class="stats-grid">
	<div class="stat-card">
		<div class="stat-card-label">Total Shifts</div>
		<div class="stat-card-value">{totalShifts}</div>
	</div>
	<div class="stat-card">
		<div class="stat-card-label">Active Shifts</div>
		<div class="stat-card-value" style="color: #F45310">{activeShiftsCount}</div>
	</div>
	<div class="stat-card">
		<div class="stat-card-label">Avg Min Work Hours</div>
		<div class="stat-card-value" style="color: #800020">{avgMinWorkHours} hrs</div>
	</div>
</div>

<!-- Toolbar: filter and search -->
<div class="page-toolbar">
	<div class="toolbar-search-wrapper">
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search" style="position:absolute;left:14px;color:var(--muted-foreground);pointer-events:none"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search by shift name..."
			id="shift-search-input"
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
	
	<div class="toolbar-actions">
		<div style="display:flex;align-items:center;gap:6px;position:relative">
			<span style="font-size:13px;color:var(--muted-foreground)">Filter:</span>
			<button
				onclick={(e) => { e.stopPropagation(); showStatusDropdown = !showStatusDropdown; }}
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
				id="shift-filter-select-trigger"
			>
				<span>{filterStatus === 'all' ? 'All' : filterStatus === 'active' ? 'Active' : 'Inactive'}</span>
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
	</div>
</div>

<!-- Table card -->
<div class="enterprise-table-card">
	{#if loading}
		<div style="padding:64px;text-align:center;color:var(--muted-foreground);display:flex;align-items:center;justify-content:center;gap:10px">
			<LoaderCircleIcon class="animate-spin" size={18} />
			Loading shifts...
		</div>
	{:else if filteredShifts.length === 0}
		<div style="padding:64px;text-align:center;color:var(--muted-foreground)">
			{shifts.length === 0
				? 'No shifts found. Click Add Shift to create one.'
				: 'No shifts match the current filter.'}
		</div>
	{:else}
		<table style="width:100%;border-collapse:collapse">
			<thead style="background:#F9FAFB">
				<tr style="border-bottom:1px solid var(--border)">
					<th style="padding:14px 20px;text-align:left;font-size:14px;font-weight:700;color:var(--foreground);white-space:nowrap">
						<button
							onclick={() => toggleSort('shift_name')}
							style="display:flex;align-items:center;gap:6px;cursor:pointer;border:none;background:none;font-size:14px;font-weight:700;color:var(--foreground);padding:0"
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
					<th style="padding:14px 20px;text-align:left;font-size:14px;font-weight:700;color:var(--foreground);white-space:nowrap">
						<button
							onclick={() => toggleSort('start_time')}
							style="display:flex;align-items:center;gap:6px;cursor:pointer;border:none;background:none;font-size:14px;font-weight:700;color:var(--foreground);padding:0"
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
					<th style="padding:14px 20px;text-align:left;font-size:14px;font-weight:700;color:var(--foreground);white-space:nowrap">
						<button
							onclick={() => toggleSort('end_time')}
							style="display:flex;align-items:center;gap:6px;cursor:pointer;border:none;background:none;font-size:14px;font-weight:700;color:var(--foreground);padding:0"
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
					<th style="padding:14px 20px;text-align:left;font-size:14px;font-weight:700;color:var(--foreground);white-space:nowrap">
						<button
							onclick={() => toggleSort('minimum_work_hours')}
							style="display:flex;align-items:center;gap:6px;cursor:pointer;border:none;background:none;font-size:14px;font-weight:700;color:var(--foreground);padding:0"
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
					<th style="padding:14px 20px;text-align:left;font-size:14px;font-weight:700;color:var(--foreground);white-space:nowrap">
						<button
							onclick={() => toggleSort('status')}
							style="display:flex;align-items:center;gap:6px;cursor:pointer;border:none;background:none;font-size:14px;font-weight:700;color:var(--foreground);padding:0"
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
					<th style="padding:14px 20px;text-align:right;font-size:14px;font-weight:700;color:var(--foreground);white-space:nowrap">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each paginatedShifts as shift (shift.cuid)}
					<tr
						style="border-top:1px solid var(--border);transition:background-color .2s ease"
						onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--muted)'; }}
						onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
					>
						<td style="padding:14px 20px">
							<div style="display:flex;align-items:center;gap:8px">
								<span style="font-size:14px;font-weight:600">{shift.shift_name}</span>
							</div>
						</td>
						<td style="padding:14px 20px;font-size:13px">{formatTimeForDisplay(shift.start_time)}</td>
						<td style="padding:14px 20px;font-size:13px">{formatTimeForDisplay(shift.end_time)}</td>
						<td style="padding:14px 20px;font-size:13px;font-weight:600">{shift.minimum_work_hours} hrs</td>
						<td style="padding:14px 20px">
							{#if shift.status}
								<span class="badge-active">Active</span>
							{:else}
								<span class="badge-inactive">Inactive</span>
							{/if}
						</td>
						<td style="padding:14px 20px;text-align:right;position:relative">
							<div style="display:inline-flex;align-items:center;justify-content:flex-end">
								<button
									onclick={(e) => toggleDropdown(shift.cuid, e)}
									aria-label="Actions"
									title="Actions"
									style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:7px;border:1px solid var(--border);background:none;cursor:pointer;transition:background .15s;color:var(--foreground)"
									onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--muted)')}
									onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
								>
									<MoreVerticalIcon size={15} />
								</button>

								{#if activeDropdownId === shift.cuid}
									<div
										style="position:absolute;right:20px;top:44px;z-index:50;background:var(--background);border:1px solid var(--border);border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.08);min-width:110px;padding:4px 0"
										onclick={(e) => e.stopPropagation()}
									>
										<button
											onclick={() => { openEdit(shift); activeDropdownId = null; }}
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
<Modal bind:show={showForm} title={editShift ? 'Edit Shift' : 'Create New Shift'} onclose={attemptCloseForm}>
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
			<label for="shift-name" style="font-size:13px;font-weight:600">
				Shift Name <span style="color:#F45310">*</span>
			</label>
			<input
				id="shift-name"
				type="text"
				bind:value={formName}
				oninput={() => formError = ''}
				placeholder="e.g. Morning Shift"
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

		<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
			<div style="display:flex;flex-direction:column;gap:6px">
				<label for="shift-start-time" style="font-size:13px;font-weight:600">
					Start Time <span style="color:#F45310">*</span>
				</label>
				<input
					id="shift-start-time"
					type="time"
					bind:value={formStartTime}
					oninput={() => formError = ''}
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
				<label for="shift-end-time" style="font-size:13px;font-weight:600">
					End Time <span style="color:#F45310">*</span>
				</label>
				<input
					id="shift-end-time"
					type="time"
					bind:value={formEndTime}
					oninput={() => formError = ''}
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

		<div style="display:flex;flex-direction:column;gap:6px">
			<label for="shift-min-hours" style="font-size:13px;font-weight:600">
				Minimum Work Hours
			</label>
			<input
				id="shift-min-hours"
				type="text"
				value="{calculatedMinHours} hours"
				disabled
				style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--muted);color:var(--muted-foreground);outline:none;box-sizing:border-box;cursor:not-allowed"
			/>
		</div>

		{#if editShift}
			<div style="display:flex;flex-direction:column;gap:6px">
				<label for="shift-status" style="font-size:13px;font-weight:600">
					Status
				</label>
				<select
					id="shift-status"
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
				disabled={formLoading || (editShift ? !isUpdateChanged : !isCreateEnabled)}
				style="padding:9px 18px;border-radius:8px;background:#F45310;color:white;border:none;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;transition:opacity 0.2s;opacity:{(formLoading || (editShift ? !isUpdateChanged : !isCreateEnabled)) ? 0.4 : 1};cursor:{(formLoading || (editShift ? !isUpdateChanged : !isCreateEnabled)) ? 'not-allowed' : 'pointer'}"
			>
				{#if formLoading}
					<LoaderCircleIcon class="animate-spin" size={14} />
				{/if}
				{formLoading ? 'Saving...' : editShift ? 'Update Shift' : 'Create Shift'}
			</button>
		</div>
	</form>
</Modal>
