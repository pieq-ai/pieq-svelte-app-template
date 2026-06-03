<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { clearOidcUser, storeOidcUser } from '$lib/auth';
	import { Sidebar, ToastContainer, ConfirmationModal } from '$lib/components';
	import MenuIcon from '@lucide/svelte/icons/menu';

	let { children, data } = $props();

	let sidebarCollapsed = $state(false);

	$effect(() => {
		if (typeof window !== 'undefined') {
			sidebarCollapsed = window.innerWidth < 768;
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

<div class="pieq-shell">
	<!-- Persistent Sidebar -->
	<Sidebar
		user={data.user}
		bind:collapsed={sidebarCollapsed}
	/>

	<!-- Main content area shifts with sidebar -->
	<div class="pieq-main" class:sidebar-collapsed={sidebarCollapsed}>
		{#if data.user}
			<div class="mobile-topbar">
				<button onclick={() => sidebarCollapsed = !sidebarCollapsed} class="mobile-menu-btn" aria-label="Toggle menu">
					<MenuIcon size={20} />
				</button>
				<span class="mobile-brand-name">PieQ HRMS</span>
				<div style="width: 32px;"></div>
			</div>
		{/if}
		<div class="pieq-content">
			{@render children()}
		</div>
	</div>
</div>

<ToastContainer />
<ConfirmationModal />
