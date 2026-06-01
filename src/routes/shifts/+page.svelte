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
	let total = $state(0);
	let loading = $state(false);
	let searchQuery = $state('');

	// Modal state
	let showForm = $state(false);
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
		if (hasUnsavedChanges()) {
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

	// Create validation
	let isCreateValid = $derived.by(() => {
		const nameTrimmed = formName.trim();
		if (!nameTrimmed) return false;
		if (nameTrimmed.length < 2) return false;
		if (/\d/.test(nameTrimmed)) return false;
		if (!/^[A-Za-z ]+$/.test(nameTrimmed)) return false;
		if (nameTrimmed.length > 255) return false;
		if (!formStartTime || !formEndTime) return false;
		return true;
	});

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

	async function fetchShifts() {
		loading = true;
		try {
			const res = await fetch(`/api/shifts?page=${page}&limit=${limit}&includeInactive=true`);
			const json = await res.json();
			if (res.ok) {
				shifts = json.data ?? [];
				total = json.pagination?.total ?? 0;
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
			const url = editShift ? `/api/shifts/${editShift.cuid}` : '/api/shifts';
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
					const res = await fetch(`/api/shifts/${cuid}`, { method: 'DELETE' });
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
					const res = await fetch(`/api/shifts/${cuid}`, { method: 'PATCH' });
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
			await fetchShifts();
		}
	}

	async function nextPage() {
		if (page < totalPages) {
			page += 1;
			await fetchShifts();
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
			style="display:inline-block;background:#C2652A1a;color:#C2652A;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:3px 10px;border-radius:99px;margin-bottom:6px"
		>HRMS Module</span>
		<h1 style="font-size:26px;font-weight:700;color:var(--foreground);margin:0;line-height:1.2">
			Shift Master
		</h1>
		<p style="color:var(--muted-foreground);font-size:13px;margin-top:4px">
			Create and manage employee work shifts and timing constraints.
		</p>
	</div>

	<button class="btn-add-entity" onclick={openCreate} id="add-shift-btn">
		<PlusIcon size={16} />
		Add Shift
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
				placeholder="Search by shift name..."
				id="shift-search-input"
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
				id="shift-filter-select"
			>
				<option value="all">All</option>
				<option value="active">Active</option>
				<option value="inactive">Inactive</option>
			</select>
		</div>
	</div>
	<p style="font-size:12px;color:var(--muted-foreground)">
		{filteredShifts.length} of {shifts.length} shift{shifts.length !== 1 ? 's' : ''}
	</p>
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
			<thead style="background:var(--muted)">
				<tr>
					<th style="padding:12px 20px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground)">Shift Name</th>
					<th style="padding:12px 20px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground)">Start Time</th>
					<th style="padding:12px 20px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground)">End Time</th>
					<th style="padding:12px 20px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground)">Min Work Hours</th>
					<th style="padding:12px 20px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground)">Status</th>
					<th style="padding:12px 20px;text-align:right;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground)">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredShifts as shift (shift.cuid)}
					<tr
						style="border-top:1px solid var(--border);transition:background-color .2s ease"
						onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--muted)'; }}
						onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
					>
						<td style="padding:14px 20px">
							<div style="display:flex;align-items:center;gap:8px">
								<span style="color:#C2652A">
									<ClockIcon size={15} />
								</span>
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
				Page {page} of {totalPages} &bull; {total} total shift{total !== 1 ? 's' : ''}
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
<Modal bind:show={showForm} title={editShift ? 'Edit Shift' : 'Create New Shift'} onclose={attemptCloseForm}>
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
			<label for="shift-name" style="font-size:13px;font-weight:600">
				Shift Name <span style="color:#C2652A">*</span>
			</label>
			<input
				id="shift-name"
				type="text"
				bind:value={formName}
				placeholder="e.g. Morning Shift"
				style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:border-color .2s;box-sizing:border-box"
				onfocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#C2652A')}
				onblur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
			/>
			{#if formError}
				<p style="color:#dc2626;font-size:12px;margin:0">{formError}</p>
			{/if}
		</div>

		<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
			<div style="display:flex;flex-direction:column;gap:6px">
				<label for="shift-start-time" style="font-size:13px;font-weight:600">
					Start Time <span style="color:#C2652A">*</span>
				</label>
				<input
					id="shift-start-time"
					type="time"
					bind:value={formStartTime}
					style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:border-color .2s;box-sizing:border-box"
					onfocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#C2652A')}
					onblur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
				/>
			</div>
			<div style="display:flex;flex-direction:column;gap:6px">
				<label for="shift-end-time" style="font-size:13px;font-weight:600">
					End Time <span style="color:#C2652A">*</span>
				</label>
				<input
					id="shift-end-time"
					type="time"
					bind:value={formEndTime}
					style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:border-color .2s;box-sizing:border-box"
					onfocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#C2652A')}
					onblur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
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
				disabled={formLoading || (editShift ? !isUpdateChanged : !isCreateValid)}
				style="padding:9px 18px;border-radius:8px;background:#C2652A;color:white;border:none;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;transition:opacity 0.2s;opacity:{(formLoading || (editShift ? !isUpdateChanged : !isCreateValid)) ? 0.4 : 1};cursor:{(formLoading || (editShift ? !isUpdateChanged : !isCreateValid)) ? 'not-allowed' : 'pointer'}"
			>
				{#if formLoading}
					<LoaderCircleIcon class="animate-spin" size={14} />
				{/if}
				{formLoading ? 'Saving...' : editShift ? 'Update Shift' : 'Create Shift'}
			</button>
		</div>
	</form>
</Modal>
