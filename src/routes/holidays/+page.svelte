<script lang="ts">
	import { slide } from 'svelte/transition';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { goto, invalidateAll, beforeNavigate } from '$app/navigation';
	import { SvelteDate } from 'svelte/reactivity';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
	import {
		Alert,
		AlertDescription,
		Badge,
		Button,
		Card,
		CardDescription,
		CardHeader,
		CardTitle,
		Input,
		Label,
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
		toast,
		ConfirmModal,
		FormModal
	} from '$lib/components/ui';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let form = $state<{ error?: string; field?: string; action?: string } | null>(null);

	let searchQuery = $state('');
	let filterType = $state<string>('all');
	let isSubmitting = $state(false);
	let isFormModalOpen = $state(false);

	// Confirm Modal states
	let isConfirmOpen = $state(false);
	let confirmTitle = $state('');
	let confirmMessage = $state('');
	let activeDeleteCuid = $state<string | null>(null);

	let activeMenuCuid = $state<string | null>(null);
	let menuPosition = $state({ top: 0, left: 0 });

	function toggleMenu(cuid: string, event: MouseEvent) {
		event.stopPropagation();
		if (activeMenuCuid === cuid) {
			activeMenuCuid = null;
		} else {
			const rect = (event.currentTarget as HTMLButtonElement).getBoundingClientRect();
			menuPosition = {
				top: rect.bottom,
				left: rect.right - 112 // width of w-28 is 112px
			};
			activeMenuCuid = cuid;
		}
	}

	// Close kebab menu on click outside or scroll
	$effect(() => {
		const handleDismiss = () => {
			activeMenuCuid = null;
		};
		document.addEventListener('click', handleDismiss);
		window.addEventListener('scroll', handleDismiss, { passive: true });
		return () => {
			document.removeEventListener('click', handleDismiss);
			window.removeEventListener('scroll', handleDismiss);
		};
	});

	function openAddModal() {
		holidayName = '';
		holidayDate = '';
		holidayType = 'National';
		isFormModalOpen = true;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		submissionAttempted = true;

		// Validate all fields client-side simultaneously
		const nameErr = getHolidayNameError(holidayName);
		const dateErr = getClientDateError(holidayDate);

		errors.holiday_name = nameErr;
		errors.holiday_date = dateErr;

		if (nameErr || dateErr) {
			toast.error('Please fix the validation errors.');
			return;
		}

		isSubmitting = true;
		errors.general = '';

		const body = {
			holiday_name: holidayName,
			holiday_date: holidayDate,
			holiday_type: holidayType
		};

		try {
			const url = editCuid ? `/api/holidays/${editCuid}` : '/api/holidays';
			const res = await fetch(url, {
				method: editCuid ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			const result = await res.json();

			if (res.ok && result.data) {
				toast.success(result.data.message);
				isFormModalOpen = false;
				if (editCuid) {
					await goto(resolve('/holidays'), { replaceState: true });
				} else {
					holidayName = '';
					holidayDate = '';
					holidayType = 'National';
				}
				await invalidateAll();
			} else {
				const errorMsg = result.data?.error || 'Validation failed';
				form = {
					error: errorMsg,
					field: result.data?.field,
					action: editCuid ? 'update' : 'create'
				};
				if (result.data?.field) {
					errors[result.data.field] = errorMsg;
				} else {
					errors.general = errorMsg;
				}
			}
		} catch (error) {
			console.error('Submit failed:', error);
			toast.error('An unexpected error occurred.');
		} finally {
			isSubmitting = false;
		}
	}

	async function handleDelete(cuid: string) {
		isSubmitting = true;
		try {
			const res = await fetch(`/api/holidays/${cuid}`, {
				method: 'DELETE'
			});
			const result = await res.json();
			if (res.ok && result.data) {
				toast.success(result.data.message);
				await invalidateAll();
			} else {
				toast.error(result.data?.error || 'Action failed');
			}
		} catch (error) {
			console.error('Delete failed:', error);
			toast.error('An unexpected error occurred.');
		} finally {
			isSubmitting = false;
		}
	}

	let tomorrowStr = $derived.by(() => {
		const today = new Date();
		const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
		const y = tomorrow.getFullYear();
		const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
		const d = String(tomorrow.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	});

	// Active Edit Mode Detection from URL query parameter
	let editCuid = $derived(page.url.searchParams.get('edit'));
	let editingHoliday = $derived(data.holidays.find((h) => h.cuid === editCuid));

	// Form local state
	let holidayName = $state('');
	let holidayDate = $state('');
	let holidayType = $state<'National' | 'Regional' | 'Restricted'>('National');

	let hasChanges = $derived.by(() => {
		if (!editCuid || !editingHoliday) return false;
		
		const dateObj = new Date(editingHoliday.holiday_date);
		const year = dateObj.getUTCFullYear();
		const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
		const day = String(dateObj.getUTCDate()).padStart(2, '0');
		const originalDateStr = `${year}-${month}-${day}`;

		return (
			holidayName !== editingHoliday.holiday_name ||
			holidayDate !== originalDateStr ||
			holidayType !== editingHoliday.holiday_type
		);
	});

	let hasUnsavedChanges = $derived.by(() => {
		if (editCuid) {
			return hasChanges;
		} else {
			return holidayName !== '' || holidayDate !== '' || holidayType !== 'National';
		}
	});

	let errors = $state<Record<string, string>>({});
	let submissionAttempted = $state(false);

	function getHolidayNameError(name: string): string {
		if (!name || name.trim() === '') {
			return 'Holiday name is required.';
		}
		const trimmed = name.trim();
		if (trimmed.length <= 5) {
			return 'Holiday name must be more than 5 characters long';
		}
		if (trimmed.length > 200) {
			return 'Holiday name must be 200 characters or fewer';
		}
		const REGEX = /^[a-zA-Z\s]+$/;
		if (!REGEX.test(trimmed)) {
			return 'Holiday name can only contain letters and spaces';
		}
		return '';
	}

	function getClientDateError(dateStr: string): string {
		if (!dateStr) {
			return 'Holiday date is required.';
		}
		const parts = dateStr.split('-');
		if (parts.length !== 3) return 'Invalid date format.';
		const year = parseInt(parts[0], 10);
		const month = parseInt(parts[1], 10) - 1;
		const day = parseInt(parts[2], 10);
		const selectedDate = new Date(year, month, day);
		const today = new Date();
		const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		if (selectedDate.getTime() <= todayMidnight.getTime()) {
			return 'Holiday date must be a future date.';
		}
		return '';
	}

	let holidayNameError = $derived(errors.holiday_name || '');
	let clientDateError = $derived(errors.holiday_date || '');

	let isSubmitDisabled = $derived.by(() => {
		if (isSubmitting) return true;
		
		const nameErr = getHolidayNameError(holidayName);
		const dateErr = getClientDateError(holidayDate);
		const hasValidationErrors = !!nameErr || !!dateErr;

		if (editCuid) {
			if (!holidayName.trim() || !holidayDate || !holidayType) return true;
			if (hasValidationErrors) return true;
			return !hasChanges;
		} else {
			if (!holidayName.trim() || !holidayDate || !holidayType) return true;
			return hasValidationErrors;
		}
	});

	let isDiscardModalOpen = $state(false);
	let pendingNavigation = $state<import('@sveltejs/kit').Navigation | null>(null);
	let isNavigatingProgrammatically = $state(false);

	function handleCloseRequest() {
		if (hasUnsavedChanges) {
			isDiscardModalOpen = true;
		} else {
			isFormModalOpen = false;
		}
	}

	async function confirmDiscard() {
		isDiscardModalOpen = false;
		isNavigatingProgrammatically = true;
		
		holidayName = '';
		holidayDate = '';
		holidayType = 'National';
		isFormModalOpen = false;
		
		if (pendingNavigation) {
			const target = pendingNavigation.to?.url;
			pendingNavigation = null;
			if (target) {
				await goto(resolve((target.pathname + target.search) as '/holidays'));
			}
		} else if (editCuid) {
			await goto(resolve('/holidays'), { replaceState: true });
		}
		
		isNavigatingProgrammatically = false;
	}

	beforeNavigate((navigation) => {
		if (!isFormModalOpen || !hasUnsavedChanges) {
			return;
		}

		if (isNavigatingProgrammatically) {
			return;
		}

		navigation.cancel();
		pendingNavigation = navigation;
		isDiscardModalOpen = true;
	});

	$effect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (isFormModalOpen && hasUnsavedChanges) {
				e.preventDefault();
				e.returnValue = '';
				return '';
			}
		};
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	});

	let hasSynchronized = $state(false);

	$effect(() => {
		if (isFormModalOpen) {
			hasSynchronized = false;
			submissionAttempted = false;
			errors = {};
		}
	});

	// Synchronise form inputs when URL edit parameter changes
	$effect(() => {
		if (!isFormModalOpen) return;
		if (hasSynchronized) return;

		if (editingHoliday) {
			holidayName = editingHoliday.holiday_name;
			const dateObj = new Date(editingHoliday.holiday_date);
			const year = dateObj.getUTCFullYear();
			const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
			const day = String(dateObj.getUTCDate()).padStart(2, '0');
			holidayDate = `${year}-${month}-${day}`;
			holidayType = editingHoliday.holiday_type;
			hasSynchronized = true;
		} else if (!editCuid) {
			holidayName = '';
			holidayDate = '';
			holidayType = 'National';
			hasSynchronized = true;
		}
	});

	// Sync isFormModalOpen with editCuid
	$effect(() => {
		if (editCuid) {
			isFormModalOpen = true;
		}
	});

	// Reset form state and clear query parameter on modal close
	$effect(() => {
		if (!isFormModalOpen) {
			form = null;
			isSubmitting = false;
			holidayName = '';
			holidayDate = '';
			holidayType = 'National';
			errors = {};
			submissionAttempted = false;
			hasSynchronized = false;
			isDiscardModalOpen = false;
			if (editCuid) {
				goto(resolve('/holidays'), { replaceState: true });
			}
		}
	});

	let formError = $derived(form && 'error' in form ? form.error : null);

	// Derived lists and metrics
	let filteredHolidays = $derived.by(() => {
		let result = [...data.holidays];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(h) =>
					h.holiday_name.toLowerCase().includes(query) ||
					h.holiday_type.toLowerCase().includes(query) ||
					h.cuid.toLowerCase().includes(query)
			);
		}

		if (filterType !== 'all') {
			result = result.filter((h) => h.holiday_type === filterType);
		}

		// Sort by holiday_date ascending
		result.sort((a, b) => {
			const timeA = new Date(a.holiday_date).getTime();
			const timeB = new Date(b.holiday_date).getTime();
			return timeA - timeB;
		});

		return result;
	});

	let totalHolidays = $derived(data.holidays.length);
	let upcomingHolidaysCount = $derived(
		data.holidays.filter(
			(h) => new Date(h.holiday_date).getTime() >= new SvelteDate().setHours(0, 0, 0, 0)
		).length
	);

	let nextHoliday = $derived.by(() => {
		const todayTime = new SvelteDate().setHours(0, 0, 0, 0);
		const futureHolidays = data.holidays
			.filter((h) => new Date(h.holiday_date).getTime() >= todayTime)
			.sort((a, b) => new Date(a.holiday_date).getTime() - new Date(b.holiday_date).getTime());
		return futureHolidays[0] || null;
	});

	function formatDate(dateString: string | Date): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			timeZone: 'UTC'
		});
	}
