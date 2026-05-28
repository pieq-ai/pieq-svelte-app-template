<script lang="ts">
	import { slide } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { SvelteDate } from 'svelte/reactivity';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import EditIcon from '@lucide/svelte/icons/pencil';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
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
	} from '$lib/components';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let searchQuery = $state('');
	let filterType = $state<string>('all');
	let isSubmitting = $state(false);
	let isFormModalOpen = $state(false);

	// Confirm Modal states
	let isConfirmOpen = $state(false);
	let confirmTitle = $state('');
	let confirmMessage = $state('');
	let activeDeleteForm = $state<HTMLFormElement | null>(null);

	function openAddModal() {
		holidayName = '';
		holidayDate = '';
		holidayType = 'national';
		isFormModalOpen = true;
	}

	let tomorrowStr = $derived.by(() => {
		const today = new Date();
		const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
		const y = tomorrow.getFullYear();
		const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
		const d = String(tomorrow.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	});

	let clientDateError = $derived.by(() => {
		if (!holidayDate) return '';
		const parts = holidayDate.split('-');
		if (parts.length !== 3) return '';
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
	});

	// Active Edit Mode Detection from URL query parameter
	let editCuid = $derived(page.url.searchParams.get('edit'));
	let editingHoliday = $derived(data.holidays.find((h) => h.cuid === editCuid));

	// Form local state
	let holidayName = $state('');
	let holidayDate = $state('');
	let holidayType = $state<'national' | 'regional' | 'restricted'>('national');

	// Synchronise form inputs when URL edit parameter changes
	$effect(() => {
		if (form && 'action' in form && form.action === 'update' && 'cuid' in form && form.cuid === editCuid) {
			if ('holiday_name' in form) holidayName = String(form.holiday_name);
			if ('holiday_date' in form) holidayDate = String(form.holiday_date);
			if ('holiday_type' in form) holidayType = form.holiday_type as 'national' | 'regional' | 'restricted';
		} else if (form && 'action' in form && form.action === 'create' && !editCuid) {
			if ('holiday_name' in form) holidayName = String(form.holiday_name);
			if ('holiday_date' in form) holidayDate = String(form.holiday_date);
			if ('holiday_type' in form) holidayType = form.holiday_type as 'national' | 'regional' | 'restricted';
		} else if (editingHoliday) {
			holidayName = editingHoliday.holiday_name;
			const dateObj = new Date(editingHoliday.holiday_date);
			const year = dateObj.getUTCFullYear();
			const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
			const day = String(dateObj.getUTCDate()).padStart(2, '0');
			holidayDate = `${year}-${month}-${day}`;
			holidayType = editingHoliday.holiday_type;
		} else {
			holidayName = '';
			holidayDate = '';
			holidayType = 'national';
		}
	});

	// Sync isFormModalOpen with editCuid
	$effect(() => {
		if (editCuid) {
			isFormModalOpen = true;
		}
	});

	// Clear query parameter on modal close
	$effect(() => {
		if (!isFormModalOpen && editCuid) {
			goto(resolve('/holidays'), { replaceState: true });
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
					<option value="national">National</option>
					<option value="regional">Regional</option>
					<option value="restricted">Restricted</option>
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
									{#if holiday.holiday_type === 'national'}
										<Badge
											class="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white border-0 capitalize"
										>
											{holiday.holiday_type}
										</Badge>
									{:else}
										{#if holiday.holiday_type === 'regional'}
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
								<TableCell class="text-right space-x-1">
									<!-- Edit Action -->
									<a
										href={resolve(('/holidays?edit=' + holiday.cuid) as '/holidays')}
										class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8"
										title="Edit Holiday"
									>
										<EditIcon class="size-4" />
									</a>

									<!-- Delete Action -->
									<form
										method="POST"
										action="?/delete"
										class="inline"
										use:enhance={() => {
											isSubmitting = true;
											return async ({ result, update }) => {
												if (result.type === 'success') {
													toast.success('Holiday deleted successfully!');
												} else if (result.type === 'failure') {
													toast.error(String(result.data?.error || 'Action failed'));
												}
												await update();
												isSubmitting = false;
											};
										}}
									>
										<input type="hidden" name="cuid" value={holiday.cuid} />
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											class="text-destructive hover:text-destructive/80 size-8"
											title="Delete Holiday"
											disabled={isSubmitting}
											onclick={(e) => {
												activeDeleteForm = e.currentTarget.closest('form');
												confirmTitle = 'Delete Holiday';
												confirmMessage = 'Are you sure you want to delete this holiday?';
												isConfirmOpen = true;
											}}
										>
											<TrashIcon class="size-4" />
										</Button>
									</form>
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
	action={editCuid ? '?/update' : '?/create'}
	useEnhance={() => {
		isSubmitting = true;
		return async ({ result, update }) => {
			if (result.type === 'success') {
				toast.success(
					editCuid
						? 'Holiday updated successfully!'
						: 'Holiday created successfully!'
				);
				isFormModalOpen = false;
				if (editCuid) {
					await goto(resolve('/holidays'), { replaceState: true });
				}
				await update({ reset: true });
			} else if (result.type === 'failure') {
				toast.error(String(result.data?.error || 'Validation failed'));
				await update({ reset: false });
			} else {
				await update();
			}
			isSubmitting = false;
		};
	}}
>
	{#if editCuid}
		<input type="hidden" name="cuid" value={editCuid} />
	{/if}

	<div class="space-y-2">
		<Label for="modal_holiday_name" class={form && 'field' in form && form.field === 'holiday_name' ? 'text-destructive' : ''}>Holiday Name</Label>
		<Input
			id="modal_holiday_name"
			name="holiday_name"
			bind:value={holidayName}
			placeholder="e.g. Independence Day"
			required
			minlength={3}
			pattern="^[a-zA-Z0-9\s'-]+$"
			class={form && 'field' in form && form.field === 'holiday_name' ? 'border-destructive focus-visible:ring-destructive' : ''}
		/>
		{#if form && 'field' in form && form.field === 'holiday_name'}
			<p class="text-xs font-medium text-destructive mt-1">{form.error}</p>
		{/if}
	</div>

	<div class="space-y-2">
		<Label for="modal_holiday_date" class={(form && 'field' in form && form.field === 'holiday_date') || clientDateError ? 'text-destructive' : ''}>Date</Label>
		<Input
			id="modal_holiday_date"
			name="holiday_date"
			type="date"
			bind:value={holidayDate}
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
		<Label for="modal_holiday_type" class={form && 'field' in form && form.field === 'holiday_type' ? 'text-destructive' : ''}>Category</Label>
		<select
			id="modal_holiday_type"
			name="holiday_type"
			bind:value={holidayType}
			class="dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] focus-visible:ring-3 md:text-sm w-full min-w-0 outline-none {form && 'field' in form && form.field === 'holiday_type' ? 'border-destructive focus-visible:ring-destructive' : 'border-input'}"
			required
		>
			<option value="national">National Holiday</option>
			<option value="regional">Regional Holiday</option>
			<option value="restricted">Restricted Holiday</option>
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

	<Button type="submit" class="w-full" disabled={isSubmitting || !!clientDateError}>
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
		activeDeleteForm?.requestSubmit();
	}}
/>
