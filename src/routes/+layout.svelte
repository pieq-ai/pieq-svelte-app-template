<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { clearOidcUser, storeOidcUser } from '$lib/auth';
	import { Button, ToastContainer } from '$lib/components';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import MenuIcon from '@lucide/svelte/icons/menu';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import WalletIcon from '@lucide/svelte/icons/wallet';

	let { children, data } = $props();
	let authenticatedUser = $derived(data.user ?? null);
	let isSidebarCollapsed = $state(false);

	const protectedNavItems = [
		{ label: 'Dashboard', href: resolve('/dashboard'), icon: LayoutDashboardIcon },
		{ label: 'Salary Components', href: resolve('/salary-components'), icon: WalletIcon }
	];

	$effect(() => {
		if (typeof window !== 'undefined' && data.config) {
			window.__PIEQ_CONFIG__ = data.config;
		}
	});

	$effect(() => {
		if (typeof window === 'undefined' || !data.config?.oidc) {
			return;
		}

		const { issuer, clientId } = data.config.oidc;

		if (data.session?.oidcUser) {
			storeOidcUser(issuer, clientId, data.session.oidcUser);
		} else {
			clearOidcUser(issuer, clientId);
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex min-h-screen bg-background text-foreground">
	<aside
		class={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-hrms-sidebar-border bg-hrms-secondary text-white shadow-sm transition-[width] duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
		aria-label="Primary navigation"
	>
		<!-- Brand -->
		<div class={`flex h-16 items-center border-b border-white/10 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-4'}`}>
			{#if !isSidebarCollapsed}
				<a
					href={resolve('/')}
					class="flex min-w-0 items-center gap-3 font-semibold tracking-tight"
					title="PieQ HRMS"
				>
					<span class="flex size-9 shrink-0 items-center justify-center rounded-md bg-hrms-primary text-white">
						<Building2Icon class="size-5" />
					</span>
					<span class="truncate text-base text-white font-medium">PieQ HRMS</span>
				</a>
			{/if}
			<Button
				type="button"
				size="icon-sm"
				variant="ghost"
				class="text-white hover:bg-white/10 hover:text-white"
				aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				onclick={() => (isSidebarCollapsed = !isSidebarCollapsed)}
			>
				<MenuIcon class="size-5" />
			</Button>
		</div>

		<!-- Main nav -->
		<nav class="flex flex-1 flex-col gap-1 px-3 py-4">
			{#if authenticatedUser}
				{#each protectedNavItems as item (item.href)}
					{@const Icon = item.icon}
					{@const isActive = $page.url.pathname.startsWith(item.href)}
					<Button
						href={item.href}
						variant="ghost"
						aria-current={isActive ? 'page' : undefined}
						class={`h-10 justify-start gap-3 text-white hover:bg-hrms-primary hover:text-white ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'} ${isActive ? 'bg-hrms-primary font-semibold' : ''}`}
						title={isSidebarCollapsed ? item.label : undefined}
						aria-label={item.label}
					>
						<Icon class="size-4 shrink-0" />
						{#if !isSidebarCollapsed}
							<span>{item.label}</span>
						{/if}
					</Button>
				{/each}
			{:else}
				<Button
					href={resolve('/auth/signin')}
					variant="ghost"
					class={`h-10 justify-start gap-3 text-white hover:bg-hrms-primary hover:text-white ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'}`}
					title={isSidebarCollapsed ? 'Sign in' : undefined}
					aria-label="Sign in"
				>
					<LogInIcon class="size-4 shrink-0" />
					{#if !isSidebarCollapsed}
						<span>Sign in</span>
					{/if}
				</Button>
			{/if}
		</nav>

		<!-- Bottom section -->
		<div class="space-y-2 border-t border-white/10 p-3">
			{#if authenticatedUser}
				<Button
					href={resolve('/settings')}
					variant="ghost"
					class={`h-10 w-full justify-start gap-3 text-white hover:bg-hrms-tertiary hover:text-white ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'}`}
					title={isSidebarCollapsed ? 'Settings' : undefined}
					aria-label="Settings"
				>
					<SettingsIcon class="size-4 shrink-0" />
					{#if !isSidebarCollapsed}
						<span>Settings</span>
					{/if}
				</Button>
				<form method="POST" action="/auth/signout">
					<Button
						type="submit"
						variant="ghost"
						class={`h-10 w-full justify-start gap-3 text-white hover:bg-hrms-tertiary hover:text-white ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'}`}
						title={isSidebarCollapsed ? 'Sign out' : undefined}
						aria-label="Sign out"
					>
						<LogOutIcon class="size-4 shrink-0" />
						{#if !isSidebarCollapsed}
							<span>Sign out</span>
						{/if}
					</Button>
				</form>
				{#if !isSidebarCollapsed}
					<p class="truncate px-3 text-xs text-hrms-neutral">{authenticatedUser.email}</p>
				{/if}
			{/if}
		</div>
	</aside>

	<!-- Main content -->
	<main
		class={`min-h-screen flex-1 px-6 py-6 transition-[margin] duration-300 ease-in-out ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}
	>
		{@render children()}
	</main>

	<ToastContainer />
</div>
