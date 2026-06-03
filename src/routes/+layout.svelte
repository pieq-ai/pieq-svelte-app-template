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

<div class="flex min-h-screen bg-background">
	<!-- Persistent Sidebar -->
	<Sidebar
		user={data.user}
		bind:collapsed={sidebarCollapsed}
	/>

	<!-- Main content area shifts with sidebar -->
	<div
		class="flex-1 transition-[margin] duration-250 ease-in-out min-h-screen flex flex-col {sidebarCollapsed ? 'ml-sidebar-collapsed-w' : 'ml-sidebar-w'} max-md:ml-0 max-md:overflow-x-hidden max-md:w-full"
	>
		{#if data.user}
			<div class="hidden max-md:flex items-center justify-between bg-sidebar-bg text-white px-4 py-3 border-b border-sidebar-border sticky top-0 z-30 box-border w-full">
				<button onclick={() => sidebarCollapsed = !sidebarCollapsed} class="bg-none border-none text-white cursor-pointer p-1.5 flex items-center justify-center rounded-md transition-colors duration-200 hover:bg-white/8" aria-label="Toggle menu">
					<MenuIcon size={20} />
				</button>
				<span class="text-[15px] font-bold">PieQ HRMS</span>
				<div style="width: 32px;"></div>
			</div>
		{/if}
		<div class="flex-1 px-9 py-8 max-w-[1200px] max-md:px-5 max-md:py-4">
			{@render children()}
		</div>
	</div>
</div>

<ToastContainer />
<ConfirmationModal />
