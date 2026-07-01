<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg'
	import { clearOidcUser, storeOidcUser } from '$lib/auth';
	import { Button } from '$lib/components';
	import Toaster from '$lib/components/ui/toaster.svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { beforeNavigate, goto } from '$app/navigation';
	import { globalIsDirty } from '$lib/stores/navigationGuard';
	import { canAccess } from '$lib/authz';
	import { 
		mainNavItems, 
		leaveManagementItems, 
		attendanceManagementItems, 
		shiftManagementItems, 
		salaryManagementItems, 
		systemNavItems 
	} from '$lib/config/navigation';
	import ConfirmModal from '$lib/components/common/ConfirmModal.svelte';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import MenuIcon from '@lucide/svelte/icons/menu';
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import FingerprintIcon from '@lucide/svelte/icons/fingerprint';
	import CalendarClockIcon from '@lucide/svelte/icons/calendar-clock';
	import WalletIcon from '@lucide/svelte/icons/wallet';

	let { children, data } = $props();
	let authenticatedUser = $derived(data.user ?? null);
    
    $effect(() => {
        console.log("[DIAG-8] +layout.svelte authenticatedUser:", authenticatedUser);
    });

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

	let isLeaveManagementExpanded = $state(false);
	let isAttendanceManagementExpanded = $state(false);
	let isShiftManagementExpanded = $state(false);
	let isSalaryManagementExpanded = $state(false);

	$effect(() => {
		const path = $page.url.pathname;
		if (leaveManagementItems.some(i => path === i.href || path.startsWith(i.href + '/'))) {
			isLeaveManagementExpanded = true;
		}
		if (attendanceManagementItems.some(i => path === i.href || path.startsWith(i.href + '/'))) {
			isAttendanceManagementExpanded = true;
		}
		if (shiftManagementItems.some(i => path === i.href || path.startsWith(i.href + '/'))) {
			isShiftManagementExpanded = true;
		}
		if (salaryManagementItems.some(i => path === i.href || path.startsWith(i.href + '/'))) {
			isSalaryManagementExpanded = true;
		}
	});

	let isManager = $derived(data.isManager ?? false);

	let navItems = $derived(
		mainNavItems
			.filter(item => canAccess(authenticatedUser, item.permission))
			.map(item => ({ ...item, href: resolve(item.href as any) }))
	);

	let visibleLeaveManagementItems = $derived(
		leaveManagementItems
			.filter(item => canAccess(authenticatedUser, item.permission))
			.map(item => ({ ...item, href: resolve(item.href as any) }))
	);

	let visibleAttendanceManagementItems = $derived(
		attendanceManagementItems
			.filter(item => canAccess(authenticatedUser, item.permission))
			.map(item => ({ ...item, href: resolve(item.href as any) }))
	);

	let visibleShiftManagementItems = $derived(
		shiftManagementItems
			.filter(item => canAccess(authenticatedUser, item.permission))
			.map(item => ({ ...item, href: resolve(item.href as any) }))
	);

	let visibleSalaryManagementItems = $derived(
		salaryManagementItems
			.filter(item => canAccess(authenticatedUser, item.permission))
			.map(item => ({ ...item, href: resolve(item.href as any) }))
	);

	let visibleSystemNavItems = $derived(
		systemNavItems
			.filter(item => canAccess(authenticatedUser, item.permission))
			.map(item => ({ ...item, href: resolve(item.href as any) }))
	);

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
				{#each navItems as item (item.href)}
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

				<!-- Leave Management expandable group -->
				{#if visibleLeaveManagementItems.length > 0}
				<div class="flex flex-col gap-1">
					<Button
						variant="ghost"
						class={`h-10 justify-start gap-3 text-white hover:bg-white/10 hover:text-white ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'}`}
						onclick={() => {
							if (isSidebarCollapsed) {
								isSidebarCollapsed = false;
								isLeaveManagementExpanded = true;
							} else {
								isLeaveManagementExpanded = !isLeaveManagementExpanded;
							}
						}}
						title={isSidebarCollapsed ? 'Leave Management' : undefined}
						aria-label="Leave Management"
					>
						<CalendarIcon class="size-4 shrink-0" />
						{#if !isSidebarCollapsed}
							<span class="flex-1 text-left">Leave Management</span>
							<ChevronDownIcon class={`size-4 shrink-0 transition-transform duration-200 ${isLeaveManagementExpanded ? 'rotate-0' : '-rotate-90'}`} />
						{/if}
					</Button>

					{#if isLeaveManagementExpanded && !isSidebarCollapsed}
						<div class="flex flex-col gap-1 pl-4 border-l border-white/10 ml-5">
							{#each visibleLeaveManagementItems as child (child.href)}
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
				{/if}

				<!-- Attendance Management expandable group -->
				{#if visibleAttendanceManagementItems.length > 0}
				<div class="flex flex-col gap-1">
					<Button
						variant="ghost"
						class={`h-10 justify-start gap-3 text-white hover:bg-white/10 hover:text-white ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'}`}
						onclick={() => {
							if (isSidebarCollapsed) {
								isSidebarCollapsed = false;
								isAttendanceManagementExpanded = true;
							} else {
								isAttendanceManagementExpanded = !isAttendanceManagementExpanded;
							}
						}}
						title={isSidebarCollapsed ? 'Attendance Management' : undefined}
						aria-label="Attendance Management"
					>
						<FingerprintIcon class="size-4 shrink-0" />
						{#if !isSidebarCollapsed}
							<span class="flex-1 text-left">Attendance Management</span>
							<ChevronDownIcon class={`size-4 shrink-0 transition-transform duration-200 ${isAttendanceManagementExpanded ? 'rotate-0' : '-rotate-90'}`} />
						{/if}
					</Button>

					{#if isAttendanceManagementExpanded && !isSidebarCollapsed}
						<div class="flex flex-col gap-1 pl-4 border-l border-white/10 ml-5">
							{#each visibleAttendanceManagementItems as child (child.href)}
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
				{/if}

				<!-- Shift Management expandable group -->
				{#if visibleShiftManagementItems.length > 0}
				<div class="flex flex-col gap-1">
					<Button
						variant="ghost"
						class={`h-10 justify-start gap-3 text-white hover:bg-white/10 hover:text-white ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'}`}
						onclick={() => {
							if (isSidebarCollapsed) {
								isSidebarCollapsed = false;
								isShiftManagementExpanded = true;
							} else {
								isShiftManagementExpanded = !isShiftManagementExpanded;
							}
						}}
						title={isSidebarCollapsed ? 'Shift Management' : undefined}
						aria-label="Shift Management"
					>
						<CalendarClockIcon class="size-4 shrink-0" />
						{#if !isSidebarCollapsed}
							<span class="flex-1 text-left">Shift Management</span>
							<ChevronDownIcon class={`size-4 shrink-0 transition-transform duration-200 ${isShiftManagementExpanded ? 'rotate-0' : '-rotate-90'}`} />
						{/if}
					</Button>

					{#if isShiftManagementExpanded && !isSidebarCollapsed}
						<div class="flex flex-col gap-1 pl-4 border-l border-white/10 ml-5">
							{#each visibleShiftManagementItems as child (child.href)}
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
				{/if}

				<!-- Salary Management expandable group -->
				{#if visibleSalaryManagementItems.length > 0}
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
							{#each visibleSalaryManagementItems as child (child.href)}
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
				{/if}

				{#each visibleSystemNavItems as item (item.href)}
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
				<form method="GET" action="/auth/logout">
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