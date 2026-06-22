<script lang="ts">
	import { onMount } from 'svelte';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	

	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import { toast } from '$lib/toast';
	import { createDirtyChecker } from '$lib/utils';
	import { globalIsDirty } from '$lib/stores/navigationGuard';
	import { UI_CONSTANTS } from '$lib/constants';

	import {
		Badge,
		Button,
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		Input,
		Label,
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
		CrudModal,
		TableActions,
		FilterDropdown,
		StatusDropdown,
		Pagination,
		SearchInput,
		ConfirmModal
	} from '$lib/components';
	import type { Shift } from '$lib/types/shift';
	import {
		fetchAllShifts,
		createShift,
		updateShift,
		deleteShift,
		activateShift as activateShiftApi
	} from '$lib/api/shifts';
	import { ApiError } from '$lib/api/local';
	import { confirmation } from '$lib/confirmation.svelte.js';

	let showConfirmClose = $state(false);

	function handleClose() {
		if (isDirty) {
			showConfirmClose = true;
		} else {
			isModalOpen = false;
			$globalIsDirty = false;
		}
	}
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let shiftsList = $derived<Shift[]>(data.shifts);
	let isLoading = $state(false);
	let loadError = $state('');

	let searchQuery = $state('');
	let statusFilter = $state<'all' | boolean>('all');
	let sortColumn = $state('name');
	let sortDirection = $state<'asc' | 'desc' | null>(null);

	let currentPage = $state(1);
	let pageSize = $state(10);

	// Shared Form State
	let editingShift = $state<Shift | null>(null);
	let formName = $state('');
	let formStartTime = $state('09:00');
	let formEndTime = $state('18:00');
	let formStatus = $state<boolean>(true);
	let isSubmitting = $state(false);
	let isModalOpen = $state(false);
	let isNameTouched = $state(false);
	let isMinHoursTouched = $state(false);
	let backendError = $state('');
	let formMinHoursError = $state('');
	let timingError = $state('');
	let shiftNameInput = $state<HTMLInputElement | null>(null);

	let isMinHoursManuallyEdited = $state(false);
	let formMinHours = $state(0);

	const dirtyChecker = createDirtyChecker<{
		name: string;
		start_time: string;
		end_time: string;
		minimum_work_hours: number;
		status: boolean;
	}>();
	
	let isDirty = $derived(
		isModalOpen &&
		dirtyChecker.isDirty({
			name: formName.trim(),
			start_time: formStartTime,
			end_time: formEndTime,
			minimum_work_hours: formMinHours,
			status: formStatus
		})
	);

	function getValidationError(name: string): string {
		const trimmed = name.trim();
		if (trimmed === '') {
			return 'Shift name is required';
		}
		if (trimmed.length < 2) {
			return 'Minimum 2 characters required';
		}
		if (trimmed.length > 255) {
			return 'Maximum 255 characters allowed';
		}
		if (/\d/.test(trimmed)) {
			return 'Shift name cannot contain numbers';
		}
		const regex = /^[A-Za-z\s]+$/;
		if (!regex.test(trimmed)) {
			return 'Only letters and spaces are allowed';
		}
		return '';
	}

	let nameValidationError = $derived(isNameTouched ? getValidationError(formName) : '');

	let calculatedMinHours = $derived.by(() => {
		if (!formStartTime || !formEndTime) return 0;
		const [startH, startM] = formStartTime.split(':').map(Number);
		const [endH, endM] = formEndTime.split(':').map(Number);
		if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0;

		const startTotalMinutes = startH * 60 + startM;
		let endTotalMinutes = endH * 60 + endM;

		if (endTotalMinutes < startTotalMinutes) {
			endTotalMinutes += 24 * 60;
		}

		const diffMinutes = endTotalMinutes - startTotalMinutes;
		return Math.round((diffMinutes / 60) * 100) / 100;
	});

	$effect(() => {
		if (isModalOpen && !isMinHoursManuallyEdited) {
			formMinHours = calculatedMinHours;
			formMinHoursError = '';
		}
	});

	function formatHoursReadable(hours: number): string {
		if (isNaN(hours) || hours <= 0) return '0 hrs 0 mins';
		const totalMinutes = Math.round(hours * 60);
		const h = Math.floor(totalMinutes / 60);
		const m = totalMinutes % 60;
		if (h === 0) return `${m} mins`;
		if (m === 0) return `${h} hrs`;
		return `${h} hrs ${m} mins`;
	}

	let filteredShifts = $derived.by(() => {
		let result = [...shiftsList];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			result = result.filter((shift) => shift.name.toLowerCase().includes(query));
		}

		if (statusFilter !== 'all') {
			result = result.filter((shift) => shift.status === statusFilter);
		}

		if (sortDirection && sortColumn) {
			result.sort((a, b) => {
				const valA = a[sortColumn as keyof typeof a];
				const valB = b[sortColumn as keyof typeof b];

				if (valA === null || valA === undefined) return sortDirection === 'asc' ? 1 : -1;
				if (valB === null || valB === undefined) return sortDirection === 'asc' ? -1 : 1;

				if (typeof valA === 'string' && typeof valB === 'string') {
					return sortDirection === 'asc'
						? valA.localeCompare(valB)
						: valB.localeCompare(valA);
				}
				if (typeof valA === 'boolean' && typeof valB === 'boolean') {
					const numA = valA ? 1 : 0;
					const numB = valB ? 1 : 0;
					return sortDirection === 'asc' ? numA - numB : numB - numA;
				}
				if (sortColumn === 'start_time' || sortColumn === 'end_time') {
					const dateA = new Date(valA as any).getTime();
					const dateB = new Date(valB as any).getTime();
					return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
				}
				if (sortColumn === 'minimum_work_hours') {
					const numA = Number(valA);
					const numB = Number(valB);
					return sortDirection === 'asc' ? numA - numB : numB - numA;
				}
				return 0;
			});
		}

		return result;
	});

	let totalCount = $derived(shiftsList.length);
	let paginatedShifts = $derived(filteredShifts.slice((currentPage - 1) * pageSize, currentPage * pageSize));
	let activeCount = $derived(shiftsList.filter((s) => s.status === true).length);
	let inactiveCount = $derived(shiftsList.filter((s) => s.status === false).length);

	let avgMinWorkHours = $derived.by(() => {
		if (shiftsList.length === 0) return 0.0;
		const sum = shiftsList.reduce((acc, s) => {
			const val = parseFloat(s.minimum_work_hours as any);
			return acc + (isNaN(val) ? 0 : val);
		}, 0);
		return parseFloat((sum / shiftsList.length).toFixed(2));
	});

	async function loadShifts() {
		isLoading = true;
		loadError = '';
		try {
			shiftsList = await fetchAllShifts();
		} catch (err) {
			loadError = err instanceof ApiError ? err.message : 'Failed to load shifts.';
			toast.error(loadError);
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		// Initial load provided via SSR (+page.server.ts)
	});

	function handleSort(column: string) {
		if (sortColumn === column) {
			if (sortDirection === 'asc') sortDirection = 'desc';
			else if (sortDirection === 'desc') sortDirection = null;
			else sortDirection = 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
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

	function openCreateModal() {
		editingShift = null;
		formName = '';
		formStartTime = '09:00';
		formEndTime = '18:00';
		formStatus = true;
		isNameTouched = false;
		isMinHoursTouched = false;
		backendError = '';
		formMinHoursError = '';
		timingError = '';
		isMinHoursManuallyEdited = false;
		formMinHours = 9.0; // calculated for 09:00 - 18:00
		dirtyChecker.snapshot({
			name: '',
			start_time: '09:00',
			end_time: '18:00',
			minimum_work_hours: 9.0,
			status: true
		});
		isModalOpen = true;
	}

	function openEditModal(shift: Shift) {
		editingShift = shift;
		formName = shift.name;
		formStartTime = formatTimeForInput(shift.start_time);
		formEndTime = formatTimeForInput(shift.end_time);
		formStatus = shift.status;
		isNameTouched = false;
		isMinHoursTouched = false;
		backendError = '';
		formMinHoursError = '';
		timingError = '';
		isMinHoursManuallyEdited = Number(shift.minimum_work_hours) !== calculatedMinHours;
		formMinHours = Number(shift.minimum_work_hours);
		dirtyChecker.snapshot({
			name: shift.name,
			start_time: formStartTime,
			end_time: formEndTime,
			minimum_work_hours: formMinHours,
			status: shift.status
		});
		isModalOpen = true;
	}

	async function handleSaveShift(e: Event) {
		e.preventDefault();
		if (editingShift && !isDirty) return;
		isNameTouched = true;

		const validationError = getValidationError(formName);
		if (validationError) {
			shiftNameInput?.focus();
			return;
		}

		if (formMinHours < 0 || formMinHours > calculatedMinHours) {
			formMinHoursError = `Minimum work hours must be between 0 and the total shift duration (${formatHoursReadable(calculatedMinHours)}).`;
			return;
		}

		isSubmitting = true;

		try {
			const formatTimeOnly = (timeStr: string) => {
				if (!timeStr) return '00:00:00';
				const parts = timeStr.split(':');
				if (parts.length === 2) {
					return `${timeStr}:00`;
				}
				if (parts.length === 1) {
					return `${parts[0].padStart(2, '0')}:00:00`;
				}
				return timeStr;
			};
			const startTimeOnly = formatTimeOnly(formStartTime);
			const endTimeOnly = formatTimeOnly(formEndTime);

			if (editingShift) {
				await updateShift(editingShift.cuid, {
					name: formName.trim(),
					start_time: startTimeOnly,
					end_time: endTimeOnly,
					minimum_work_hours: formMinHours,
					status: formStatus
				});
			} else {
				await createShift({
					name: formName.trim(),
					start_time: startTimeOnly,
					end_time: endTimeOnly,
					minimum_work_hours: formMinHours
				});
			}
			await loadShifts();
			toast.success(editingShift ? 'Shift updated successfully' : 'Shift created successfully');
			isModalOpen = false;
		} catch (err) {
			const errMsg = err instanceof ApiError ? err.message : 'Something went wrong.';
			if (err instanceof ApiError && (err.status === 400 || err.status === 409 || err.status === 422)) {
				const msg = errMsg.toLowerCase();
				if (msg.includes('name')) {
					backendError = errMsg;
				} else if (msg.includes('time') || msg.includes('timing')) {
					timingError = errMsg;
				} else if (msg.includes('hour') || msg.includes('duration')) {
					formMinHoursError = errMsg;
				} else {
					backendError = errMsg;
				}
			} else {
				toast.error(errMsg);
			}
			console.error(err);
		} finally {
			isSubmitting = false;
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
					await deleteShift(cuid);
					await loadShifts();
					toast.success('Shift deactivated successfully');
				} catch (err) {
					console.error(err);
					toast.error(err instanceof ApiError ? err.message : 'Failed to deactivate shift.');
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
					await activateShiftApi(cuid);
					await loadShifts();
					toast.success('Shift activated successfully');
				} catch (err) {
					console.error(err);
					toast.error(err instanceof ApiError ? err.message : 'Failed to activate shift.');
				}
			}
		});
	}
