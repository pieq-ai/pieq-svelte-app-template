<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import { signOut, signInWithKeycloak } from '$lib/auth';

	// Lucide icons
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import UsersIcon from '@lucide/svelte/icons/users';
	import ShieldIcon from '@lucide/svelte/icons/shield';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import HomeIcon from '@lucide/svelte/icons/home';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';

	interface Props {
		user?: { email?: string; name?: string } | null;
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

	// Get user initials for avatar
	function getInitials(email?: string, name?: string): string {
		if (name && name.trim()) {
			return name
				.split(' ')
				.map((n) => n[0])
				.slice(0, 2)
				.join('')
				.toUpperCase();
		}
		if (email) return email[0].toUpperCase();
		return 'U';
	}

	const mainNavItems = [
		{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
		{ href: '/employees', label: 'Employees', icon: UsersIcon },
		{ href: '/roles', label: 'Roles', icon: ShieldIcon },
		{ href: '/shifts', label: 'Shifts', icon: ClockIcon },
		{ href: '/organization_locations', label: 'Locations', icon: MapPinIcon }
	];
</script>

<aside class="pieq-sidebar" class:collapsed>
	<!-- Brand -->
	<div class="sidebar-brand" style="display:flex;align-items:center;justify-content:{collapsed ? 'center' : 'space-between'};width:100%;box-sizing:border-box;padding:{collapsed ? '16px 0' : '20px 16px 16px'}">
		<div style="display:flex;align-items:center;gap:10px">
			<div class="sidebar-brand-icon" style="background:#C2652A;color:white;border-radius:8px;font-weight:800;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 4px 12px rgba(194, 101, 42, 0.3);flex-shrink:0">PQ</div>
			{#if !collapsed}
				<span class="sidebar-brand-name" style="font-size:16px;font-weight:700;color:white;letter-spacing:-0.5px">PieQ HRMS</span>
			{/if}
		</div>
		{#if !collapsed}
			<button
				onclick={toggle}
				style="background:none;border:none;color:#ffffff;cursor:pointer;padding:4px;display:flex;align-items:center;justify-content:center;transition:color 0.2s"
				aria-label="Collapse sidebar"
				title="Collapse sidebar"
				onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.color = '#C2652A')}
				onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.color = '#ffffff')}
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
			</button>
		{:else}
			<button
				onclick={toggle}
				style="position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;"
				aria-label="Expand sidebar"
				title="Expand sidebar"
			></button>
		{/if}
	</div>

	<!-- Main Navigation -->
	<nav class="sidebar-nav">
		{#if user}
			<p class="sidebar-section-label">Main Menu</p>
			{#each mainNavItems as item}
				<a
					href={resolve(item.href)}
					class="sidebar-nav-item"
					class:active={isActive(item.href)}
				>
					<span class="nav-item-icon">
						<item.icon size={18} />
					</span>
					<span class="nav-item-label">{item.label}</span>
					<span class="sidebar-tooltip">{item.label}</span>
				</a>
			{/each}
		{:else}
			<a
				href={resolve('/')}
				class="sidebar-nav-item"
				class:active={$page.url.pathname === '/'}
			>
				<span class="nav-item-icon"><HomeIcon size={18} /></span>
				<span class="nav-item-label">Home</span>
				<span class="sidebar-tooltip">Home</span>
			</a>
		{/if}
	</nav>

	<!-- Bottom Section -->
	<div class="sidebar-bottom">
		{#if user}
			<!-- Settings -->
			<a href={resolve('/settings')} class="sidebar-nav-item" class:active={isActive('/settings')}>
				<span class="nav-item-icon"><SettingsIcon size={18} /></span>
				<span class="nav-item-label">Settings</span>
				<span class="sidebar-tooltip">Settings</span>
			</a>

			<!-- User strip -->
			<div class="sidebar-user" style="margin-top:8px">
				<div class="sidebar-user-avatar">{getInitials(user.email, user.name)}</div>
				<div class="sidebar-user-info">
					<div class="sidebar-user-name">{user.name ?? user.email ?? 'User'}</div>
					<div class="sidebar-user-email">{user.email ?? ''}</div>
				</div>
			</div>

			<!-- Sign out -->
			<form onsubmit={handleSignOut} style="margin:4px 8px 0">
				<button type="submit" class="sidebar-nav-item" style="width:100%;border:none;background:none;cursor:pointer;text-align:left;">
					<span class="nav-item-icon" style="color:#f87171"><LogOutIcon size={18} /></span>
					<span class="nav-item-label" style="color:#f87171">Sign out</span>
					<span class="sidebar-tooltip">Sign out</span>
				</button>
			</form>
		{/if}
	</div>
</aside>
