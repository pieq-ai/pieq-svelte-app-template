<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg'
	import { clearOidcUser, storeOidcUser } from '$lib/auth';
	import { Button, ConfirmationModal } from '$lib/components';
	import Toaster from '$lib/components/ui/toaster.svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { beforeNavigate, goto } from '$app/navigation';
	import { globalIsDirty } from '$lib/stores/navigationGuard';
	import ConfirmModal from '$lib/components/common/ConfirmModal.svelte';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import MenuIcon from '@lucide/svelte/icons/menu';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import LinkIcon from '@lucide/svelte/icons/link';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';
	import UsersRoundIcon from '@lucide/svelte/icons/users-round';
	import WalletIcon from '@lucide/svelte/icons/wallet';
	import ReceiptTextIcon from '@lucide/svelte/icons/receipt-text';
	import BanknoteIcon from '@lucide/svelte/icons/banknote';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import UserCheckIcon from '@lucide/svelte/icons/user-check';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import CalendarCogIcon from '@lucide/svelte/icons/calendar-cog';

	let { children, data } = $props();
	let authenticatedUser = $derived(data.user ?? null);
	let isSidebarCollapsed = $state(false);

	let showGlobalUnsavedModal = $state(false);
	let pendingNavigationUrl = $state('');

	beforeNavigate(({ to, cancel }) => {
		if ($globalIsDirty) {
			cancel();
			if (to?.url) {
				pendingNavigationUrl = to.url.pathname + to.url.search;
				showGlobalUnsavedModal = true;
			}
		}
	});

	function confirmGlobalLeave() {
		$globalIsDirty = false;
		showGlobalUnsavedModal = false;
		if (pendingNavigationUrl) {
			goto(pendingNavigationUrl);
		}
	}

	const protectedNavItems1 = [
		{ label: 'Dashboard', href: resolve('/dashboard'), icon: LayoutDashboardIcon },
		{ label: 'Employees', href: resolve('/employees'), icon: UsersRoundIcon },
		{ label: 'Departments', href: resolve('/departments'), icon: Building2Icon },
		{ label: 'Designations', href: resolve('/designations'), icon: UserRoundIcon },
		{ label: 'Roles', href: resolve('/roles'), icon: UserCheckIcon },
		{ label: 'Shifts', href: resolve('/shifts'), icon: ClockIcon },
		{ label: 'Locations', href: resolve('/organization_locations'), icon: MapPinIcon }
	];

	const salaryRoutes = [
		resolve('/salary-components'),
		resolve('/salary-structures'),
		resolve('/payrolls')
	];
	const salaryManagementItems = [
		{ label: 'Salary Components', href: resolve('/salary-components'), icon: WalletIcon },
		{ label: 'Salary Structures', href: resolve('/salary-structures'), icon: ReceiptTextIcon },
		{ label: 'Payroll', href: resolve('/payrolls'), icon: BanknoteIcon }
	];

	const protectedNavItems2 = [
		{ label: 'Leave Types', href: resolve('/leave-types'), icon: CalendarCogIcon },
		{ label: 'Leave Policies', href: resolve('/leave-policies'), icon: ShieldCheckIcon },
		{ label: 'Holiday Calendar', href: resolve('/holidays'), icon: CalendarIcon },
		{ label: 'Attendance', href: resolve('/attendance'), icon: ClockIcon },
		{ label: 'Attendance Records', href: resolve('/attendance-records'), icon: CalendarIcon },
		{ label: 'System Roles', href: resolve('/system-roles'), icon: ShieldCheckIcon },
		{ label: 'Permissions', href: resolve('/permissions'), icon: KeyRoundIcon },
		{ label: 'Role Permissions', href: resolve('/role-permissions'), icon: LinkIcon }
	];

	let isSalaryManagementExpanded = $state(false);

	$effect(() => {
		const path = $page.url.pathname;
		if (salaryRoutes.some(r => path === r || path.startsWith(r + '/'))) {
			isSalaryManagementExpanded = true;
		}
	});

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

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>PieQ HRMS</title>
</svelte:head>

