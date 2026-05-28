<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { slide } from 'svelte/transition';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import CalendarCogIcon from '@lucide/svelte/icons/calendar-cog';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	let {
		isCollapsed = $bindable(false),
		userEmail = ''
	}: {
		isCollapsed: boolean;
		userEmail?: string;
	} = $props();

	const menuItems = [
		{
			name: 'Dashboard',
			href: '/dashboard',
			icon: LayoutDashboardIcon
		},
		{
			name: 'Leave Type',
			href: '/leave-types',
			icon: CalendarCogIcon
		},
		{
			name: 'Leave Policy',
			href: '/leave-policies',
			icon: ShieldCheckIcon
		},
		{
			name: 'Holidays',
			href: '/holidays',
			icon: CalendarIcon
		}
	];

	function toggleCollapse() {
		isCollapsed = !isCollapsed;
	}
</script>

<aside
	class="flex flex-col border-r border-border bg-card text-card-foreground transition-all duration-300 {isCollapsed ? 'w-16' : 'w-64'} shrink-0 h-screen sticky top-0 z-40 select-none"
>
	<!-- Top Branding Header -->
	<div class="flex items-center justify-between px-4 py-5 border-b border-border h-16 shrink-0 overflow-hidden">
		{#if !isCollapsed}
			<span transition:slide={{ axis: 'x', duration: 150 }} class="font-bold text-lg tracking-tight text-primary truncate">
				PieQ HRMS
			</span>
		{/if}
		<button
			type="button"
			onclick={toggleCollapse}
			class="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center justify-center shrink-0 {isCollapsed ? 'mx-auto' : ''}"
			title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
			aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
		>
			{#if isCollapsed}
				<ChevronRightIcon class="size-4" />
			{:else}
				<ChevronLeftIcon class="size-4" />
			{/if}
		</button>
	</div>

	<!-- Menu Links -->
	<nav class="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
		{#each menuItems as item (item.name)}
			{@const isActive = page.url.pathname === item.href || page.url.pathname.startsWith(item.href + '/')}
			{@const Icon = item.icon}
			<a
				href={resolve(item.href as '/dashboard')}
				class="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group cursor-pointer
					{isActive 
						? 'bg-primary text-primary-foreground font-semibold shadow-sm' 
						: 'text-muted-foreground hover:text-foreground hover:bg-accent'}"
				title={isCollapsed ? item.name : undefined}
			>
				<Icon class="size-4 shrink-0 transition-transform group-hover:scale-105" />
				{#if !isCollapsed}
					<span transition:slide={{ axis: 'x', duration: 150 }} class="truncate">{item.name}</span>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- Bottom Section (Settings & Sign Out) -->
	<div class="p-3 border-t border-border space-y-1.5 shrink-0 bg-transparent">
		<!-- Settings link -->
		<a
			href={resolve('/settings' as '/dashboard')}
			class="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group cursor-pointer
				{page.url.pathname === '/settings' 
					? 'bg-primary text-primary-foreground font-semibold shadow-sm' 
					: 'text-muted-foreground hover:text-foreground hover:bg-accent'}"
			title={isCollapsed ? "Settings" : undefined}
		>
			<SettingsIcon class="size-4 shrink-0 transition-transform group-hover:scale-105" />
			{#if !isCollapsed}
				<span transition:slide={{ axis: 'x', duration: 150 }} class="truncate">Settings</span>
			{/if}
		</a>

		<!-- User display in expanded mode -->
		{#if !isCollapsed && userEmail}
			<div class="px-3 py-1.5 text-xs text-muted-foreground truncate border-t border-border/30 mt-1 select-text" title={userEmail}>
				{userEmail}
			</div>
		{/if}

		<!-- Sign Out Form Button -->
		<form method="POST" action="/auth/signout" class="w-full">
			<button
				type="submit"
				class="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer group"
				title={isCollapsed ? "Sign out" : undefined}
			>
				<LogOutIcon class="size-4 shrink-0 transition-transform group-hover:scale-105 text-destructive" />
				{#if !isCollapsed}
					<span transition:slide={{ axis: 'x', duration: 150 }} class="truncate">Sign out</span>
				{/if}
			</button>
		</form>
	</div>
</aside>
