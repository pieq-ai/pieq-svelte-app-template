<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { clearOidcUser, storeOidcUser } from '$lib/auth';
	import { Button } from '$lib/components/ui';
	import { Sidebar } from '$lib/components/layout';
	import { resolve } from '$app/paths';
	import { Toaster } from 'svelte-sonner';

	let { children, data } = $props();
	let isCollapsed = $state(false);

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

{#if data.user}
	<div class="flex min-h-screen bg-background text-foreground">
		<Sidebar bind:isCollapsed={isCollapsed} userEmail={data.user.email} />
		<div class="flex-1 flex flex-col min-w-0 transition-all duration-300">
			<main class="w-full max-w-5xl mx-auto px-6 py-10 flex-1">
				{@render children()}
			</main>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-background text-foreground">
		<header class="border-b border-border bg-card">
			<div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
				<a href={resolve('/')} class="text-lg font-semibold tracking-tight text-primary">PieQ HRMS</a>
				<nav class="flex items-center gap-3">
					<Button href={resolve('/auth/signin')}>Sign in</Button>
				</nav>
			</div>
		</header>

		<main class="mx-auto max-w-5xl px-6 py-10">
			{@render children()}
		</main>
	</div>
{/if}

<Toaster richColors position="top-right" />

