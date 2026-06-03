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
		FormModal,
		Pagination,
		Dropdown,
		DatePicker
	} from '$lib/components/ui';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let form = $state<{ error?: string; field?: string; action?: string } | null>(null);

	let currentPage = $state(1);
	let searchQuery = $state('');
	let filterType = $state<string>('all');
	let isSubmitting = $state(false);
	let isFormModalOpen = $state(false);

	let sortKey = $state<string | null>(null);
	let sortDirection = $state<'asc' | 'desc' | null>(null);

	function handleSort(key: string) {
		currentPage = 1; // Reset to page 1 on sort change
		if (sortKey !== key) {
			sortKey = key;
			sortDirection = 'asc';
		} else if (sortDirection === 'asc') {
			sortDirection = 'desc';
		} else {
			sortKey = null;
			sortDirection = null;
		}
	}

	// Confirm Modal states
	let isConfirmOpen = $state(false);
	let confirmTitle = $state('');
	let confirmMessage = $state('');
	let activeDeleteCuid = $state<string | null>(null);

	let activeMenuCuid = $state<string | null>(null);
	let menuPosition = $state({ top: 0, left: 0 });
	let activeTriggerEl = $state<HTMLElement | null>(null);

	function toggleMenu(cuid: string, event: MouseEvent) {
		event.stopPropagation();
		if (activeMenuCuid === cuid) {
			activeMenuCuid = null;
			activeTriggerEl = null;
		} else {
			activeMenuCuid = cuid;
			activeTriggerEl = event.currentTarget as HTMLElement;
			updateMenuPosition();
		}
	}

	function updateMenuPosition() {
		if (activeTriggerEl) {
			const rect = activeTriggerEl.getBoundingClientRect();
			const menuEl = document.querySelector('.kebab-dropdown-menu') as HTMLElement;
			const menuHeight = menuEl ? menuEl.getBoundingClientRect().height : 80;
			const menuWidth = 112; // w-28 is 112px

			const spaceBelow = window.innerHeight - rect.bottom;
			const spaceAbove = rect.top;

			let topPos = rect.bottom + 4; // default downward
			if (spaceBelow < menuHeight + 10 && spaceAbove > spaceBelow) {
				topPos = rect.top - menuHeight - 4; // open upward
			}

			let leftPos = rect.right - menuWidth;
			// Horizontal boundaries check
			if (leftPos < 4) {
				leftPos = 4;
			} else if (leftPos + menuWidth > window.innerWidth - 4) {
				leftPos = window.innerWidth - menuWidth - 4;
			}

			menuPosition = {
				top: topPos,
				left: leftPos
			};
		}
	}

	// Dynamic position tracking when menu is open
	$effect(() => {
		if (!activeMenuCuid || !activeTriggerEl) return;

		window.addEventListener('scroll', updateMenuPosition, { capture: true, passive: true });
		window.addEventListener('resize', updateMenuPosition, { passive: true });

		let frameId: number;
		const loop = () => {
			updateMenuPosition();
			frameId = requestAnimationFrame(loop);
		};
		frameId = requestAnimationFrame(loop);

		return () => {
			window.removeEventListener('scroll', updateMenuPosition, { capture: true });
			window.removeEventListener('resize', updateMenuPosition);
			cancelAnimationFrame(frameId);
		};
	});

	// Close kebab menu on click outside
	$effect(() => {
		const handleDismiss = (e: MouseEvent) => {
			if (activeMenuCuid && activeTriggerEl) {
				const target = e.target as HTMLElement;
				const isDropdownClick = target.closest('.kebab-dropdown-menu');
				if (!activeTriggerEl.contains(target) && !isDropdownClick) {
					activeMenuCuid = null;
					activeTriggerEl = null;
				}
			}
		};
		document.addEventListener('click', handleDismiss);
		return () => {
			document.removeEventListener('click', handleDismiss);
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
			const url = editCuid ? `/api/holidays/holidayCuid=${editCuid}` : '/api/holidays';
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
			const res = await fetch(`/api/holidays/holidayCuid=${cuid}`, {
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

	const filterTypeOptions = [
		{ value: 'all', label: 'All Holiday Types' },
		{ value: 'National', label: 'National' },
		{ value: 'Regional', label: 'Regional' },
		{ value: 'Restricted', label: 'Restricted' }
	];

	const holidayTypeOptions = [
		{ value: 'National', label: 'National Holiday' },
		{ value: 'Regional', label: 'Regional Holiday' },
		{ value: 'Restricted', label: 'Restricted Holiday' }
	];

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
	let touched = $state<Record<string, boolean>>({});
	let submissionAttempted = $state(false);

	function getFieldError(
		value: string,
		getErr: (val: string) => string,
		isTouched: boolean,
		submitAttempted: boolean,
		backendErr?: string
	): string {
		if (backendErr) return backendErr;
		const clientErr = getErr(value);
		if (!clientErr) return '';
		if (value && value.trim() !== '') {
			return clientErr;
		}
		if (isTouched || submitAttempted) {
			return clientErr;
		}
		return '';
	}

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

	let holidayNameError = $derived(getFieldError(holidayName, getHolidayNameError, touched.holiday_name, submissionAttempted, errors.holiday_name));
	let clientDateError = $derived(getFieldError(holidayDate, getClientDateError, touched.holiday_date, submissionAttempted, errors.holiday_date));

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
			errors = {};
			touched = {};
			submissionAttempted = false;
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
			touched = {};
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
				(h) => h.holiday_name.toLowerCase().includes(query)
			);
		}

		if (filterType !== 'all') {
			result = result.filter((h) => h.holiday_type === filterType);
		}

		// Sort behavior
		if (sortKey && sortDirection) {
			result.sort((a, b) => {
				const valA = a[sortKey as keyof typeof a];
				const valB = b[sortKey as keyof typeof b];

				if (sortKey === 'holiday_date') {
					const timeA = new Date(valA as string).getTime();
					const timeB = new Date(valB as string).getTime();
					return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
				}

				if (typeof valA === 'string' && typeof valB === 'string') {
					return sortDirection === 'asc'
						? valA.localeCompare(valB)
						: valB.localeCompare(valA);
				}

				return 0;
			});
		}

		return result;
	});

	let paginatedHolidays = $derived(filteredHolidays.slice((currentPage - 1) * 10, currentPage * 10));

	$effect(() => {
		// Reset to page 1 when search or filter criteria change
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		searchQuery;
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		filterType;
		currentPage = 1;
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

<div class="w-full space-y-8 px-1 py-4">
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
			<Button onclick={openAddModal}>+ Add Holiday</Button>
		</div>
	</div>

	<!-- KPI Metrics -->
	<div class="grid gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader>
				<CardDescription class="text-black dark:text-white">Total Holidays</CardDescription>
				<CardTitle class="text-4xl tabular-nums font-bold text-[#262626] dark:text-neutral-200">{totalHolidays}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader>
				<CardDescription class="text-black dark:text-white">Upcoming Holidays</CardDescription>
				<CardTitle class="text-4xl tabular-nums font-bold text-[#F45310]">{upcomingHolidaysCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader>
				<CardDescription class="text-black dark:text-white">Next Scheduled Holiday</CardDescription>
				{#if nextHoliday}
					<CardTitle class="text-xl font-bold line-clamp-1 text-[#800020] dark:text-[#b83d58]">{nextHoliday.holiday_name}</CardTitle>
					<CardDescription class="text-xs text-[#800020] dark:text-[#b83d58]/80 mt-1">
						{formatDate(nextHoliday.holiday_date)}
					</CardDescription>
				{:else}
					<CardTitle class="text-xl font-bold text-[#800020] dark:text-[#b83d58]">None Scheduled</CardTitle>
					<CardDescription class="text-xs text-[#800020] dark:text-[#b83d58]/80 mt-1">
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
				<Dropdown
					bind:value={filterType}
					options={filterTypeOptions}
					isFilter={true}
				/>
			</div>
		</div>

		<!-- Holidays List Card -->
		<Card>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="w-32">
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => handleSort('holiday_date')}
								class="flex items-center gap-1.5 cursor-pointer select-none group"
							>
								<span>Date</span>
								<span class="text-sm transition-colors {sortKey === 'holiday_date' ? 'text-black dark:text-white font-bold' : 'text-neutral-400 dark:text-neutral-500 font-normal group-hover:text-black dark:group-hover:text-white'}">
									{sortKey === 'holiday_date' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
								</span>
							</div>
						</TableHead>
						<TableHead>
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => handleSort('holiday_name')}
								class="flex items-center gap-1.5 cursor-pointer select-none group"
							>
								<span>Holiday Name</span>
								<span class="text-sm transition-colors {sortKey === 'holiday_name' ? 'text-black dark:text-white font-bold' : 'text-neutral-400 dark:text-neutral-500 font-normal group-hover:text-black dark:group-hover:text-white'}">
									{sortKey === 'holiday_name' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
								</span>
							</div>
						</TableHead>
						<TableHead class="w-32">
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => handleSort('holiday_type')}
								class="flex items-center gap-1.5 cursor-pointer select-none group"
							>
								<span>Category</span>
								<span class="text-sm transition-colors {sortKey === 'holiday_type' ? 'text-black dark:text-white font-bold' : 'text-neutral-400 dark:text-neutral-500 font-normal group-hover:text-black dark:group-hover:text-white'}">
									{sortKey === 'holiday_type' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
								</span>
							</div>
						</TableHead>
						<TableHead class="w-24 text-center">Actions</TableHead>
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
						{#each paginatedHolidays as holiday (holiday.cuid)}
							<TableRow>
								<TableCell class="font-normal">
									{formatDate(holiday.holiday_date)}
								</TableCell>
								<TableCell class="font-normal">
									{holiday.holiday_name}
								</TableCell>
								<TableCell>
									{holiday.holiday_type}
								</TableCell>
								<TableCell class="text-center relative">
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
											class="kebab-dropdown-menu z-100 w-28 rounded-md border bg-popover text-popover-foreground shadow-md outline-none text-left"
										>
											<div class="py-1">
												<a
													href={resolve(('/holidays?edit=' + holiday.cuid) as '/holidays')}
													class="block px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-foreground transition-colors"
													onclick={() => activeMenuCuid = null}
												>
													Edit
												</a>
												<button
													type="button"
													class="w-full text-left block px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
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

		<Pagination totalItems={filteredHolidays.length} bind:currentPage={currentPage} />
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
				errors.holiday_name = '';
				touched.holiday_name = true;
			}}
			onblur={() => touched.holiday_name = true}
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
		<Label for="modal_holiday_date" class={(form && 'field' in form && form.field === 'holiday_date') || clientDateError ? 'text-destructive' : ''}>Holiday Date <span class="text-destructive">*</span></Label>
		<DatePicker
			id="modal_holiday_date"
			name="holiday_date"
			bind:value={holidayDate}
			onchange={() => {
				if (form && form.field === 'holiday_date') form = null;
				errors.holiday_date = '';
				touched.holiday_date = true;
			}}
			required={true}
			min={tomorrowStr}
			max="2099-12-31"
			hasError={!!clientDateError || !!(form && 'field' in form && form.field === 'holiday_date')}
		/>
		{#if clientDateError}
			<p class="text-xs font-medium text-destructive mt-1">{clientDateError}</p>
		{:else if form && 'field' in form && form.field === 'holiday_date'}
			<p class="text-xs font-medium text-destructive mt-1">{form.error}</p>
		{/if}
	</div>

	<div class="space-y-2">
		<Label for="modal_holiday_type" class={form && 'field' in form && form.field === 'holiday_type' ? 'text-destructive' : ''}>Category <span class="text-destructive">*</span></Label>
		<Dropdown
			id="modal_holiday_type"
			name="holiday_type"
			bind:value={holidayType}
			options={holidayTypeOptions}
			required={true}
			onchange={() => {
				if (form && form.field === 'holiday_type') form = null;
				errors.holiday_type = '';
				touched.holiday_type = true;
			}}
		/>
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

	<div class="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
		<Button
			type="button"
			variant="outline"
			class="flex-1 sm:flex-initial sm:min-w-28 font-medium"
			onclick={handleCloseRequest}
			disabled={isSubmitting}
		>
			Cancel
		</Button>
		<Button
			type="submit"
			class="flex-1 sm:flex-initial sm:min-w-28 font-medium"
			disabled={isSubmitDisabled}
		>
			{#if isSubmitting}
				<LoaderCircleIcon class="size-4 animate-spin" />
				Saving...
			{:else}
				{editCuid ? 'Update Holiday Record' : 'Save Holiday Record'}
			{/if}
		</Button>
	</div>
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
	message="You have unsaved changes. Do you want to continue editing or close without saving?"
	confirmLabel="Close Without Saving"
	cancelLabel="Continue Editing"
	variant="destructive"
	onConfirm={confirmDiscard}
/>
