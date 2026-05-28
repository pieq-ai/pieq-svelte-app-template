<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import { signOut } from '$lib/auth';

	// Lucide icons
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import UsersIcon from '@lucide/svelte/icons/users';
	import ShieldIcon from '@lucide/svelte/icons/shield';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import HomeIcon from '@lucide/svelte/icons/home';

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
		{ href: '/roles', label: 'Roles', icon: ShieldIcon }
	];
</script>

<aside class="pieq-sidebar" class:collapsed>
	<!-- Brand -->
	<div class="sidebar-brand">
		<div class="sidebar-brand-icon">PQ</div>
		{#if !collapsed}
			<div class="sidebar-brand-text" style="overflow:hidden">
				<span class="sidebar-brand-name">PieQ HRMS</span>
				<span class="sidebar-brand-sub">Enterprise Suite</span>
			</div>
		{/if}
	</div>

	<!-- Toggle button -->
	<button
		class="sidebar-toggle"
		onclick={toggle}
		aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
	>
		<ChevronLeftIcon size={14} />
	</button>

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
