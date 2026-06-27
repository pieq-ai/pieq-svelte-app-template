<script lang="ts">
	import { slide } from 'svelte/transition';
	import { goto, invalidate, beforeNavigate } from '$app/navigation';
	import { SvelteDate } from 'svelte/reactivity';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	
	import FilterIcon from '@lucide/svelte/icons/filter';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
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
		toast
	} from '$lib/components/ui';
	import { ConfirmModal, CrudModal, Pagination, TableActions, DatePicker, SearchInput } from '$lib/components';
	import { UI_CONSTANTS } from '$lib/constants';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let form = $state<{ error?: string; field?: string; action?: string } | null>(null);

	let currentPage = $state(1);
	let searchQuery = $state('');
	let filterType = $state<string>('all');
	let filterStartDate = $state('');
	let filterEndDate = $state('');
	let isSubmitting = $state(false);
	let isFormModalOpen = $state(false);

	let sortKey = $state<string | null>('date');
	let sortDirection = $state<'asc' | 'desc' | null>('asc');

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

	function openAddModal() {
		editCuid = null;
		holidayName = '';
		holidayDate = '';
		holidayType = '';
		isFormModalOpen = true;
	}

	function openEditModal(cuid: string) {
		editCuid = cuid;
		isFormModalOpen = true;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		submissionAttempted = true;

		// Rebuild validation error state from scratch on Save
		errors = {};

		// Validate all fields client-side simultaneously
		const nameErr = getHolidayNameError(holidayName);
		const dateErr = getClientDateError(holidayDate);
		const typeErr = getCategoryError(holidayType);

		errors.name = nameErr;
		errors.date = dateErr;
		errors.type = typeErr;

		if (nameErr || dateErr || typeErr) {
			return;
		}

		isSubmitting = true;
		errors.general = '';

		const body = {
			name: holidayName,
			date: holidayDate,
			type: holidayType
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
				await invalidate('/api/holidays');
			} else {
				if (result.data?.error && typeof result.data.error === 'object') {
					errors = { ...result.data.error };
					if (result.data.error.general) {
						form = {
							error: result.data.error.general,
							field: undefined,
							action: editCuid ? 'update' : 'create'
						};
					} else {
						form = null;
					}
				} else if (result.error && typeof result.error === 'object') {
					errors = { ...result.error };
					if (result.error.general) {
						form = {
							error: result.error.general,
							field: undefined,
							action: editCuid ? 'update' : 'create'
						};
					} else {
						form = null;
					}
				} else if (result.data?.errors) {
					errors = { ...result.data.errors };
					form = null;
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
			}
		} catch (error) {
			console.error('Submit failed:', error);
			errors.general = 'An unexpected error occurred.';
		} finally {
			isSubmitting = false;
		}
	}


	// Active Edit Mode Detection (local state – no longer URL-driven)
	let editCuid = $state<string | null>(null);
	let editingHoliday = $derived(data.holidays.find((h) => h.cuid === editCuid));

	// Form local state
	let holidayName = $state('');
	let holidayDate = $state('');
	let holidayType = $state<'National' | 'Regional' | 'Restricted' | ''>('');

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
		
		const dateObj = new Date(editingHoliday.date);
		const year = dateObj.getUTCFullYear();
		const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
		const day = String(dateObj.getUTCDate()).padStart(2, '0');
		const originalDateStr = `${year}-${month}-${day}`;

		return (
			holidayName.trim() !== editingHoliday.name.trim() ||
			holidayDate !== originalDateStr ||
			holidayType !== editingHoliday.type
		);
	});

	let hasUnsavedChanges = $derived.by(() => {
		if (editCuid) {
			return hasChanges;
		} else {
			return holidayName.trim() !== '' || holidayDate !== '' || holidayType !== '';
		}
	});

	let errors = $state<Record<string, string>>({});
	let submissionAttempted = $state(false);

	function getHolidayNameError(name: string): string {
		if (!name || name.trim() === '') {
			return 'Holiday name is required';
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
			return 'Holiday date is required';
		}
		const parts = dateStr.split('-');
		if (parts.length !== 3) return 'Invalid date format';
		const year = parseInt(parts[0], 10);
		if (year > 2099) {
			return 'You can schedule holidays only up to the year 2099';
		}
		if (year < 2000) {
			return 'Holiday date must be between the years 2000 and 2099';
		}
		const month = parseInt(parts[1], 10) - 1;
		const day = parseInt(parts[2], 10);
		const selectedDateUTC = new Date(Date.UTC(year, month, day));
		const today = new Date();
		const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
		if (selectedDateUTC.getTime() < todayUTC.getTime()) {
			return 'Holiday date cannot be in the past';
		}
		return '';
	}

	function getCategoryError(type: string): string {
		if (!type || type.trim() === '') {
			return 'Category is required';
		}
		if (!['National', 'Regional', 'Restricted'].includes(type)) {
			return 'Category must be one of: National, Regional, Restricted';
		}
		return '';
	}

	let isSubmitDisabled = $derived.by(() => {
		if (isSubmitting) return true;
		const mandatoryFieldsFilled =
			holidayName.trim() !== '' &&
			holidayDate.trim() !== '' &&
			holidayType.trim() !== '';
		if (!mandatoryFieldsFilled) return true;
		if (editCuid) {
			return !hasChanges;
		}
		return false;
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
		holidayType = '';
		isFormModalOpen = false;
		
		if (pendingNavigation) {
			const target = pendingNavigation.to?.url;
			pendingNavigation = null;
			if (target) {
				await goto(target.pathname + target.search);
			}
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
			submissionAttempted = false;
		}
	});

	// Synchronise form inputs when URL edit parameter changes
	$effect(() => {
		if (!isFormModalOpen) return;
		if (hasSynchronized) return;

		if (editingHoliday) {
			holidayName = editingHoliday.name;
			const dateObj = new Date(editingHoliday.date);
			const year = dateObj.getUTCFullYear();
			const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
			const day = String(dateObj.getUTCDate()).padStart(2, '0');
			holidayDate = `${year}-${month}-${day}`;
			holidayType = editingHoliday.type;
			hasSynchronized = true;
		} else if (!editCuid) {
			holidayName = '';
			holidayDate = '';
			holidayType = '';
			hasSynchronized = true;
		}
	});

	// Reset form state on modal close
	$effect(() => {
		if (!isFormModalOpen) {
			form = null;
			isSubmitting = false;
			holidayName = '';
			holidayDate = '';
			holidayType = '';
			errors = {};
			submissionAttempted = false;
			hasSynchronized = false;
			isDiscardModalOpen = false;
			editCuid = null;
		}
	});

	let formError = $derived(form && 'error' in form ? form.error : null);

	function getISODateString(dateInput: string | Date): string {
		const d = new Date(dateInput);
		const year = d.getUTCFullYear();
		const month = String(d.getUTCMonth() + 1).padStart(2, '0');
		const day = String(d.getUTCDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	// Derived lists and metrics
	let filteredHolidays = $derived.by(() => {
		let result = [...data.holidays];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(h) => h.name.toLowerCase().includes(query)
			);
		}

		if (filterType !== 'all') {
			result = result.filter((h) => h.type === filterType);
		}

		if (filterStartDate) {
			result = result.filter((h) => getISODateString(h.date) >= filterStartDate);
		}

		if (filterEndDate) {
			result = result.filter((h) => getISODateString(h.date) <= filterEndDate);
		}

		// Sort behavior
		const now = new Date();
		const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

		if (sortKey && sortDirection) {
			result.sort((a, b) => {
				if (sortKey === 'date') {
					const dateA = new Date(a.date);
					const dateB = new Date(b.date);
					const isUpcomingA = dateA >= todayUTC;
					const isUpcomingB = dateB >= todayUTC;

					if (isUpcomingA && !isUpcomingB) {
						return sortDirection === 'asc' ? -1 : 1;
					}
					if (!isUpcomingA && isUpcomingB) {
						return sortDirection === 'asc' ? 1 : -1;
					}
					const diff = dateA.getTime() - dateB.getTime();
					return sortDirection === 'asc' ? diff : -diff;
				}

				const valA = a[sortKey as keyof typeof a];
				const valB = b[sortKey as keyof typeof b];

				if (typeof valA === 'string' && typeof valB === 'string') {
					return sortDirection === 'asc'
						? valA.localeCompare(valB)
						: valB.localeCompare(valA);
				}

				return 0;
			});
		} else {
			result.sort((a, b) => {
				const dateA = new Date(a.date);
				const dateB = new Date(b.date);
				const isUpcomingA = dateA >= todayUTC;
				const isUpcomingB = dateB >= todayUTC;

				if (isUpcomingA && !isUpcomingB) {
					return -1;
				}
				if (!isUpcomingA && isUpcomingB) {
					return 1;
				}
				return dateA.getTime() - dateB.getTime();
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
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		filterStartDate;
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		filterEndDate;
		currentPage = 1;
	});

	let todayStr = $derived.by(() => {
		const today = new SvelteDate();
		const y = today.getFullYear();
		const m = String(today.getMonth() + 1).padStart(2, '0');
		const d = String(today.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	});

	let activeHoliday = $derived(
		data.holidays.find((h) => getISODateString(h.date) === todayStr)
	);

	let totalHolidays = $derived(data.holidays.length);
	let upcomingHolidaysCount = $derived(
		data.holidays.filter(
			(h) => getISODateString(h.date) > todayStr
		).length
	);

	let nextHoliday = $derived.by(() => {
		const futureHolidays = data.holidays
			.filter((h) => getISODateString(h.date) > todayStr)
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
	<title>Holiday Calendar </title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-0">
	<!-- Header -->
	<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl wrap-break-word">Holiday Calendar</h1>
		</div>
		<Button
			type="button"
			class="bg-hrms-primary text-white hover:bg-hrms-primary/90 border-0"
			onclick={openAddModal}
		>
			Add Holiday
		</Button>
	</div>

	<!-- KPI Metrics -->
	<div class="grid gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader class="pb-2">
				<CardDescription class="text-black dark:text-white">Total Holidays</CardDescription>
				<CardTitle class="text-4xl tabular-nums font-bold text-hrms-secondary dark:text-neutral-200">{totalHolidays}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription class="text-black dark:text-white">Upcoming Holidays</CardDescription>
				<CardTitle class="text-4xl tabular-nums font-bold text-hrms-primary">{upcomingHolidaysCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription class="text-black dark:text-white">Next Scheduled Holiday</CardDescription>
				{#if nextHoliday}
					<CardTitle class="text-xl font-bold line-clamp-1 text-hrms-destructive dark:text-[#b83d58]">{nextHoliday.name}</CardTitle>
					<CardDescription class="text-xs text-hrms-destructive dark:text-[#b83d58]/80 mt-1">
						{formatDate(nextHoliday.date)}
					</CardDescription>
				{:else}
					<CardTitle class="text-xl font-bold text-hrms-destructive dark:text-[#b83d58]">No upcoming holidays</CardTitle>
				{/if}
			</CardHeader>
		</Card>
	</div>

	{#if activeHoliday}
		<div class="flex items-center gap-4 p-4 bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 dark:border-blue-500/30 rounded-xl text-blue-950 dark:text-blue-50 shadow-xs">
			<span class="text-xl">🎉</span>
			<div>
				<h4 class="font-bold text-base">Today is {activeHoliday.name}</h4>
			</div>
		</div>
	{/if}

	<div class="space-y-3">
		<!-- Search & Filter controls -->
		<div class="flex flex-col gap-3 lg:flex-row lg:items-center">
			<SearchInput id="search_holidays" name="search_holidays" bind:value={searchQuery} oninput={() => (currentPage = 1)} placeholder="Search by holiday name..." />
			<div class="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full lg:w-auto">
				<div class="w-full sm:w-40">
					<DatePicker
						placeholder="Start Date"
						bind:value={filterStartDate}
						max={filterEndDate || '2099-12-31'}
						isFilter={true}
					/>
				</div>
				<div class="w-full sm:w-40">
					<DatePicker
						placeholder="End Date"
						bind:value={filterEndDate}
						min={filterStartDate}
						isFilter={true}
					/>
				</div>
				<div class="w-full sm:w-48">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-3 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 transition-[color,box-shadow] outline-none" {...props}>
									<span class="truncate pr-2">{filterTypeOptions.find(o => o.value === filterType)?.label || 'All Holiday Types'}</span>
									<FilterIcon class="ml-2 size-4 opacity-50 shrink-0" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-(--bits-dropdown-menu-anchor-width)">
							<DropdownMenu.Group>
								{#each filterTypeOptions as opt}
									<DropdownMenu.Item onclick={() => { filterType = opt.value; currentPage = 1; }} class="justify-between cursor-pointer {filterType === opt.value ? 'bg-accent text-accent-foreground' : ''}">
										<span class="truncate pr-2">{opt.label}</span>
										{#if filterType === opt.value}<CheckIcon class="size-4 shrink-0" />{/if}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			</div>
		</div>

		<!-- Holidays List Card -->
		<Card class="py-0">
			<Table>
				<TableHeader class="bg-muted">
					<TableRow>
						<TableHead class="w-32 font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('date')}>
								Date
							{#if sortKey === 'date' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortKey === 'date' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('name')}>
								Holiday Name
							{#if sortKey === 'name' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortKey === 'name' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead class="w-32 font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('type')}>
								Category
							{#if sortKey === 'type' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortKey === 'type' && sortDirection === 'desc'}
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
					{#if filteredHolidays.length === 0}
						<TableRow>
							<TableCell colspan={4} class="py-8 text-center text-muted-foreground">
								{UI_CONSTANTS.EMPTY_STATE_MESSAGE}
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedHolidays as holiday (holiday.cuid)}
							<TableRow 
								onclick={(e) => {
									if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
									openEditModal(holiday.cuid);
								}} 
								class="cursor-pointer"
							>
								<TableCell class="font-normal">
									{formatDate(holiday.date)}
								</TableCell>
								<TableCell class="font-normal">
									{holiday.name}
								</TableCell>
								<TableCell>
									{holiday.type}
								</TableCell>
								<TableCell class="text-right">
									<TableActions
										canEdit={true}
										onEdit={() => openEditModal(holiday.cuid)}
									/>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</Card>

		<Pagination totalItems={filteredHolidays.length} bind:currentPage={currentPage} pageSize={10} />
	</div>
</div>

<CrudModal
	open={isFormModalOpen}
	title={editCuid ? 'Edit Holiday' : 'Create Holiday'}
	onClose={handleCloseRequest}
	preventOutsideClickClose={true}
>
	{#snippet children({ cancel })}
		<form method="POST" action="" onsubmit={handleSubmit} class="space-y-4" novalidate>
			{#if editCuid}
				<input type="hidden" name="cuid" value={editCuid} />
			{/if}

			<div class="space-y-2">
				<Label for="modal_holiday_name" class={errors.name ? 'text-destructive' : ''}>Holiday Name <span class="text-destructive">*</span></Label>
				<Input
					id="modal_holiday_name"
					name="name"
					bind:value={holidayName}
					oninput={() => {
						if (form && form.field === 'name') form = null;
						errors.name = '';
					}}
					placeholder="e.g. Independence Day"
					required
					minlength={6}
					pattern="^[a-zA-Z\s]+$"
					class={errors.name ? 'border-destructive focus-visible:ring-destructive/30' : ''}
				/>
				{#if errors.name}
					<p class="text-xs font-medium text-destructive mt-1">{errors.name}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="modal_holiday_date" class={errors.date ? 'text-destructive' : ''}>Holiday Date <span class="text-destructive">*</span></Label>
				<DatePicker
					id="modal_holiday_date"
					name="date"
					bind:value={holidayDate}
					onchange={() => {
						if (form && form.field === 'date') form = null;
						errors.date = '';
					}}
					required={true}
				/>
				{#if errors.date}
					<p class="text-xs font-medium text-destructive mt-1">{errors.date}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="modal_holiday_type" class={errors.type ? 'text-destructive' : ''}>Category <span class="text-destructive">*</span></Label>
				<input type="hidden" id="modal_holiday_type" name="type" value={holidayType} />
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-3 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 transition-[color,box-shadow] outline-none {errors.type ? 'border-destructive focus:border-destructive focus:ring-destructive/30 focus-visible:ring-destructive/30 data-[state=open]:border-destructive data-[state=open]:ring-destructive/30' : ''}" {...props}>
								<span class={holidayType ? 'truncate pr-2' : 'truncate pr-2 text-muted-foreground'}>{holidayTypeOptions.find(o => o.value === holidayType)?.label || 'Select category'}</span>
								<ChevronDownIcon class="ml-2 size-4 opacity-50 shrink-0" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-(--bits-dropdown-menu-anchor-width)">
						<DropdownMenu.Group>
							{#each holidayTypeOptions as opt}
								<DropdownMenu.Item onclick={() => {
									holidayType = opt.value as 'National' | 'Regional' | 'Restricted';
									if (form && form.field === 'type') form = null;
									errors.type = '';
								}} class="justify-between cursor-pointer {holidayType === opt.value ? 'bg-accent text-accent-foreground' : ''}">
									<span class="truncate pr-2">{opt.label}</span>
									{#if holidayType === opt.value}<CheckIcon class="size-4 shrink-0" />{/if}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
				{#if errors.type}
					<p class="text-xs font-medium text-destructive mt-1">{errors.type}</p>
				{/if}
			</div>

			{#if formError && (!form || !('field' in form) || !form.field)}
				<div transition:slide>
					<Alert variant="destructive">
						<AlertDescription>{formError}</AlertDescription>
					</Alert>
				</div>
			{/if}

			<div class="flex items-center justify-end gap-3 pt-6">
				<Button
					type="button"
					variant="outline"
					class="flex-1 sm:flex-initial sm:min-w-28 font-medium"
					onclick={cancel}
					disabled={isSubmitting}
				>
					Cancel
				</Button>
				<Button
					type="submit"
					class="flex-1 sm:flex-initial sm:min-w-28 font-medium bg-hrms-primary text-white hover:bg-hrms-primary/90"
					disabled={isSubmitDisabled}
				>
					{#if isSubmitting}
						Saving...
					{:else}
						Save
					{/if}
				</Button>
			</div>
		</form>
	{/snippet}
</CrudModal>

<ConfirmModal
	open={isDiscardModalOpen}
	title="Cancel Changes"
	description="Are you sure you want to cancel? All unsaved changes will be lost."
	confirmLabel="Cancel"
	cancelLabel="Keep Editing"
	onConfirm={confirmDiscard}
	onCancel={() => (isDiscardModalOpen = false)}
	preventOutsideClickClose={true}
/>
