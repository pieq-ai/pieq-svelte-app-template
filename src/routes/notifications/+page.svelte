<script lang="ts">
	import { page } from '$app/stores';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button, SearchInput, FilterDropdown, Checkbox } from '$lib/components';
	import Pagination from '$lib/components/common/Pagination.svelte';
	import CakeIcon from '@lucide/svelte/icons/cake';
	import MegaphoneIcon from '@lucide/svelte/icons/megaphone';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import WalletIcon from '@lucide/svelte/icons/wallet';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import CheckIcon from '@lucide/svelte/icons/check';

	import InboxIcon from '@lucide/svelte/icons/inbox';

	interface NotificationItem {
		cuid: string;
		title: string;
		body: string;
		category: string;
		priority: string;
		type: string;
		is_read: boolean;
		created_at: string;
		metadata: any;
	}

	interface PageData {
		error?: string;
		notifications: NotificationItem[];
		pagination: {
			page: number;
			limit: number;
			total: number;
			totalPages: number;
		};
		filters: {
			category: string;
			unreadOnly: boolean;
			search: string;
		};
	}

	let { data }: { data: PageData } = $props();

	// Local UI state initialized to default values and synchronized in the effect closure
	let searchVal = $state('');
	let categoryVal = $state('');
	let unreadOnlyVal = $state(false);
	let currentPage = $state(1);

	// Sync local state when server data updates (e.g. initial load & back/forward navigation)
	$effect(() => {
		searchVal = data.filters?.search ?? '';
		categoryVal = data.filters?.category ?? '';
		unreadOnlyVal = data.filters?.unreadOnly ?? false;
		currentPage = data.pagination?.page ?? 1;
	});

	function updateFilters() {
		const query = new SvelteURLSearchParams($page.url.searchParams);
		
		if (searchVal) {
			query.set('search', searchVal);
		} else {
			query.delete('search');
		}

		if (categoryVal) {
			query.set('category', categoryVal);
		} else {
			query.delete('category');
		}

		if (unreadOnlyVal) {
			query.set('unreadOnly', 'true');
		} else {
			query.delete('unreadOnly');
		}

		query.set('page', String(currentPage));
		goto(`?${query.toString()}`, { keepFocus: true, noScroll: true });
	}

	// Trigger reload on filter change
	function handleFilterChange() {
		currentPage = 1;
		updateFilters();
	}

	// Trigger reload on page change
	$effect(() => {
		if (currentPage !== data.pagination.page) {
			updateFilters();
		}
	});

	async function markAsRead(item: NotificationItem) {
		if (item.is_read) return;

		try {
			const res = await fetch(resolve(`/api/notifications/${item.cuid}/read`), {
				method: 'PATCH'
			});
			const json = await res.json();
			if (json.data?.success) {
				// Optimistically update list
				data.notifications = data.notifications.map((n: NotificationItem) =>
					n.cuid === item.cuid ? { ...n, is_read: true } : n
				);
				goto($page.url.pathname + $page.url.search, { invalidateAll: true, noScroll: true });
			}
		} catch (err) {
			console.error('Failed to mark read:', err);
		}
	}

	async function archiveNotification(item: NotificationItem) {
		try {
			const res = await fetch(resolve(`/api/notifications/${item.cuid}`), {
				method: 'DELETE'
			});
			const json = await res.json();
			if (json.data?.success) {
				// Optimistically remove item from client list
				data.notifications = data.notifications.filter((n: NotificationItem) => n.cuid !== item.cuid);
				// Trigger refetch / update of stats
				goto($page.url.pathname + $page.url.search, { invalidateAll: true, noScroll: true });
			}
		} catch (err) {
			console.error('Failed to archive:', err);
		}
	}

	async function markAllRead() {
		try {
			const res = await fetch(resolve('/api/notifications/read-all'), {
				method: 'PATCH'
			});
			const json = await res.json();
			if (json.data?.success) {
				goto($page.url.pathname + $page.url.search, { invalidateAll: true, noScroll: true });
			}
		} catch (err) {
			console.error('Failed to mark all read:', err);
		}
	}

	function getCategoryIcon(category: string) {
		switch (category) {
			case 'birthday':
				return CakeIcon;
			case 'holiday':
				return CalendarIcon;
			case 'announcement':
				return MegaphoneIcon;
			case 'payroll':
				return WalletIcon;
			case 'leave':
				return CalendarIcon;
			case 'attendance':
				return ClockIcon;
			default:
				return ShieldCheckIcon;
		}
	}

	function getCategoryColor(category: string) {
		switch (category) {
			case 'birthday':
				return 'bg-pink-500/10 text-pink-500';
			case 'holiday':
				return 'bg-emerald-500/10 text-emerald-500';
			case 'announcement':
				return 'bg-blue-500/10 text-blue-500';
			case 'payroll':
				return 'bg-amber-500/10 text-amber-500';
			case 'leave':
				return 'bg-indigo-500/10 text-indigo-500';
			case 'attendance':
				return 'bg-purple-500/10 text-purple-500';
			default:
				return 'bg-neutral-500/10 text-neutral-500';
		}
	}

	function formatDateTime(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleString(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	}

	const categories = [
		{ label: 'All Categories', value: '' },
		{ label: 'Announcements', value: 'announcement' },
		{ label: 'Leave', value: 'leave' },
		{ label: 'Payroll', value: 'payroll' },
		{ label: 'Attendance', value: 'attendance' },
		{ label: 'Holidays', value: 'holiday' },
		{ label: 'Birthdays', value: 'birthday' },
		{ label: 'System', value: 'system' }
	];
</script>

<svelte:head>
	<title>Notifications – PieQ HRMS</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Notifications</h1>
		</div>
		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				class="gap-1.5 text-xs h-9 cursor-pointer"
				onclick={markAllRead}
				disabled={data.notifications.filter((n: NotificationItem) => !n.is_read).length === 0}
			>
				<CheckIcon class="size-4" />
				Mark all as read
			</Button>
		</div>
	</div>

	{#if data.error}
		<div class="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl text-sm font-medium flex items-center gap-2.5 shadow-sm">
			<svg class="size-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
			</svg>
			<span>{data.error}. Please contact HR to create your employee profile.</span>
		</div>
	{/if}

	<!-- Filters and Search panel -->
	<div class="bg-card border border-border/80 shadow-xs rounded-xl p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		
		<!-- Search & Category Select -->
		<div class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center max-w-2xl">
			<!-- Search -->
			<SearchInput
				id="search_notifications"
				name="search_notifications"
				bind:value={searchVal}
				oninput={handleFilterChange}
				placeholder="Search notifications..."
			/>

			<!-- Category Select -->
			<FilterDropdown
				value={categoryVal}
				onChange={(val) => {
					categoryVal = val;
					handleFilterChange();
				}}
				options={categories}
				allLabel="All Categories"
				triggerClass="w-full sm:w-[180px]"
			/>
		</div>

		<!-- Checkbox Unread Only -->
		<label class="flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-pointer select-none">
			<Checkbox
				checked={unreadOnlyVal}
				onCheckedChange={(val) => {
					unreadOnlyVal = !!val;
					handleFilterChange();
				}}
			/>
			Show unread only
		</label>
	</div>

	<!-- Main Notifications List -->
	<div class="bg-card border border-border/80 shadow-xs rounded-xl overflow-hidden divide-y divide-border/60">
		{#if data.notifications.length === 0}
			<div class="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
				<InboxIcon class="size-16 stroke-1 text-neutral-300 mb-3" />
				<h3 class="text-lg font-semibold text-foreground">No notifications found</h3>
				<p class="text-sm mt-1 max-w-xs">
					Try clearing your search query or choosing a different filter category.
				</p>
			</div>
		{:else}
			{#each data.notifications as item (item.cuid)}
				{@const Icon = getCategoryIcon(item.category)}
				<div
					class={`flex items-start gap-4 p-5 hover:bg-neutral-50/50 transition-colors relative group ${!item.is_read ? 'bg-orange-50/10' : ''}`}
				>
					{#if !item.is_read}
						<div class="absolute left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#F43510] rounded-full"></div>
					{/if}

					<!-- Icon box -->
					<div class={`p-3 rounded-xl shrink-0 ${getCategoryColor(item.category)}`}>
						<Icon class="size-5" />
					</div>

					<!-- Details -->
					<div class="flex-1 min-w-0">
						<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
							<h4 class={`text-sm font-semibold text-foreground leading-snug ${!item.is_read ? 'font-bold' : ''}`}>
								{item.title}
							</h4>
							<span class="text-xs text-neutral-400">
								{formatDateTime(item.created_at)}
							</span>
						</div>
						
						<p class="text-xs text-muted-foreground mt-1.5 leading-relaxed pr-6">
							{item.body}
						</p>

						{#if item.metadata?.link}
							<div class="mt-3">
								<a
									href={resolve(item.metadata.link)}
									class="inline-flex items-center text-xs font-semibold text-[#F43510] hover:text-[#d82f0e] hover:underline"
									onclick={() => markAsRead(item)}
								>
									View details
									<span class="ml-1">→</span>
								</a>
							</div>
						{/if}
					</div>

					<!-- Hover actions -->
					<div class="flex items-center gap-2 shrink-0">
						{#if !item.is_read}
							<button
								type="button"
								class="p-2 rounded-lg hover:bg-neutral-100 text-muted-foreground hover:text-foreground cursor-pointer transition-colors border-none bg-transparent"
								onclick={() => markAsRead(item)}
								title="Mark as read"
								aria-label="Mark as read"
							>
								<CheckIcon class="size-4" />
							</button>
						{/if}
						<button
							type="button"
							class="p-2 rounded-lg hover:bg-neutral-100 text-muted-foreground hover:text-danger cursor-pointer transition-colors border-none bg-transparent"
							onclick={() => archiveNotification(item)}
							title="Archive notification"
							aria-label="Archive notification"
						>
							<Trash2Icon class="size-4" />
						</button>
					</div>
				</div>
			{/each}
		{/if}
	</div>

	<!-- Pagination -->
	{#if data.pagination.totalPages > 1}
		<div class="bg-card border border-border/80 rounded-xl px-6 py-1.5 shadow-xs">
			<Pagination
				bind:currentPage={currentPage}
				pageSize={data.pagination.limit}
				totalItems={data.pagination.total}
			/>
		</div>
	{/if}
</div>