</script>

<svelte:head>
	<title>Holiday Calendar | HRMS</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8 px-1 py-4">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border pb-6">
		<div class="space-y-1">
			<Badge variant="secondary" class="uppercase">HRMS Module</Badge>
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Holiday Calendar</h1>
			<p class="text-muted-foreground">
				Manage system-wide holidays with categories, scheduling, and metrics.
			</p>
		</div>
		<div class="shrink-0">
			<Button onclick={openAddModal}>Add Holiday</Button>
		</div>
	</div>

	<!-- KPI Metrics -->
	<div class="grid gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader>
				<CardDescription>Total Holidays</CardDescription>
				<CardTitle class="text-4xl tabular-nums">{totalHolidays}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader>
				<CardDescription>Upcoming Holidays</CardDescription>
				<CardTitle class="text-4xl tabular-nums">{upcomingHolidaysCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader>
				<CardDescription>Next Scheduled Holiday</CardDescription>
				{#if nextHoliday}
					<CardTitle class="text-xl font-bold line-clamp-1">{nextHoliday.holiday_name}</CardTitle>
					<CardDescription class="text-xs text-muted-foreground mt-1">
						{formatDate(nextHoliday.holiday_date)}
					</CardDescription>
				{:else}
					<CardTitle class="text-xl font-bold">None Scheduled</CardTitle>
					<CardDescription class="text-xs text-muted-foreground mt-1">
						No upcoming holidays
					</CardDescription>
				{/if}
			</CardHeader>
		</Card>
	</div>

	<div class="space-y-4">
		<!-- Search & Filter controls -->
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
			<div class="relative flex-1">
				<SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
				<Input
					type="search"
					placeholder="Search by holiday name..."
					bind:value={searchQuery}
					class="pl-9 pr-9"
				/>
				{#if searchQuery}
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						class="absolute top-1/2 right-1 -translate-y-1/2"
						aria-label="Clear search"
						onclick={() => (searchQuery = '')}
					>
						<XIcon class="size-4" />
					</Button>
				{/if}
			</div>
			<div class="w-full sm:w-48">
				<select
					bind:value={filterType}
					class="dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] focus-visible:ring-3 md:text-sm w-full min-w-0 outline-none"
				>
					<option value="all">All Holiday Types</option>
					<option value="National">National</option>
					<option value="Regional">Regional</option>
					<option value="Restricted">Restricted</option>
				</select>
			</div>
		</div>

		<!-- Holidays List Card -->
		<Card>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="w-32">Date</TableHead>
						<TableHead>Holiday Name</TableHead>
						<TableHead class="w-32">Category</TableHead>
						<TableHead class="w-24 text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if filteredHolidays.length === 0}
						<TableRow>
							<TableCell colspan={4} class="py-12 text-center text-muted-foreground">
								No holidays scheduled.
							</TableCell>
						</TableRow>
					{:else}
						{#each filteredHolidays as holiday (holiday.cuid)}
							<TableRow>
								<TableCell class="font-medium">
									{formatDate(holiday.holiday_date)}
								</TableCell>
								<TableCell class="font-semibold">
									{holiday.holiday_name}
								</TableCell>
								<TableCell>
									{#if holiday.holiday_type === 'National'}
										<Badge
											class="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white border-0 capitalize"
										>
											{holiday.holiday_type}
										</Badge>
									{:else}
										{#if holiday.holiday_type === 'Regional'}
											<Badge
												class="bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white border-0 capitalize"
											>
												{holiday.holiday_type}
											</Badge>
										{:else}
											<Badge
												class="bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-700 text-white border-0 capitalize"
											>
												{holiday.holiday_type}
											</Badge>
										{/if}
									{/if}
								</TableCell>
								<TableCell class="text-right relative">
									<Button
										variant="ghost"
										size="icon-sm"
										class="h-8 w-8"
										onclick={(e) => toggleMenu(holiday.cuid, e)}
									>
										<EllipsisVerticalIcon class="size-4" />
									</Button>
									{#if activeMenuCuid === holiday.cuid}
										<div
											style="position: fixed; top: {menuPosition.top}px; left: {menuPosition.left}px;"
											class="z-50 w-28 rounded-md border bg-popover text-popover-foreground shadow-md outline-none text-left"
										>
											<div class="py-1">
												<a
													href={resolve(('/holidays?edit=' + holiday.cuid) as '/holidays')}
													class="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
													onclick={() => activeMenuCuid = null}
												>
													Edit
												</a>
												<button
													type="button"
													class="w-full text-left block px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
													disabled={isSubmitting}
													onclick={() => {
														activeMenuCuid = null;
														activeDeleteCuid = holiday.cuid;
														confirmTitle = 'Delete Holiday';
														confirmMessage = 'Are you sure you want to delete this holiday?';
														isConfirmOpen = true;
													}}
												>
													Delete
												</button>
											</div>
										</div>
									{/if}
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</Card>

		<p class="text-xs text-muted-foreground">
			Showing {filteredHolidays.length} of {totalHolidays} entries
		</p>
	</div>
</div>

<FormModal
	bind:isOpen={isFormModalOpen}
	title={editCuid ? 'Edit Holiday' : 'Add Holiday'}
	onsubmit={handleSubmit}
	onCloseRequest={handleCloseRequest}
	disableEscape={isDiscardModalOpen}
>
	{#if editCuid}
		<input type="hidden" name="cuid" value={editCuid} />
	{/if}

	<div class="space-y-2">
		<Label for="modal_holiday_name" class={(form && 'field' in form && form.field === 'holiday_name') || holidayNameError ? 'text-destructive' : ''}>Holiday Name <span class="text-destructive">*</span></Label>
		<Input
			id="modal_holiday_name"
			name="holiday_name"
			bind:value={holidayName}
			oninput={() => {
				if (form && form.field === 'holiday_name') form = null;
				const err = getHolidayNameError(holidayName);
				if (!err) {
					errors.holiday_name = '';
				} else if (submissionAttempted || errors.holiday_name) {
					errors.holiday_name = err;
				}
			}}
			placeholder="e.g. Independence Day"
			required
			minlength={6}
			pattern="^[a-zA-Z\s]+$"
			class={(form && 'field' in form && form.field === 'holiday_name') || holidayNameError ? 'border-destructive focus-visible:ring-destructive' : ''}
		/>
		{#if holidayNameError}
			<p class="text-xs font-medium text-destructive mt-1">{holidayNameError}</p>
		{:else if form && 'field' in form && form.field === 'holiday_name'}
			<p class="text-xs font-medium text-destructive mt-1">{form.error}</p>
		{/if}
	</div>

	<div class="space-y-2">
		<Label for="modal_holiday_date" class={(form && 'field' in form && form.field === 'holiday_date') || clientDateError ? 'text-destructive' : ''}>Date <span class="text-destructive">*</span></Label>
		<Input
			id="modal_holiday_date"
			name="holiday_date"
			type="date"
			bind:value={holidayDate}
			oninput={() => {
				if (form && form.field === 'holiday_date') form = null;
				const err = getClientDateError(holidayDate);
				if (!err) {
					errors.holiday_date = '';
				} else if (submissionAttempted || errors.holiday_date) {
					errors.holiday_date = err;
				}
			}}
			required
			min={tomorrowStr}
			max="2099-12-31"
			class={(form && 'field' in form && form.field === 'holiday_date') || clientDateError ? 'border-destructive focus-visible:ring-destructive' : ''}
		/>
		{#if clientDateError}
			<p class="text-xs font-medium text-destructive mt-1">{clientDateError}</p>
		{:else if form && 'field' in form && form.field === 'holiday_date'}
			<p class="text-xs font-medium text-destructive mt-1">{form.error}</p>
		{/if}
	</div>

	<div class="space-y-2">
		<Label for="modal_holiday_type" class={form && 'field' in form && form.field === 'holiday_type' ? 'text-destructive' : ''}>Category <span class="text-destructive">*</span></Label>
		<select
			id="modal_holiday_type"
			name="holiday_type"
			bind:value={holidayType}
			onchange={() => {
				if (form && form.field === 'holiday_type') form = null;
				errors.holiday_type = '';
			}}
			class="dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] focus-visible:ring-3 md:text-sm w-full min-w-0 outline-none {form && 'field' in form && form.field === 'holiday_type' ? 'border-destructive focus-visible:ring-destructive' : 'border-input'}"
			required
		>
			<option value="National">National Holiday</option>
			<option value="Regional">Regional Holiday</option>
			<option value="Restricted">Restricted Holiday</option>
		</select>
		{#if form && 'field' in form && form.field === 'holiday_type'}
			<p class="text-xs font-medium text-destructive mt-1">{form.error}</p>
		{/if}
	</div>

	{#if formError && (!form || !('field' in form) || !form.field)}
		<div transition:slide>
			<Alert variant="destructive">
				<AlertDescription>{formError}</AlertDescription>
			</Alert>
		</div>
	{/if}

	<Button type="submit" class="w-full" disabled={isSubmitDisabled}>
		{#if isSubmitting}
			<LoaderCircleIcon class="size-4 animate-spin" />
			Saving...
		{:else}
			{editCuid ? 'Update Holiday Record' : 'Save Holiday Record'}
		{/if}
	</Button>
</FormModal>

<ConfirmModal
	bind:isOpen={isConfirmOpen}
	title={confirmTitle}
	message={confirmMessage}
	onConfirm={() => {
		if (activeDeleteCuid) {
			handleDelete(activeDeleteCuid);
		}
	}}
/>

<ConfirmModal
	bind:isOpen={isDiscardModalOpen}
	title="Unsaved Changes"
	message="You have unsaved changes. Are you sure you want to discard them? Any unsaved edits will be lost."
	confirmLabel="Discard Changes"
	cancelLabel="Continue Editing"
	variant="destructive"
	onConfirm={confirmDiscard}
/>
