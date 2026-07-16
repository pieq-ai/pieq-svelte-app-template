<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
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

	// Session seen tracker for popup detection
	const seenCuids = new SvelteSet<string>();
	let isInitialLoad = true;

	// Popup queue and animation states
	let popupQueue = $state<NotificationItem[]>([]);
	let currentPopup = $state<NotificationItem | null>(null);
	let isPopupVisible = $state(false);
	let activeTimeout: any = null;
	let popupTimerStart = 0;
	let popupTimerRemaining = 5000;
	let isHovered = $state(false);

	async function pollNotifications() {
		try {
			// 1. Fetch unread count
			const countRes = await fetch(resolve('/api/notifications/unread-count'));
			const countJson = await countRes.json();
			if (countJson.data) {
				unreadCount = countJson.data.unreadCount;
			}

			// 2. Fetch latest notifications
			const listRes = await fetch(resolve('/api/notifications?limit=10'));
			const listJson = await listRes.json();
			if (listJson.data?.items) {
				const items = listJson.data.items;

				// Keep dropdown items in sync (up to 5)
				notifications = items.slice(0, 5);

				// Diff to find unseen notifications
				const newNotifications: NotificationItem[] = [];
				for (const item of items) {
					if (!seenCuids.has(item.cuid)) {
						seenCuids.add(item.cuid);
						if (!isInitialLoad) {
							newNotifications.push(item);
						}
					}
				}

				if (isInitialLoad) {
					isInitialLoad = false;
				} else if (newNotifications.length > 0) {
					// API returns latest first. Reverse so we queue oldest-first.
					newNotifications.reverse();
					for (const item of newNotifications) {
						queueNotification(item);
					}
				}
			}
		} catch (err) {
			console.error('Failed to poll notifications:', err);
		}
	}

	function queueNotification(item: NotificationItem) {
		// Prevent duplicate popups for the same notification in this session
		if (popupQueue.some(q => q.cuid === item.cuid) || currentPopup?.cuid === item.cuid) {
			return;
		}
		popupQueue.push(item);
		processQueue();
	}

	function processQueue() {
		// Do not process next if a popup is currently visible or transitioning
		if (currentPopup) return;
		if (popupQueue.length === 0) return;

		const next = popupQueue.shift();
		if (next) {
			currentPopup = next;
			isPopupVisible = true;
			isHovered = false;
			popupTimerRemaining = 5000;
			startPopupTimer();
		}
	}

	function startPopupTimer() {
		if (activeTimeout) clearTimeout(activeTimeout);
		popupTimerStart = Date.now();
		activeTimeout = setTimeout(() => {
			dismissPopup();
		}, popupTimerRemaining);
	}

	function pausePopupTimer() {
		if (activeTimeout) {
			clearTimeout(activeTimeout);
			activeTimeout = null;
			const elapsed = Date.now() - popupTimerStart;
			popupTimerRemaining = Math.max(0, popupTimerRemaining - elapsed);
		}
	}

	function dismissPopup() {
		if (activeTimeout) {
			clearTimeout(activeTimeout);
			activeTimeout = null;
		}
		isPopupVisible = false;
		
		// Allow 300ms for retract slide-back animation to finish
		setTimeout(() => {
			currentPopup = null;
			processQueue();
		}, 300);
	}

	function handleMouseEnter() {
		isHovered = true;
		pausePopupTimer();
	}

	function handleMouseLeave() {
		isHovered = false;
		popupTimerStart = Date.now();
		startPopupTimer();
	}

	async function handlePopupClick(item: NotificationItem) {
		// Mark as read if not already read
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
				console.error('Failed to mark popup notification as read:', err);
			}
		}

		// Navigate if a link is present
		if (item.metadata?.link) {
			goto(resolve(item.metadata.link));
		}

		dismissPopup();
	}

	function startPolling() {
		pollNotifications();
		pollingInterval = setInterval(() => {
			pollNotifications();
		}, 5000);
	}

	function stopPolling() {
		if (pollingInterval) {
			clearInterval(pollingInterval);
		}
		if (activeTimeout) {
			clearTimeout(activeTimeout);
		}
	}

	function toggleDropdown() {
		isOpen = !isOpen;
		if (isOpen) {
			// Dismiss any active popup preview when dropdown is opened to avoid overlap
			if (currentPopup) {
				dismissPopup();
			}
			fetchLatestNotifications();
		}
	}

	async function fetchLatestNotifications() {
		try {
			const res = await fetch(resolve('/api/notifications?limit=5'));
			const json = await res.json();
			if (json.data?.items) {
				notifications = json.data.items;
				// Sync seen Cuids with fetched items to prevent future duplicate triggers
				for (const item of notifications) {
					seenCuids.add(item.cuid);
				}
			}
		} catch (err) {
			console.error('Failed to fetch latest notifications:', err);
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
				pollNotifications();
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

	function getLeftAccentClass(category: string) {
		switch (category) {
			case 'birthday':
				return 'bg-pink-500';
			case 'holiday':
				return 'bg-emerald-500';
			case 'announcement':
				return 'bg-blue-500';
			case 'payroll':
				return 'bg-amber-500';
			case 'leave':
				return 'bg-indigo-500';
			case 'attendance':
				return 'bg-purple-500';
			default:
				return 'bg-neutral-500';
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
			class="absolute right-0 mt-3 w-80 sm:w-96 bg-card border border-border shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-xl z-50 overflow-hidden divide-y divide-border transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2 duration-200"
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

	<!-- Animated Notification Popup Preview (Anchored below Bell Icon) -->
	{#if currentPopup && !isOpen}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="notification-popup absolute right-0 top-full mt-3 w-80 sm:w-96 bg-card border border-border shadow-[0_12px_45px_rgba(0,0,0,0.12)] rounded-xl z-[60] overflow-hidden cursor-pointer"
			class:popup-visible={isPopupVisible}
			class:popup-hidden={!isPopupVisible}
			onmouseenter={handleMouseEnter}
			onmouseleave={handleMouseLeave}
			onclick={() => currentPopup && handlePopupClick(currentPopup)}
		>
			<div class="flex items-start gap-3 p-3.5 relative">
				<!-- Left Accent Strip -->
				<div class={`absolute left-0 top-0 bottom-0 w-1 ${getLeftAccentClass(currentPopup.category)}`}></div>

				<!-- Icon -->
				<div class={`p-2 rounded-lg shrink-0 ${getCategoryColor(currentPopup.category)}`}>
					{#each [getCategoryIcon(currentPopup.category)] as Icon}
						<Icon class="size-4" />
					{/each}
				</div>

				<!-- Content -->
				<div class="flex-1 min-w-0 pr-4">
					<div class="flex items-center justify-between gap-2">
						<p class="text-xs font-bold leading-tight text-foreground truncate">
							{currentPopup.title}
						</p>
						{#if currentPopup.priority === 'high' || currentPopup.priority === 'urgent'}
							<span class="px-1.5 py-0.5 text-[9px] font-semibold bg-red-100 text-red-600 rounded shrink-0">
								{currentPopup.priority.toUpperCase()}
							</span>
						{/if}
					</div>
					<p class="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-normal">
						{currentPopup.body}
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.notification-popup {
		transform-origin: top right;
		opacity: 0;
		transform: scale(0.8) translateY(-12px);
		transition: opacity 300ms cubic-bezier(0.16, 1, 0.3, 1), transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
		pointer-events: none;
	}

	.notification-popup.popup-visible {
		opacity: 1;
		transform: scale(1) translateY(0);
		pointer-events: auto;
	}

	.notification-popup.popup-hidden {
		opacity: 0;
		transform: scale(0.8) translateY(-12px);
		pointer-events: none;
	}
</style>
