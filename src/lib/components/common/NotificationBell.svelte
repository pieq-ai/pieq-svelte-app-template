<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto, afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import BellIcon from '@lucide/svelte/icons/bell';
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

	let isOpen = $state(false);
	let unreadCount = $state(0);
	let notifications = $state<NotificationItem[]>([]);
	let pollingInterval: any = null;
	let dropdownElement = $state<HTMLElement | null>(null);

	async function fetchUnreadCount() {
		try {
			const res = await fetch(resolve('/api/notifications/unread-count'));
			const json = await res.json();
			if (json.data) {
				unreadCount = json.data.unreadCount;
			}
		} catch (err) {
			console.error('Failed to fetch unread count:', err);
		}
	}

	async function fetchLatestNotifications() {
		try {
			const res = await fetch(resolve('/api/notifications?limit=5'));
			const json = await res.json();
			if (json.data?.items) {
				notifications = json.data.items;
			}
		} catch (err) {
			console.error('Failed to fetch latest notifications:', err);
		}
	}

	function startPolling() {
		fetchUnreadCount();
		if (isOpen) fetchLatestNotifications();

		pollingInterval = setInterval(() => {
			fetchUnreadCount();
			if (isOpen) fetchLatestNotifications();
		}, 30000);
	}

	function stopPolling() {
		if (pollingInterval) {
			clearInterval(pollingInterval);
		}
	}

	function toggleDropdown() {
		isOpen = !isOpen;
		if (isOpen) {
			fetchLatestNotifications();
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (isOpen && dropdownElement && !dropdownElement.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	async function handleMarkAllAsRead() {
		try {
			const res = await fetch(resolve('/api/notifications/read-all'), {
				method: 'PATCH'
			});
			const json = await res.json();
			if (json.data?.success) {
				unreadCount = 0;
				notifications = notifications.map((n) => ({ ...n, is_read: true }));
			}
		} catch (err) {
			console.error('Failed to mark all as read:', err);
		}
	}

	function handleNotificationClick(item: NotificationItem) {
		if (item.metadata?.link) {
			goto(resolve(item.metadata.link));
		}
	}

	async function handleMarkAsRead(event: Event, item: NotificationItem) {
		event.stopPropagation();
		if (!item.is_read) {
			try {
				const res = await fetch(resolve(`/api/notifications/${item.cuid}/read`), {
					method: 'PATCH'
				});
				const json = await res.json();
				if (json.data?.success) {
					notifications = notifications.map((n) =>
						n.cuid === item.cuid ? { ...n, is_read: true } : n
					);
					unreadCount = Math.max(0, unreadCount - 1);
				}
			} catch (err) {
				console.error('Failed to mark single notification as read:', err);
			}
		}
	}

	async function handleArchiveNotification(event: Event, item: NotificationItem) {
		event.stopPropagation();
		try {
			const res = await fetch(resolve(`/api/notifications/${item.cuid}`), {
				method: 'DELETE'
			});
			const json = await res.json();
			if (json.data?.success) {
				notifications = notifications.filter((n) => n.cuid !== item.cuid);
				fetchUnreadCount();
			}
		} catch (err) {
			console.error('Failed to archive notification:', err);
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
			case 'system':
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

	function formatRelativeTime(dateString: string) {
		const now = new Date();
		const date = new Date(dateString);
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 30) return `${diffDays}d ago`;
		return date.toLocaleDateString();
	}

	onMount(() => {
		startPolling();
		window.addEventListener('click', handleClickOutside);
	});

	onDestroy(() => {
		stopPolling();
		if (typeof window !== 'undefined') {
			window.removeEventListener('click', handleClickOutside);
		}
	});

	afterNavigate(() => {
		isOpen = false;
	});
</script>

<div class="relative" bind:this={dropdownElement}>
	<button
		type="button"
		class="relative p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-neutral-100 transition-colors focus:outline-none cursor-pointer"
		onclick={toggleDropdown}
		aria-label="Toggle notifications"
	>
		<BellIcon class="size-5" />
		{#if unreadCount > 0}
			<span
				class="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/3 -translate-y-1/3 bg-[#F43510] rounded-full min-w-5 h-5 border-2 border-white"
			>
				{unreadCount > 99 ? '99+' : unreadCount}
			</span>
		{/if}
	</button>

	{#if isOpen}
		<div
			class="absolute right-0 mt-3 w-80 sm:w-96 bg-card border border-border shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-xl z-50 overflow-hidden divide-y divide-border transform origin-top-right transition-all"
			role="menu"
		>
			<!-- Header -->
			<div class="flex items-center justify-between px-4 py-3 bg-neutral-50/50">
				<h3 class="text-sm font-semibold text-foreground">Notifications</h3>
				{#if unreadCount > 0}
					<button
						type="button"
						class="text-xs font-medium text-[#F43510] hover:text-[#d82f0e] bg-transparent border-none cursor-pointer flex items-center gap-1"
						onclick={handleMarkAllAsRead}
					>
						<CheckIcon class="size-3.5" />
						Mark all read
					</button>
				{/if}
			</div>

			<!-- List -->
			<div class="max-h-[350px] overflow-y-auto divide-y divide-border/60">
				{#if notifications.length === 0}
					<div class="flex flex-col items-center justify-center py-10 px-4 text-center text-muted-foreground">
						<InboxIcon class="size-8 stroke-1 mb-2 text-neutral-300" />
						<p class="text-sm font-medium">No new notifications</p>
						<p class="text-xs mt-1">We'll alert you when something happens.</p>
					</div>
				{:else}
					{#each notifications as item (item.cuid)}
						{@const Icon = getCategoryIcon(item.category)}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<div
							class={`flex items-start gap-3 p-3.5 hover:bg-neutral-50/80 transition-colors cursor-pointer relative group ${!item.is_read ? 'bg-orange-50/15' : ''}`}
							role="listitem"
							onclick={() => handleNotificationClick(item)}
						>
							{#if !item.is_read}
								<div class="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#F43510] rounded-full"></div>
							{/if}

							<div class={`p-2 rounded-lg shrink-0 ${getCategoryColor(item.category)}`}>
								<Icon class="size-4" />
							</div>

							<div class="flex-1 min-w-0 pr-16">
								<p class={`text-xs font-semibold leading-tight text-foreground truncate ${!item.is_read ? 'font-bold' : ''}`}>
									{item.title}
								</p>
								<p class="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-normal">
									{item.body}
								</p>
								<span class="text-[9px] text-neutral-400 font-medium block mt-1.5">
									{formatRelativeTime(item.created_at)}
								</span>
							</div>

							<div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
								{#if !item.is_read}
									<button
										type="button"
										class="p-1.5 rounded-md hover:bg-neutral-100 text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
										onclick={(e) => handleMarkAsRead(e, item)}
										aria-label="Mark as read"
										title="Mark as read"
									>
										<CheckIcon class="size-3.5" />
									</button>
								{/if}
								<button
									type="button"
									class="p-1.5 rounded-md hover:bg-neutral-100 text-muted-foreground hover:text-danger cursor-pointer border-none bg-transparent"
									onclick={(e) => handleArchiveNotification(e, item)}
									aria-label="Archive notification"
									title="Archive"
								>
									<Trash2Icon class="size-3.5" />
								</button>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Footer -->
			<div class="px-4 py-2 bg-neutral-50/50 text-center">
				<a
					href={resolve('/notifications')}
					class="inline-block text-xs font-semibold text-[#F43510] hover:text-[#d82f0e] hover:underline py-1"
					onclick={() => (isOpen = false)}
				>
					View all notifications
				</a>
			</div>
		</div>
	{/if}
</div>
