<script lang="ts">
	import { signInWithKeycloak } from '$lib/auth';
	import { Button, Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui';
	import { resolve } from '$app/paths';

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
		<p class="text-sm font-medium uppercase tracking-wide text-muted-foreground">Boilerplate</p>
		<h1 class="text-4xl font-bold tracking-tight">SvelteKit layered architecture</h1>
		<p class="max-w-2xl text-lg text-muted-foreground">
			DAO, service, controller, and view layers with PostgreSQL, Prisma, and Keycloak authentication.
		</p>
	</div>

	<div class="flex flex-wrap gap-3">
		{#if data.user}
			<Button href={resolve('/dashboard')}>Go to dashboard</Button>
		{:else}
			<Button onclick={handleSignIn}>Sign in with Keycloak</Button>
		{/if}
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Architecture</CardTitle>
		</CardHeader>
		<CardContent>
			<ul class="space-y-2 text-sm text-muted-foreground">
				<li><strong class="text-foreground">DAO</strong> — Prisma data access in <code>$lib/server/dao</code></li>
				<li><strong class="text-foreground">Service</strong> — business logic in <code>$lib/server/services</code></li>
				<li><strong class="text-foreground">Controller</strong> — route loaders/actions in <code>+page.server.ts</code></li>
				<li><strong class="text-foreground">View</strong> — UI in Svelte components and routes</li>
			</ul>
		</CardContent>
	</Card>
</div>
