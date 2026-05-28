<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { clearOidcUser, storeOidcUser } from '$lib/auth';
	import { Sidebar, ToastContainer, ConfirmationModal } from '$lib/components';

	let { children, data } = $props();

	let sidebarCollapsed = $state(false);

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
		<div class="pieq-content">
			{@render children()}
		</div>
	</div>
</div>

<ToastContainer />
<ConfirmationModal />
