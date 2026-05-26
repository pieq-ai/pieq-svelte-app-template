<script lang="ts">
	import { signInWithKeycloak } from '$lib/auth';
	import { Button, Card } from '$lib/components';

	let { data } = $props();

	function handleSignIn() {
		signInWithKeycloak('/dashboard');
	}
</script>

<svelte:head>
	<title>Pieq Svelte App Template</title>
</svelte:head>

<div class="space-y-8">
	<div class="space-y-3">
		<p class="text-sm font-medium uppercase tracking-wide text-slate-500">Boilerplate</p>
		<h1 class="text-4xl font-bold tracking-tight text-slate-900">SvelteKit layered architecture</h1>
		<p class="max-w-2xl text-lg text-slate-600">
			DAO, service, controller, and view layers with PostgreSQL, Prisma, and Keycloak authentication.
		</p>
	</div>

	<div class="flex flex-wrap gap-3">
		{#if data.user}
			<Button href="/dashboard">Go to dashboard</Button>
		{:else}
			<Button onclick={handleSignIn}>Sign in with Keycloak</Button>
		{/if}
	</div>

	<Card title="Architecture">
		<ul class="space-y-2 text-sm text-slate-600">
			<li><strong class="text-slate-900">DAO</strong> — Prisma data access in <code>$lib/server/dao</code></li>
			<li><strong class="text-slate-900">Service</strong> — business logic in <code>$lib/server/services</code></li>
			<li><strong class="text-slate-900">Controller</strong> — route loaders/actions in <code>+page.server.ts</code></li>
			<li><strong class="text-slate-900">View</strong> — UI in Svelte components and routes</li>
		</ul>
	</Card>
</div>
