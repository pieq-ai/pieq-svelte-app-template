<script lang="ts">
	import { signInWithKeycloak } from '$lib/auth';
	import { Button, Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui';
	import { resolve } from '$app/paths';
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import { Button } from '$lib/components';

	let { data } = $props();
	let authenticatedUser = $derived(data.user ?? null);

	function handleSignIn() {
		signInWithKeycloak('/dashboard');
	}
</script>

<svelte:head>
	<title>PieQ HRMS – Enterprise HR Management</title>
	<meta name="description" content="PieQ HRMS — Manage roles, shifts, locations, and more in one enterprise-grade platform." />
</svelte:head>

<div class="space-y-4">
	<div class="space-y-3">
		<p class="text-sm font-medium uppercase tracking-wide text-muted-foreground">Boilerplate</p>
		<h1 class="text-4xl font-bold tracking-tight">SvelteKit layered architecture</h1>
		<p class="max-w-2xl text-lg text-muted-foreground">
			DAO, service, controller, and view layers with PostgreSQL, Prisma, and Keycloak authentication.
		</p>
	</div>

	<div class="flex flex-wrap gap-3">
		{#if authenticatedUser}
			<Button href={resolve('/dashboard')}>Go to dashboard</Button>
		{:else}
			<button
				onclick={handleSignIn}
				class="inline-flex items-center gap-2 bg-pieq-primary text-white text-sm font-semibold px-7 py-3 rounded-[10px] no-underline transition-[background-color,transform] duration-200 hover:bg-[#d8470a] hover:-translate-y-0.5 shadow-[0_4px_16px_rgba(244,83,16,0.18)] border-none cursor-pointer"
			>
				<LogInIcon size={17} />
				Sign in with Keycloak
			</button>
		{/if}

		<!-- Feature pills -->
		<div class="flex flex-wrap gap-2 justify-center mt-10">
			{#each ['Role-Based Access', 'Shift Management', 'Locations Configuration', 'Secure Auth'] as feat}
				<span class="px-3.5 py-1.25 border border-border rounded-full text-xs text-muted-foreground bg-card">{feat}</span>
			{/each}
		</div>
	</div>
</div>
