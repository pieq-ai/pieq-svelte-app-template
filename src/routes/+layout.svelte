<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg'
	import { clearOidcUser, storeOidcUser } from '$lib/auth';
	import { Button } from '$lib/components';
	import NotificationBell from '$lib/components/common/NotificationBell.svelte';
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
	import FingerprintIcon from '@lucide/svelte/icons/fingerprint';
	import CalendarClockIcon from '@lucide/svelte/icons/calendar-clock';

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
		{ label: 'Roles', href: resolve('/roles'), icon: UserCheckIcon }
	];

	const leaveRoutes = [
		resolve('/leaves'),
		resolve('/leave-types'),
		resolve('/leave-policies'),
		resolve('/holidays')
	];

	const leaveManagementItems = [
		{ label: 'Leave Overview', href: resolve('/leaves'), icon: CalendarIcon },
		{ label: 'Leave Types', href: resolve('/leave-types'), icon: CalendarCogIcon },
		{ label: 'Leave Policies', href: resolve('/leave-policies'), icon: ShieldCheckIcon },
		{ label: 'Holiday Calendar', href: resolve('/holidays'), icon: CalendarIcon }
	];

	const attendanceRoutes = [
		resolve('/organization_locations'),
		resolve('/attendance'),
		resolve('/attendance-records')
	];

	const attendanceManagementItems = [
		{ label: 'Locations', href: resolve('/organization_locations'), icon: MapPinIcon },
		{ label: 'Attendance', href: resolve('/attendance'), icon: ClockIcon },
		{ label: 'Attendance Records', href: resolve('/attendance-records'), icon: CalendarIcon }
	];

	const shiftRoutes = [
		resolve('/shifts'),
		resolve('/shift-assignments')
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
		{ label: 'System Roles', href: resolve('/system-roles'), icon: ShieldCheckIcon },
		{ label: 'Permissions', href: resolve('/permissions'), icon: KeyRoundIcon },
		{ label: 'Role Permissions', href: resolve('/role-permissions'), icon: LinkIcon }
	];

	let isLeaveManagementExpanded = $state(false);
	let isAttendanceManagementExpanded = $state(false);
	let isShiftManagementExpanded = $state(false);
	let isSalaryManagementExpanded = $state(false);

	$effect(() => {
		const path = $page.url.pathname;
		if (leaveRoutes.some(r => path === r || path.startsWith(r + '/'))) {
			isLeaveManagementExpanded = true;
		}
		if (attendanceRoutes.some(r => path === r || path.startsWith(r + '/'))) {
			isAttendanceManagementExpanded = true;
		}
		if (shiftRoutes.some(r => path === r || path.startsWith(r + '/'))) {
			isShiftManagementExpanded = true;
		}
		if (salaryRoutes.some(r => path === r || path.startsWith(r + '/'))) {
			isSalaryManagementExpanded = true;
		}
	});

	let isManager = $derived(data.isManager ?? false);

	let navItems = $derived(protectedNavItems1);

	let shiftManagementItems = $derived.by(() => {
		const items = [
			{ label: 'Shifts', href: resolve('/shifts'), icon: ClockIcon }
		];
		if (isManager) {
			items.push({
				label: 'Shift Assignment',
				href: resolve('/shift-assignments'),
				icon: CalendarCogIcon
			});
		}
		return items;
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

	function handleMouseEnter(e: MouseEvent, label: string) {
		if (isSidebarCollapsed) return;
		const btn = e.currentTarget as HTMLElement;
		const span = btn.querySelector('.truncate') as HTMLElement;
		if (span && span.scrollWidth > span.clientWidth) {
			btn.title = label;
		} else {
			btn.title = '';
		}
	}

	function handleMouseLeave(e: MouseEvent) {
		if (isSidebarCollapsed) return;
		(e.currentTarget as HTMLElement).removeAttribute('title');
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>PieQ HRMS</title>
</svelte:head>

<div class="flex min-h-screen bg-background text-foreground">
	<Toaster />
	<aside
		class={`sticky top-0 h-screen z-30 flex shrink-0 flex-col border-r border-hrms-neutral/25 bg-hrms-secondary text-white shadow-sm transition-[width] duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-[261px]'}`}
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
					<span class="flex size-8 shrink-0 items-center justify-center rounded-md bg-hrms-primary text-white">
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
						class={`h-10 w-full justify-start gap-3 text-white hover:bg-hrms-primary hover:text-white ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'} ${isActive ? 'bg-hrms-primary' : ''}`}
						title={isSidebarCollapsed ? item.label : undefined}
						aria-label={item.label}
						onmouseenter={(e) => handleMouseEnter(e, item.label)}
						onmouseleave={handleMouseLeave}
					>
						<Icon class="size-4 shrink-0" />
						{#if !isSidebarCollapsed}
							<span class="truncate">{item.label}</span>
						{/if}
					</Button>
				{/each}

				<!-- Leave Management expandable group -->
				<div class="flex flex-col gap-1">
					<Button
						variant="ghost"
						class={`h-10 w-full justify-start gap-3 text-white hover:bg-white/10 hover:text-white ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'}`}
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
						onmouseenter={(e) => handleMouseEnter(e, 'Leave Management')}
						onmouseleave={handleMouseLeave}
					>
						<CalendarIcon class="size-4 shrink-0" />
						{#if !isSidebarCollapsed}
							<span class="flex-1 text-left truncate">Leave Management</span>
							<ChevronDownIcon class={`size-4 shrink-0 transition-transform duration-200 ml-auto ${isLeaveManagementExpanded ? 'rotate-0' : '-rotate-90'}`} />
						{/if}
					</Button>

					{#if isLeaveManagementExpanded && !isSidebarCollapsed}
						<div class="flex flex-col gap-1 pl-4 border-l border-white/10 ml-5">
							{#each leaveManagementItems as child (child.href)}
								{@const ChildIcon = child.icon}
								{@const isChildActive = $page.url.pathname === child.href || $page.url.pathname.startsWith(child.href + '/')}
								<Button
									href={child.href}
									variant="ghost"
									class={`h-9 w-full justify-start gap-3 text-white/80 hover:bg-hrms-primary hover:text-white px-3 text-sm ${isChildActive ? 'bg-hrms-primary text-white font-semibold' : ''}`}
									aria-label={child.label}
									onmouseenter={(e) => handleMouseEnter(e, child.label)}
									onmouseleave={handleMouseLeave}
								>
									<ChildIcon class="size-3.5 shrink-0" />
									<span class="truncate">{child.label}</span>
								</Button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Attendance Management expandable group -->
				<div class="flex flex-col gap-1">
					<Button
						variant="ghost"
						class={`h-10 w-full justify-start gap-3 text-white hover:bg-white/10 hover:text-white ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'}`}
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
						onmouseenter={(e) => handleMouseEnter(e, 'Attendance Management')}
						onmouseleave={handleMouseLeave}
					>
						<FingerprintIcon class="size-4 shrink-0" />
						{#if !isSidebarCollapsed}
							<span class="flex-1 text-left truncate">Attendance Management</span>
							<ChevronDownIcon class={`size-4 shrink-0 transition-transform duration-200 ml-auto ${isAttendanceManagementExpanded ? 'rotate-0' : '-rotate-90'}`} />
						{/if}
					</Button>

					{#if isAttendanceManagementExpanded && !isSidebarCollapsed}
						<div class="flex flex-col gap-1 pl-4 border-l border-white/10 ml-5">
							{#each attendanceManagementItems as child (child.href)}
								{@const ChildIcon = child.icon}
								{@const isChildActive = $page.url.pathname === child.href || $page.url.pathname.startsWith(child.href + '/')}
								<Button
									href={child.href}
									variant="ghost"
									class={`h-9 w-full justify-start gap-3 text-white/80 hover:bg-hrms-primary hover:text-white px-3 text-sm ${isChildActive ? 'bg-hrms-primary text-white font-semibold' : ''}`}
									aria-label={child.label}
									onmouseenter={(e) => handleMouseEnter(e, child.label)}
									onmouseleave={handleMouseLeave}
								>
									<ChildIcon class="size-3.5 shrink-0" />
									<span class="truncate">{child.label}</span>
								</Button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Shift Management expandable group -->
				<div class="flex flex-col gap-1">
					<Button
						variant="ghost"
						class={`h-10 w-full justify-start gap-3 text-white hover:bg-white/10 hover:text-white ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'}`}
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
						onmouseenter={(e) => handleMouseEnter(e, 'Shift Management')}
						onmouseleave={handleMouseLeave}
					>
						<CalendarClockIcon class="size-4 shrink-0" />
						{#if !isSidebarCollapsed}
							<span class="flex-1 text-left truncate">Shift Management</span>
							<ChevronDownIcon class={`size-4 shrink-0 transition-transform duration-200 ml-auto ${isShiftManagementExpanded ? 'rotate-0' : '-rotate-90'}`} />
						{/if}
					</Button>

					{#if isShiftManagementExpanded && !isSidebarCollapsed}
						<div class="flex flex-col gap-1 pl-4 border-l border-white/10 ml-5">
							{#each shiftManagementItems as child (child.href)}
								{@const ChildIcon = child.icon}
								{@const isChildActive = $page.url.pathname === child.href || $page.url.pathname.startsWith(child.href + '/')}
								<Button
									href={child.href}
									variant="ghost"
									class={`h-9 w-full justify-start gap-3 text-white/80 hover:bg-hrms-primary hover:text-white px-3 text-sm ${isChildActive ? 'bg-hrms-primary text-white font-semibold' : ''}`}
									aria-label={child.label}
									onmouseenter={(e) => handleMouseEnter(e, child.label)}
									onmouseleave={handleMouseLeave}
								>
									<ChildIcon class="size-3.5 shrink-0" />
									<span class="truncate">{child.label}</span>
								</Button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Salary Management expandable group -->
				<div class="flex flex-col gap-1">
					<Button
						variant="ghost"
						class={`h-10 w-full justify-start gap-3 text-white hover:bg-white/10 hover:text-white ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'}`}
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
						onmouseenter={(e) => handleMouseEnter(e, 'Salary Management')}
						onmouseleave={handleMouseLeave}
					>
						<WalletIcon class="size-4 shrink-0" />
						{#if !isSidebarCollapsed}
							<span class="flex-1 text-left truncate">Salary Management</span>
							<ChevronDownIcon class={`size-4 shrink-0 transition-transform duration-200 ml-auto ${isSalaryManagementExpanded ? 'rotate-0' : '-rotate-90'}`} />
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
									class={`h-9 w-full justify-start gap-3 text-white/80 hover:bg-hrms-primary hover:text-white px-3 text-sm ${isChildActive ? 'bg-hrms-primary text-white font-semibold' : ''}`}
									aria-label={child.label}
									onmouseenter={(e) => handleMouseEnter(e, child.label)}
									onmouseleave={handleMouseLeave}
								>
									<ChildIcon class="size-3.5 shrink-0" />
									<span class="truncate">{child.label}</span>
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
						class={`h-10 w-full justify-start gap-3 text-white hover:bg-hrms-primary hover:text-white ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'} ${isActive ? 'bg-hrms-primary' : ''}`}
						title={isSidebarCollapsed ? item.label : undefined}
						aria-label={item.label}
						onmouseenter={(e) => handleMouseEnter(e, item.label)}
						onmouseleave={handleMouseLeave}
					>
						<Icon class="size-4 shrink-0" />
						{#if !isSidebarCollapsed}
							<span class="truncate">{item.label}</span>
						{/if}
					</Button>
				{/each}
			{:else}
				<Button
					href={resolve('/')}
					variant="ghost"
					class={`h-10 w-full justify-start gap-3 text-white hover:bg-hrms-primary hover:text-white ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'}`}
					title={isSidebarCollapsed ? 'Sign in' : undefined}
					aria-label="Sign in"
					onmouseenter={(e) => handleMouseEnter(e, 'Sign in')}
					onmouseleave={handleMouseLeave}
				>
					<LogInIcon class="size-4 shrink-0" />
					{#if !isSidebarCollapsed}
						<span class="truncate">Sign in</span>
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
					class={`h-10 w-full justify-start gap-3 text-white hover:bg-hrms-primary/90 hover:text-white ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'} ${isSettingsActive ? 'bg-hrms-primary/90' : ''}`}
					title={isSidebarCollapsed ? 'Settings' : undefined}
					aria-label="Settings"
					onmouseenter={(e) => handleMouseEnter(e, 'Settings')}
					onmouseleave={handleMouseLeave}
				>
					<SettingsIcon class="size-4 shrink-0" />
					{#if !isSidebarCollapsed}
						<span class="truncate">Settings</span>
					{/if}
				</Button>
				<form method="POST" action="/auth/signout">
					<Button
						type="submit"
						variant="ghost"
						class={`h-10 w-full justify-start gap-3 text-white hover:bg-danger hover:text-danger-foreground focus-visible:ring-danger/50 focus-visible:border-danger ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'}`}
						title={isSidebarCollapsed ? 'Sign out' : undefined}
						aria-label="Sign out"
						onmouseenter={(e) => handleMouseEnter(e, 'Sign out')}
						onmouseleave={handleMouseLeave}
					>
						<LogOutIcon class="size-4 shrink-0" />
						{#if !isSidebarCollapsed}
							<span class="truncate">Sign out</span>
						{/if}
					</Button>
				</form>
			{/if}
			{#if authenticatedUser && !isSidebarCollapsed}
				<p class="px-3 text-xs text-hrms-neutral wrap-break-word line-clamp-2" title={authenticatedUser.email}>{authenticatedUser.email}</p>
			{/if}
		</div>
	</aside>

	<div class="flex flex-col flex-1 min-w-0 relative">
		{#if authenticatedUser && 
			$page.url.pathname !== '/notifications' && 
			$page.url.pathname !== '/notifications/' && 
			!$page.url.pathname.startsWith('/payroll-records') && 
			!$page.url.pathname.startsWith('/payrolls/')}
			<div class="absolute top-[28px] right-[32px] max-sm:top-[20px] max-sm:right-[20px] z-50">
				<NotificationBell />
			</div>
		{/if}
		<main class="grow min-w-0 px-8 py-6 max-sm:px-4 max-sm:py-4 overflow-y-auto">
			{@render children()}
		</main>
	</div>
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