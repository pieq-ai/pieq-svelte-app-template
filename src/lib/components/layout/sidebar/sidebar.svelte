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
	import XIcon from '@lucide/svelte/icons/x';

	let {
		isCollapsed = $bindable(false),
		isMobileOpen = $bindable(false),
		userEmail = ''
	}: {
		isCollapsed: boolean;
		isMobileOpen?: boolean;
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
	class="flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width,transform] duration-300 
		fixed lg:static top-0 left-0 h-screen z-50 lg:z-40 w-64 lg:shrink-0 select-none shadow-xl lg:shadow-none
		{isCollapsed ? 'lg:w-16' : 'lg:w-64'}
		{isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}"
>
	<!-- Top Branding Header -->
	<div class="flex items-center px-4 py-5 border-b border-sidebar-border h-16 shrink-0 overflow-hidden {isCollapsed ? 'justify-center' : 'justify-between gap-3'}">
		{#if !isCollapsed}
			<div class="flex items-center gap-2.5 overflow-hidden">
				<!-- Orange Logo Square -->
				<div class="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-xs select-none">
					<svg class="size-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
						<path d="M22 12A10 10 0 0 0 12 2v10z" />
					</svg>
				</div>
				<span transition:slide={{ axis: 'x', duration: 150 }} class="font-bold text-lg tracking-tight text-sidebar-foreground truncate select-none">
					PieQ HRMS
				</span>
			</div>
		{/if}

		<button
			type="button"
			onclick={toggleCollapse}
			class="hidden lg:flex p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors cursor-pointer items-center justify-center shrink-0 {isCollapsed ? 'mx-auto' : ''}"
			title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
			aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
		>
			<svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
			</svg>
		</button>

		<button
			type="button"
			onclick={() => (isMobileOpen = false)}
			class="lg:hidden p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors cursor-pointer flex items-center justify-center shrink-0"
			aria-label="Close sidebar"
		>
			<XIcon class="size-5" />
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
						? 'bg-primary text-white font-semibold shadow-xs' 
						: 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'}"
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
	<div class="p-3 border-t border-sidebar-border space-y-1.5 shrink-0 bg-transparent">
		<!-- Settings link -->
		<a
			href={resolve('/settings' as '/dashboard')}
			class="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group cursor-pointer
				{page.url.pathname === '/settings' 
					? 'bg-primary text-white font-semibold shadow-xs' 
					: 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'}"
			title={isCollapsed ? "Settings" : undefined}
		>
			<SettingsIcon class="size-4 shrink-0 transition-transform group-hover:scale-105" />
			{#if !isCollapsed}
				<span transition:slide={{ axis: 'x', duration: 150 }} class="truncate">Settings</span>
			{/if}
		</a>

		<!-- Sign Out Form Button -->
		<form method="POST" action="/auth/signout" class="w-full" novalidate>
			<button
				type="submit"
				class="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors cursor-pointer group"
				title={isCollapsed ? "Sign out" : undefined}
			>
				<LogOutIcon class="size-4 shrink-0 transition-transform group-hover:scale-105" />
				{#if !isCollapsed}
					<span transition:slide={{ axis: 'x', duration: 150 }} class="truncate">Sign out</span>
				{/if}
			</button>
		</form>

		<!-- User display in expanded mode -->
		{#if !isCollapsed && userEmail}
			<div class="px-3 py-1.5 text-xs text-sidebar-foreground/50 truncate border-t border-sidebar-border/30 mt-1 select-text" title={userEmail}>
				{userEmail}
			</div>
		{/if}
	</div>
</aside>
