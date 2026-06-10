<script lang="ts">
	import { slide } from 'svelte/transition';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { goto, invalidateAll, beforeNavigate } from '$app/navigation';
	import { SvelteDate } from 'svelte/reactivity';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import PlusIcon from '@lucide/svelte/icons/plus';
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
		toast,
		DatePicker
	} from '$lib/components/ui';
	import { ConfirmModal, CrudModal, Pagination, TableActions } from '$lib/components';
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

	let sortKey = $state<string | null>('holiday_date');
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

	// Confirm Modal states
	let isConfirmOpen = $state(false);
	let confirmTitle = $state('');
	let confirmMessage = $state('');
	let activeDeleteCuid = $state<string | null>(null);

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
		if (selectedDate.getTime() < todayMidnight.getTime()) {
			return 'Holiday date cannot be in the past.';
		}
		return '';
	}

	let isSubmitDisabled = $derived.by(() => {
		if (isSubmitting) return true;

		if (editCuid) {
			if (!holidayName.trim() || !holidayDate || !holidayType) return true;
			return !hasChanges;
		} else {
			return !holidayName.trim() || !holidayDate || !holidayType;
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
			submissionAttempted = false;
			hasSynchronized = false;
			isDiscardModalOpen = false;
			if (editCuid) {
				goto(resolve('/holidays'), { replaceState: true });
			}
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
				(h) => h.holiday_name.toLowerCase().includes(query)
			);
		}

		if (filterType !== 'all') {
			result = result.filter((h) => h.holiday_type === filterType);
		}

		if (filterStartDate) {
			result = result.filter((h) => getISODateString(h.holiday_date) >= filterStartDate);
		}

		if (filterEndDate) {
			result = result.filter((h) => getISODateString(h.holiday_date) <= filterEndDate);
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
		} else {
			result.sort((a, b) => {
				const timeA = new Date(a.holiday_date).getTime();
				const timeB = new Date(b.holiday_date).getTime();
				return timeA - timeB;
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

	let totalHolidays = $derived(data.holidays.length);
	let upcomingHolidaysCount = $derived(
		data.holidays.filter(
			(h) => getISODateString(h.holiday_date) > todayStr
		).length
	);

	let nextHoliday = $derived.by(() => {
		const futureHolidays = data.holidays
			.filter((h) => getISODateString(h.holiday_date) > todayStr)
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

	function isInteractive(target: HTMLElement | null, rowElement: HTMLElement): boolean {
		let curr = target;
		while (curr && curr !== rowElement) {
			const tagName = curr.tagName.toLowerCase();
			if (
				tagName === 'a' ||
				tagName === 'button' ||
				tagName === 'input' ||
				tagName === 'select' ||
				tagName === 'textarea' ||
				curr.getAttribute('role') === 'button' ||
				curr.classList.contains('kebab-dropdown-menu')
			) {
				return true;
			}
			curr = curr.parentElement;
		}
		return false;
	}

	function handleRowClick(cuid: string, event: MouseEvent) {
		const target = event.target as HTMLElement;
		const row = event.currentTarget as HTMLElement;
		if (isInteractive(target, row)) return;
		goto(resolve(('/holidays?edit=' + cuid) as '/holidays'));
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
			class="bg-[#F45310] text-white hover:bg-[#F45310]/90 border-0"
			onclick={openAddModal}
		>
			<PlusIcon class="size-4" />
			Add Holiday
		</Button>
	</div>

	<!-- KPI Metrics -->
	<div class="grid gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader class="pb-2">
				<CardDescription class="text-black dark:text-white">Total Holidays</CardDescription>
				<CardTitle class="text-4xl tabular-nums font-bold text-[#262626] dark:text-neutral-200">{totalHolidays}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription class="text-black dark:text-white">Upcoming Holidays</CardDescription>
				<CardTitle class="text-4xl tabular-nums font-bold text-[#F45310]">{upcomingHolidaysCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription class="text-black dark:text-white">Next Scheduled Holiday</CardDescription>
				{#if nextHoliday}
					<CardTitle class="text-xl font-bold line-clamp-1 text-[#800020] dark:text-[#b83d58]">{nextHoliday.holiday_name}</CardTitle>
					<CardDescription class="text-xs text-[#800020] dark:text-[#b83d58]/80 mt-1">
						{formatDate(nextHoliday.holiday_date)}
					</CardDescription>
				{:else}
					<CardTitle class="text-xl font-bold text-[#800020] dark:text-[#b83d58]">No upcoming holidays</CardTitle>
				{/if}
			</CardHeader>
		</Card>
	</div>

	<div class="space-y-3">
		<!-- Search & Filter controls -->
		<div class="flex flex-col gap-4 lg:flex-row lg:items-center">
			<div class="relative flex-1 min-w-0">
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
			<div class="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full lg:w-auto">
				<div class="w-full sm:w-40">
					<DatePicker
						placeholder="Start Date"
						bind:value={filterStartDate}
						max={filterEndDate || '2099-12-31'}
					/>
				</div>
				<div class="w-full sm:w-40">
					<DatePicker
						placeholder="End Date"
						bind:value={filterEndDate}
						min={filterStartDate}
					/>
				</div>
				<div class="w-full sm:w-48">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-3 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 transition-[color,box-shadow] outline-none" {...props}>
									{filterTypeOptions.find(o => o.value === filterType)?.label || 'All Holiday Types'}
									<FilterIcon class="ml-2 size-4 opacity-50 shrink-0" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-[180px]">
							<DropdownMenu.Group>
								{#each filterTypeOptions as opt}
									<DropdownMenu.Item onclick={() => { filterType = opt.value; currentPage = 1; }} class="justify-between cursor-pointer {filterType === opt.value ? 'bg-accent text-accent-foreground' : ''}">
										{opt.label}
										{#if filterType === opt.value}<CheckIcon class="size-4" />{/if}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			</div>
		</div>

		<!-- Holidays List Card -->
		<Card>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="w-32">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8" onclick={() => handleSort('holiday_date')}>
								Date
							{#if sortKey === 'holiday_date' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortKey === 'holiday_date' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead>
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8" onclick={() => handleSort('holiday_name')}>
								Holiday Name
							{#if sortKey === 'holiday_name' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortKey === 'holiday_name' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead class="w-32">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8" onclick={() => handleSort('holiday_type')}>
								Category
							{#if sortKey === 'holiday_type' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortKey === 'holiday_type' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead class="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if filteredHolidays.length === 0}
						<TableRow>
							<TableCell colspan={4} class="py-12 text-center text-muted-foreground">
								No records found
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedHolidays as holiday (holiday.cuid)}
							<TableRow onclick={(e) => handleRowClick(holiday.cuid, e)} class="cursor-pointer">
								<TableCell class="font-normal">
									{formatDate(holiday.holiday_date)}
								</TableCell>
								<TableCell class="font-normal">
									{holiday.holiday_name}
								</TableCell>
								<TableCell>
									{holiday.holiday_type}
								</TableCell>
								<TableCell class="text-right">
									<TableActions
										onEdit={() => goto(resolve(('/holidays?edit=' + holiday.cuid) as '/holidays'))}
										canDelete={true}
										onDelete={() => {
											activeDeleteCuid = holiday.cuid;
											confirmTitle = 'Delete Holiday';
											confirmMessage = 'Are you sure you want to delete this holiday?';
											isConfirmOpen = true;
										}}
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
	title={editCuid ? 'Edit Holiday' : 'Add Holiday'}
	isDirty={hasUnsavedChanges}
	onClose={confirmDiscard}
>
	{#snippet children({ cancel })}
		<form method="POST" action="" onsubmit={handleSubmit} class="flex flex-col min-h-0 flex-1 overflow-hidden" novalidate>
			{#if editCuid}
				<input type="hidden" name="cuid" value={editCuid} />
			{/if}

			<div class="flex-1 overflow-y-auto pr-1 space-y-4 modal-scroll-area">

			<div class="space-y-2">
				<Label for="modal_holiday_name" class={errors.holiday_name ? 'text-danger' : ''}>Holiday Name <span class="text-destructive">*</span></Label>
				<Input
					id="modal_holiday_name"
					name="holiday_name"
					bind:value={holidayName}
					oninput={() => {
						if (form && form.field === 'holiday_name') form = null;
						errors.holiday_name = '';
					}}
					placeholder="e.g. Independence Day"
					required
					minlength={6}
					pattern="^[a-zA-Z\s]+$"
					class={errors.holiday_name ? 'border-danger focus-visible:ring-danger/30' : ''}
				/>
				{#if errors.holiday_name}
					<p class="text-xs font-medium text-danger mt-1">{errors.holiday_name}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="modal_holiday_date" class={errors.holiday_date ? 'text-danger' : ''}>Holiday Date <span class="text-destructive">*</span></Label>
				<DatePicker
					id="modal_holiday_date"
					name="holiday_date"
					bind:value={holidayDate}
					onchange={() => {
						if (form && form.field === 'holiday_date') form = null;
						errors.holiday_date = '';
					}}
					required={true}
					max="2099-12-31"
					hasError={!!errors.holiday_date}
				/>
				{#if errors.holiday_date}
					<p class="text-xs font-medium text-danger mt-1">{errors.holiday_date}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="modal_holiday_type" class={errors.holiday_type ? 'text-danger' : ''}>Category <span class="text-destructive">*</span></Label>
				<input type="hidden" id="modal_holiday_type" name="holiday_type" value={holidayType} />
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-3 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 transition-[color,box-shadow] outline-none {errors.holiday_type ? 'border-danger focus:border-danger focus:ring-danger/30 focus-visible:ring-danger/30 data-[state=open]:border-danger data-[state=open]:ring-danger/30' : ''}" {...props}>
								{holidayTypeOptions.find(o => o.value === holidayType)?.label || 'Select Category'}
								<ChevronDownIcon class="ml-2 size-4 opacity-50 shrink-0" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-[220px]">
						<DropdownMenu.Group>
							{#each holidayTypeOptions as opt}
								<DropdownMenu.Item onclick={() => {
									holidayType = opt.value as 'National' | 'Regional' | 'Restricted';
									if (form && form.field === 'holiday_type') form = null;
									errors.holiday_type = '';
								}} class="justify-between cursor-pointer {holidayType === opt.value ? 'bg-accent text-accent-foreground' : ''}">
									{opt.label}
									{#if holidayType === opt.value}<CheckIcon class="size-4" />{/if}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
				{#if errors.holiday_type}
					<p class="text-xs font-medium text-danger mt-1">{errors.holiday_type}</p>
				{/if}
			</div>

			{#if formError && (!form || !('field' in form) || !form.field)}
				<div transition:slide>
					<Alert variant="destructive">
						<AlertDescription>{formError}</AlertDescription>
					</Alert>
				</div>
			{/if}

			</div>

			<div class="flex items-center justify-end gap-3 pt-6 flex-shrink-0">
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
					class="flex-1 sm:flex-initial sm:min-w-28 font-medium"
					disabled={isSubmitDisabled}
				>
					{#if isSubmitting}
						<LoaderCircleIcon class="size-4 animate-spin" />
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
	open={isConfirmOpen}
	title={confirmTitle}
	description={confirmMessage}
	confirmLabel="Delete"
	isSubmitting={isSubmitting}
	onCancel={() => (isConfirmOpen = false)}
	onConfirm={async () => {
		if (activeDeleteCuid) {
			await handleDelete(activeDeleteCuid);
		}
		isConfirmOpen = false;
	}}
/>

<ConfirmModal
	open={isDiscardModalOpen}
	title="Cancel Changes"
	description="Are you sure you want to cancel? All unsaved changes will be lost."
	confirmLabel="Keep Editing"
	onCancel={confirmDiscard}
	onConfirm={() => (isDiscardModalOpen = false)}
/>
