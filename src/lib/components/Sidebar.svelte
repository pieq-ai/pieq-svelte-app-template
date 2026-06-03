<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import { signOut } from '$lib/auth';

	// Lucide icons
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import ShieldIcon from '@lucide/svelte/icons/shield';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import HomeIcon from '@lucide/svelte/icons/home';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import MenuIcon from '@lucide/svelte/icons/menu';

	interface Props {
		user?: { email?: string | null; name?: string | null } | null;
		collapsed?: boolean;
		oncollapse?: (v: boolean) => void;
	}

	let { user = null, collapsed = $bindable(false), oncollapse }: Props = $props();

	function toggle() {
		collapsed = !collapsed;
		oncollapse?.(collapsed);
	}

	async function handleSignOut(e: Event) {
		e.preventDefault();
		await signOut({ redirectTo: resolve('/') });
	}

	function isActive(path: string) {
		return $page.url.pathname === path || $page.url.pathname.startsWith(path + '/');
	}

	const mainNavItems = [
		{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
		{ href: '/roles', label: 'Roles', icon: ShieldIcon },
		{ href: '/shifts', label: 'Shifts', icon: ClockIcon },
		{ href: '/organization_locations', label: 'Locations', icon: MapPinIcon }
	];
</script>

<aside
	class="min-h-screen bg-sidebar-bg text-sidebar-fg flex flex-col shrink-0 transition-[width,transform] duration-250 ease-in-out fixed top-0 left-0 bottom-0 z-40 border-r border-sidebar-border overflow-visible max-md:-translate-x-full max-md:shadow-[0_0_20px_rgba(0,0,0,0.15)] {collapsed ? 'w-sidebar-collapsed-w' : 'w-sidebar-w max-md:translate-x-0 max-md:w-sidebar-w!'}"
>
	<!-- Brand -->
	<div
		class="flex items-center w-full box-border border-b-0 relative gap-2.5 min-h-[64px] overflow-hidden whitespace-nowrap {collapsed ? 'justify-center py-4 px-0' : 'justify-between pt-6 px-4 pb-4'}"
	>
		{#if !collapsed}
			<div class="flex items-center gap-2.5">
				<div class="w-9 h-9 bg-sidebar-accent rounded-lg flex items-center justify-center shrink-0 text-white font-extrabold text-[15px] tracking-[-0.5px] shadow-[0_4px_12px_rgba(244,83,16,0.3)]">
					<Building2Icon size={20} />
				</div>
				<span class="text-base font-bold text-white tracking-[-0.5px] whitespace-nowrap leading-[1.2]">PieQ HRMS</span>
			</div>
			<button
				onclick={toggle}
				class="bg-transparent border-none text-white cursor-pointer p-1 flex items-center justify-center transition-colors duration-200 hover:text-sidebar-accent"
				aria-label="Collapse sidebar"
				title="Collapse sidebar"
			>
				<MenuIcon size={18} />
			</button>
		{:else}
			<button
				onclick={toggle}
				class="bg-transparent border-none text-white cursor-pointer p-1 flex items-center justify-center transition-colors duration-200 hover:text-sidebar-accent"
				aria-label="Expand sidebar"
				title="Expand sidebar"
			>
				<MenuIcon size={18} />
			</button>
		{/if}
	</div>

	<!-- Main Navigation -->
	<nav class="flex-1 py-3 overflow-y-auto overflow-x-hidden">
		{#if user}
			{#each mainNavItems as item}
				<a
					href={resolve(item.href as any)}
					class="group flex items-center gap-2.5 px-4 py-2.5 cursor-pointer text-white no-underline transition-[background-color,color,box-shadow] duration-200 ease-in-out whitespace-nowrap overflow-hidden relative text-sm font-medium my-0.5 mx-2 rounded-lg hover:bg-pieq-primary hover:text-white {isActive(item.href) ? 'bg-pieq-primary' : ''}"
				>
					<span class="w-5 h-5 shrink-0 text-white transition-colors duration-150 group-hover:text-white">
						<item.icon size={18} />
					</span>
					<span class="overflow-hidden whitespace-nowrap transition-all duration-150 {collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}">{item.label}</span>
					<span class="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 bg-pieq-secondary text-white text-xs font-medium px-2.5 py-1.25 rounded-md whitespace-nowrap pointer-events-none z-50 shadow-[0_4px_12px_rgba(0,0,0,0.3)] before:content-[''] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-[5px] before:border-transparent before:border-r-pieq-secondary {collapsed ? 'hidden group-hover:block' : 'hidden'}">{item.label}</span>
				</a>
			{/each}
		{:else}
			<a
				href={resolve('/')}
				class="group flex items-center gap-2.5 px-4 py-2.5 cursor-pointer text-white no-underline transition-[background-color,color,box-shadow] duration-200 ease-in-out whitespace-nowrap overflow-hidden relative text-sm font-medium my-0.5 mx-2 rounded-lg hover:bg-pieq-primary hover:text-white {isActive('/') ? 'bg-pieq-primary' : ''}"
			>
				<span class="w-5 h-5 shrink-0 text-white transition-colors duration-150 group-hover:text-white"><HomeIcon size={18} /></span>
				<span class="overflow-hidden whitespace-nowrap transition-all duration-150 {collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}">Home</span>
				<span class="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 bg-pieq-secondary text-white text-xs font-medium px-2.5 py-1.25 rounded-md whitespace-nowrap pointer-events-none z-50 shadow-[0_4px_12px_rgba(0,0,0,0.3)] before:content-[''] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-[5px] before:border-transparent before:border-r-pieq-secondary {collapsed ? 'hidden group-hover:block' : 'hidden'}">Home</span>
			</a>
		{/if}
	</nav>

	<!-- Bottom Section -->
	<div class="py-2.5 pb-4 border-t border-white/8">
		{#if user}
			<!-- Settings -->
			<a href={resolve('/settings' as any)} class="group flex items-center gap-2.5 px-4 py-2.5 cursor-pointer text-white no-underline transition-[background-color,color,box-shadow] duration-200 ease-in-out whitespace-nowrap overflow-hidden relative text-sm font-medium my-0.5 mx-2 rounded-lg hover:bg-pieq-primary hover:text-white {isActive('/settings') ? 'bg-pieq-primary' : ''}">
				<span class="w-5 h-5 shrink-0 text-white transition-colors duration-150 group-hover:text-white"><SettingsIcon size={18} /></span>
				<span class="overflow-hidden whitespace-nowrap transition-all duration-150 {collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}">Settings</span>
				<span class="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 bg-pieq-secondary text-white text-xs font-medium px-2.5 py-1.25 rounded-md whitespace-nowrap pointer-events-none z-50 shadow-[0_4px_12px_rgba(0,0,0,0.3)] before:content-[''] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-[5px] before:border-transparent before:border-r-pieq-secondary {collapsed ? 'hidden group-hover:block' : 'hidden'}">Settings</span>
			</a>

			<!-- Sign out -->
			<button
				type="button"
				onclick={handleSignOut}
				class="group flex items-center gap-2.5 px-4 py-2.5 cursor-pointer text-white no-underline transition-[background-color,color,box-shadow] duration-200 ease-in-out whitespace-nowrap overflow-hidden relative text-sm font-medium my-0.5 mx-2 rounded-lg hover:bg-pieq-tertiary hover:text-white w-[calc(100%-16px)] border-none bg-transparent text-left box-border"
			>
				<span class="w-5 h-5 shrink-0 text-white transition-colors duration-150 group-hover:text-white"><LogOutIcon size={18} /></span>
				<span class="overflow-hidden whitespace-nowrap transition-all duration-150 {collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}">Sign out</span>
				<span class="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 bg-pieq-secondary text-white text-xs font-medium px-2.5 py-1.25 rounded-md whitespace-nowrap pointer-events-none z-50 shadow-[0_4px_12px_rgba(0,0,0,0.3)] before:content-[''] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-[5px] before:border-transparent before:border-r-pieq-secondary {collapsed ? 'hidden group-hover:block' : 'hidden'}">Sign out</span>
			</button>

			<!-- User Information strip -->
			{#if !collapsed}
				<div class="flex items-center gap-2.5 py-3 px-6 pb-1 mt-2 overflow-hidden whitespace-nowrap">
					<span class="text-[11px] text-white/40 font-medium truncate block w-full" title={user.email ?? user.name ?? ''}>
						{user.email ?? user.name ?? ''}
					</span>
				</div>
			{/if}
		{/if}
	</div>
</aside>

