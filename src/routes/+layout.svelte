<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { clearOidcUser, storeOidcUser } from '$lib/auth';
	import { Button } from '$lib/components';
	import { resolve } from '$app/paths';

	let { children, data } = $props();

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

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-background text-foreground">
	<header class="border-b border-border bg-card">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
			<a href={resolve('/')} class="text-lg font-semibold tracking-tight">Pieq App</a>
			<nav class="flex items-center gap-3">
				<Button href={resolve('/employees')} variant="ghost">Employees</Button>
				<Button href={resolve('/departments')} variant="ghost">Departments</Button>
				{#if data.user}
					<span class="hidden text-sm text-muted-foreground sm:inline">{data.user.email}</span>
					<Button href={resolve('/dashboard')} variant="outline">Dashboard</Button>
					<form method="POST" action="/auth/signout">
						<Button type="submit" variant="ghost">Sign out</Button>
					</form>
				{:else}
					<Button href={resolve('/auth/signin')}>Sign in</Button>
				{/if}
			</nav>
		</div>
	</header>

	<main class="mx-auto max-w-5xl px-6 py-10">
		{@render children()}
	</main>
</div>
