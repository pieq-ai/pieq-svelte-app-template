<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { clearOidcUser, storeOidcUser } from '$lib/auth';
	import { Button } from '$lib/components/ui';
	import { Sidebar } from '$lib/components/layout';
	import { resolve } from '$app/paths';
	import { Toaster } from 'svelte-sonner';
	import { afterNavigate } from '$app/navigation';

	let { children, data } = $props();
	let isCollapsed = $state(false);
	let isMobileOpen = $state(false);

	afterNavigate(() => {
		isMobileOpen = false;
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

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if data.user}
	<div class="flex h-screen bg-background text-foreground overflow-hidden">
		<Sidebar bind:isCollapsed={isCollapsed} bind:isMobileOpen={isMobileOpen} userEmail={data.user.email} />
		
		{#if isMobileOpen}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				onclick={() => (isMobileOpen = false)}
				class="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
			></div>
		{/if}

		<div class="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
			<!-- Mobile header -->
			<header class="flex items-center justify-between border-b border-border bg-card px-6 py-4 lg:hidden sticky top-0 z-30 h-16 shrink-0">
				<div class="flex items-center gap-3">
					<button
						type="button"
						onclick={() => (isMobileOpen = !isMobileOpen)}
						class="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center"
						aria-label="Toggle Navigation Menu"
					>
						<svg class="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					</button>
					<span class="font-bold text-lg tracking-tight text-primary">PieQ HRMS</span>
				</div>
			</header>

			<main class="w-full max-w-none px-4 sm:px-6 py-6 sm:py-10 flex-1">
				{@render children()}
			</main>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-background text-foreground">
		<header class="border-b border-border bg-card">
			<div class="w-full flex items-center justify-between px-6 py-4">
				<a href={resolve('/')} class="text-lg font-semibold tracking-tight text-primary">PieQ HRMS</a>
				<nav class="flex items-center gap-3">
					<Button href={resolve('/auth/signin')}>Sign in</Button>
				</nav>
			</div>
		</header>

		<main class="w-full px-6 py-10">
			{@render children()}
		</main>
	</div>
{/if}

<Toaster position="top-right" closeButton />