</script>

<svelte:head>
	<title>Shifts</title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-0">
	<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl wrap-break-word">Shifts</h1>
		</div>
		<Button
			type="button"
			class="bg-[#F45310] text-white hover:bg-[#F45310]/90"
			onclick={openCreateModal}
		>
			Add Shift
		</Button>
	</div>

	<!-- Metrics Cards -->
	<div class="grid gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Total Shifts</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#262626] tabular-nums">{totalCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Active Shifts</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#F45310] tabular-nums">{activeCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Avg Min Work Hours</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#800020] tabular-nums">{formatHoursReadable(avgMinWorkHours)}</CardTitle>
			</CardHeader>
		</Card>
	</div>

	<div class="space-y-3">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<SearchInput id="search_shifts" name="search_shifts" bind:value={searchQuery} oninput={() => (currentPage = 1)} placeholder="Search by shift name..." />
			<FilterDropdown value={statusFilter} onChange={(value) => { statusFilter = value; currentPage = 1; }} />
		</div>

		<Card class="py-0">
			<Table>
				<TableHeader class="bg-muted">
					<TableRow>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('name')}>
								Shift Name
							{#if sortColumn === 'name' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortColumn === 'name' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead class="text-center font-bold text-foreground text-[15px] whitespace-nowrap">Start Time</TableHead>
						<TableHead class="text-center font-bold text-foreground text-[15px] whitespace-nowrap">End Time</TableHead>
						<TableHead class="text-center font-bold text-foreground text-[15px] whitespace-nowrap">Min Work Hours</TableHead>
						<TableHead class="text-center font-bold text-foreground text-[15px] whitespace-nowrap">
							<Button variant="ghost" size="sm" class="h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('status')}>
								Status
							{#if sortColumn === 'status' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortColumn === 'status' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead class="text-right font-bold text-foreground text-[15px] whitespace-nowrap">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if isLoading}
						<TableRow>
							<TableCell colspan={6} class="py-8 text-center text-muted-foreground">
								<LoaderCircleIcon class="mx-auto mb-2 size-6 animate-spin" />
								Loading shifts...
							</TableCell>
						</TableRow>
					{:else if filteredShifts.length === 0}
						<TableRow>
							<TableCell colspan={6} class="py-8 text-center text-muted-foreground">
								{UI_CONSTANTS.EMPTY_STATE_MESSAGE}
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedShifts as shift (shift.cuid)}
							<TableRow 
								onclick={(e) => {
									if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
									openEditModal(shift);
								}} 
								class="cursor-pointer"
							>
								<TableCell>
									<span class="font-semibold">{shift.name}</span>
								</TableCell>
								<TableCell class="text-center">{formatTimeForDisplay(shift.start_time)}</TableCell>
								<TableCell class="text-center">{formatTimeForDisplay(shift.end_time)}</TableCell>
								<TableCell class="text-center">{formatHoursReadable(Number(shift.minimum_work_hours))}</TableCell>
								<TableCell class="text-center">
									<Badge variant={shift.status === true ? 'default' : 'secondary'}>{shift.status ? 'Active' : 'Inactive'}</Badge>
								</TableCell>
								<TableCell class="text-right">
									<TableActions
										canEdit={true}
										onEdit={() => openEditModal(shift)}
									/>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</Card>
		<Pagination bind:currentPage={currentPage} pageSize={pageSize} totalItems={filteredShifts.length} />
	</div>
</div>

<CrudModal
	open={isModalOpen}
	title={editingShift ? 'Edit Shift' : 'Create Shift'}
	isSubmitting={isSubmitting}
	onClose={handleClose}
>
	{#snippet children({ cancel })}
		<form class="space-y-3" onsubmit={handleSaveShift}>
			<div class="space-y-2">
				<Label for="name">Shift Name</Label>
				<Input
					id="name"
					name="name"
					bind:ref={shiftNameInput}
					bind:value={formName}
					class={nameValidationError || backendError ? 'border-destructive' : ''}
					placeholder="e.g. Morning Shift"
					oninput={() => { backendError = ''; }}
				/>
				{#if nameValidationError || backendError}
					<p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{nameValidationError || backendError}</p>
				{/if}
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="start_time">Start Time</Label>
					<Input
						id="start_time"
						name="start_time"
						type="time"
						bind:value={formStartTime}
						class={timingError ? 'border-destructive' : ''}
						oninput={() => { timingError = ''; }}
					/>
				</div>
				<div class="space-y-2">
					<Label for="end_time">End Time</Label>
					<Input
						id="end_time"
						name="end_time"
						type="time"
						bind:value={formEndTime}
						class={timingError ? 'border-destructive' : ''}
						oninput={() => { timingError = ''; }}
					/>
				</div>
			</div>
			{#if timingError}
				<p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}; margin-top: -4px; margin-bottom: 4px;">{timingError}</p>
			{/if}

			<div class="space-y-2">
				<div class="flex justify-between items-center">
					<Label for="minimum_work_hours">Minimum Work Hours</Label>
					{#if isMinHoursManuallyEdited}
						<button 
							type="button" 
							onclick={() => { isMinHoursManuallyEdited = false; }} 
							class="text-xs text-[#F45310] hover:underline bg-transparent border-none p-0 cursor-pointer"
						>
							Reset to auto
						</button>
					{/if}
				</div>
				<Input
					id="minimum_work_hours"
					name="minimum_work_hours"
					type="number"
					step="0.25"
					bind:value={formMinHours}
					class={formMinHoursError ? 'border-destructive' : ''}
					oninput={() => { isMinHoursManuallyEdited = true; formMinHoursError = ''; }}
				/>
				{#if formMinHoursError}
					<p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{formMinHoursError}</p>
				{:else}
					<p class="text-xs text-muted-foreground">
						Shift duration: {formatHoursReadable(calculatedMinHours)} (auto-calculated)
					</p>
				{/if}
			</div>

			{#if editingShift}
				<StatusDropdown id="shift_status" name="shift_status" value={formStatus} onChange={(val) => (formStatus = val)} />
			{/if}
			<div class="flex items-center justify-end gap-3 pt-4">
				<Button type="button" variant="outline" onclick={cancel} disabled={isSubmitting}>{UI_CONSTANTS.BUTTON_CANCEL}</Button>
				<Button type="submit" class="bg-[#F45310] text-white hover:bg-[#F45310]/90" disabled={isSubmitting || (!!editingShift && !isDirty)}>
					{isSubmitting ? UI_CONSTANTS.BUTTON_SAVING : (editingShift ? UI_CONSTANTS.BUTTON_UPDATE : UI_CONSTANTS.BUTTON_SAVE)}
				</Button>
			</div>
		</form>
	{/snippet}
</CrudModal>

<ConfirmModal
	open={showConfirmClose}
	title="Unsaved Changes"
	description="You have unsaved changes. Are you sure you want to close this modal?"
	confirmLabel="Cancel"
	cancelLabel="Keep Editing"
	onConfirm={() => {
		showConfirmClose = false;
		isModalOpen = false;
		$globalIsDirty = false;
	}}
	onCancel={() => {
		showConfirmClose = false;
	}}
/>
