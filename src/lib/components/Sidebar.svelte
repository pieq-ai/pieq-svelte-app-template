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

<aside class="pieq-sidebar" class:collapsed>
	<!-- Brand -->
	<div class="sidebar-brand" style="display:flex;align-items:center;justify-content:{collapsed ? 'center' : 'space-between'};width:100%;box-sizing:border-box;padding:{collapsed ? '16px 0' : '24px 16px 16px'};border-bottom:none;position:relative">
		{#if !collapsed}
			<div style="display:flex;align-items:center;gap:10px">
				<div class="sidebar-brand-icon" style="background:#F45310;color:white;border-radius:8px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(244, 83, 16, 0.3)">
					<Building2Icon size={20} />
				</div>
				<span class="sidebar-brand-name" style="font-size:16px;font-weight:700;color:white;letter-spacing:-0.5px">PieQ HRMS</span>
			</div>
			<button
				onclick={toggle}
				style="background:none;border:none;color:#ffffff;cursor:pointer;padding:4px;display:flex;align-items:center;justify-content:center;transition:color 0.2s"
				aria-label="Collapse sidebar"
				title="Collapse sidebar"
				onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.color = '#F45310')}
				onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.color = '#ffffff')}
			>
				<MenuIcon size={18} />
			</button>
		{:else}
			<button
				onclick={toggle}
				style="background:none;border:none;color:#ffffff;cursor:pointer;padding:4px;display:flex;align-items:center;justify-content:center;transition:color 0.2s"
				aria-label="Expand sidebar"
				title="Expand sidebar"
				onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.color = '#F45310')}
				onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.color = '#ffffff')}
			>
				<MenuIcon size={18} />
			</button>
		{/if}
	</div>

	<!-- Main Navigation -->
	<nav class="sidebar-nav">
		{#if user}
			{#each mainNavItems as item}
				<a
					href={resolve(item.href as any)}
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
			<a href={resolve('/settings' as any)} class="sidebar-nav-item" class:active={isActive('/settings')}>
				<span class="nav-item-icon"><SettingsIcon size={18} /></span>
				<span class="nav-item-label">Settings</span>
				<span class="sidebar-tooltip">Settings</span>
			</a>

			<!-- Sign out -->
			<button
				type="button"
				onclick={handleSignOut}
				class="sidebar-nav-item sidebar-sign-out"
				style="width: calc(100% - 16px); border: none; background: none; cursor: pointer; text-align: left; box-sizing: border-box;"
			>
				<span class="nav-item-icon" style="color:#ffffff"><LogOutIcon size={18} /></span>
				<span class="nav-item-label" style="color:#ffffff">Sign out</span>
				<span class="sidebar-tooltip">Sign out</span>
			</button>

			<!-- User Information strip -->
			{#if !collapsed}
				<div class="sidebar-user" style="padding:12px 24px 4px;margin-top:8px">
					<span class="sidebar-user-email" style="font-size:11px;color:rgba(255,255,255,0.4);font-weight:500;text-overflow:ellipsis;overflow:hidden;display:block" title={user.email ?? user.name ?? ''}>
						{user.email ?? user.name ?? ''}
					</span>
				</div>
			{/if}
		{/if}
	</div>
</aside>