<div class="flex min-h-screen bg-background text-foreground">
	<Toaster />
	<aside
		class={`sticky top-0 h-screen z-30 flex shrink-0 flex-col border-r border-[#737373]/25 bg-[#262626] text-white shadow-sm transition-[width] duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
		aria-label="Primary navigation"
		data-sveltekit-preload-data="off"
	>
		<div class={`flex h-16 items-center border-b border-white/10 transition-all ${isSidebarCollapsed ? 'justify-center gap-2 px-2' : 'justify-between px-6'}`}>
			{#if !isSidebarCollapsed}
				<a
					href={resolve('/')}
					class="flex min-w-0 items-center gap-3 font-semibold tracking-tight"
					title="PieQ HRMS"
				>
					<span class="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#F45310] text-white">
						<Building2Icon class="size-4" />
					</span>
					<span class="truncate text-base">PieQ HRMS</span>
				</a>
			{/if}
			<Button
				type="button"
				size="icon-sm"
				variant="ghost"
				class="shrink-0 text-white hover:bg-white/10 hover:text-white"
				aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				onclick={() => (isSidebarCollapsed = !isSidebarCollapsed)}
			>
				<MenuIcon class="size-4" />
			</Button>
		</div>
		<!-- Main nav -->
		<nav class="flex flex-1 flex-col gap-1 px-3 py-4 overflow-y-auto">
			{#if authenticatedUser}
				{#each protectedNavItems1 as item (item.href)}
					{@const Icon = item.icon}
					{@const isActive = $page.url.pathname === item.href || $page.url.pathname.startsWith(item.href + '/')}
					<Button
						href={item.href}
						variant="ghost"
						class={`h-10 justify-start gap-3 text-white hover:bg-[#F45310] hover:text-white ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'} ${isActive ? 'bg-[#F45310]' : ''}`}
						title={isSidebarCollapsed ? item.label : undefined}
						aria-label={item.label}
					>
						<Icon class="size-4 shrink-0" />
						{#if !isSidebarCollapsed}
							<span>{item.label}</span>
						{/if}
					</Button>
				{/each}

				<!-- Salary Management expandable group -->
				<div class="flex flex-col gap-1">
					<Button
						variant="ghost"
						class={`h-10 justify-start gap-3 text-white hover:bg-white/10 hover:text-white ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'}`}
						onclick={() => {
							if (isSidebarCollapsed) {
								isSidebarCollapsed = false;
								isSalaryManagementExpanded = true;
							} else {
								isSalaryManagementExpanded = !isSalaryManagementExpanded;
							}
						}}
						title={isSidebarCollapsed ? 'Salary Management' : undefined}
						aria-label="Salary Management"
					>
						<WalletIcon class="size-4 shrink-0" />
						{#if !isSidebarCollapsed}
							<span class="flex-1 text-left">Salary Management</span>
							<ChevronDownIcon class={`size-4 shrink-0 transition-transform duration-200 ${isSalaryManagementExpanded ? 'rotate-0' : '-rotate-90'}`} />
						{/if}
					</Button>

					{#if isSalaryManagementExpanded && !isSidebarCollapsed}
						<div class="flex flex-col gap-1 pl-4 border-l border-white/10 ml-5">
							{#each salaryManagementItems as child (child.href)}
								{@const ChildIcon = child.icon}
								{@const isChildActive = $page.url.pathname === child.href || $page.url.pathname.startsWith(child.href + '/')}
								<Button
									href={child.href}
									variant="ghost"
									class={`h-9 justify-start gap-3 text-white/80 hover:bg-[#F45310] hover:text-white px-3 text-sm ${isChildActive ? 'bg-[#F45310] text-white font-semibold' : ''}`}
									aria-label={child.label}
								>
									<ChildIcon class="size-3.5 shrink-0" />
									<span>{child.label}</span>
								</Button>
							{/each}
						</div>
					{/if}
				</div>

				{#each protectedNavItems2 as item (item.href)}
					{@const Icon = item.icon}
					{@const isActive = $page.url.pathname === item.href || $page.url.pathname.startsWith(item.href + '/')}
					<Button
						href={item.href}
						variant="ghost"
						class={`h-10 justify-start gap-3 text-white hover:bg-[#F45310] hover:text-white ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'} ${isActive ? 'bg-[#F45310]' : ''}`}
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
					href={resolve('/')}
					variant="ghost"
					class={`h-10 justify-start gap-3 text-white hover:bg-[#F45310] hover:text-white ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'}`}
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
		<div class="space-y-2 border-t border-white/10 p-3">
			{#if authenticatedUser}
				{@const isSettingsActive = $page.url.pathname.startsWith('/settings')}
				<Button
					href={resolve('/settings')}
					variant="ghost"
					class={`h-10 w-full justify-start gap-3 text-white hover:bg-[#F45310]/90 hover:text-white ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'} ${isSettingsActive ? 'bg-[#F45310]/90' : ''}`}
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
						class={`h-10 w-full justify-start gap-3 text-white hover:bg-danger hover:text-danger-foreground focus-visible:ring-danger/50 focus-visible:border-danger ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'}`}
						title={isSidebarCollapsed ? 'Sign out' : undefined}
						aria-label="Sign out"
					>
						<LogOutIcon class="size-4 shrink-0" />
						{#if !isSidebarCollapsed}
							<span>Sign out</span>
						{/if}
					</Button>
				</form>
			{/if}
			{#if authenticatedUser && !isSidebarCollapsed}
				<p class="px-3 text-xs text-[#737373] wrap-break-word line-clamp-2" title={authenticatedUser.email}>{authenticatedUser.email}</p>
			{/if}
		</div>
	</aside>

	<main class="min-h-screen flex-1 min-w-0 px-6 py-6">
		{@render children()}
	</main>
</div>

<ConfirmModal 
	open={showGlobalUnsavedModal} 
	title="Cancel Changes" 
	description="Are you sure you want to cancel? All unsaved changes will be lost." 
	cancelLabel="Keep Editing" 
	confirmLabel="Cancel" 
	onCancel={() => showGlobalUnsavedModal = false} 
	onConfirm={confirmGlobalLeave} 
/>

<ConfirmationModal />
