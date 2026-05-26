<script lang="ts">
	import { page } from '$app/state';
	import { signInWithKeycloak } from '$lib/auth';
	import { Button, Card } from '$lib/components';

	let { data } = $props();

	const oidc = $derived(data.config?.oidc);
	const configReady = $derived(Boolean(oidc?.url && oidc?.realm && oidc?.clientId));
	const redirectTo = $derived(page.url.searchParams.get('callbackUrl') ?? '/dashboard');

	function handleSignIn() {
		signInWithKeycloak(redirectTo);
	}
</script>

<svelte:head>
	<title>Sign in</title>
</svelte:head>

<Card title="Sign in">
	{#if configReady && oidc}
		<p class="mb-4 text-sm text-slate-600">
			Authenticate with Keycloak realm <strong>{oidc.realm}</strong> (client: {oidc.clientId}).
		</p>
		<Button onclick={handleSignIn}>Sign in with Keycloak</Button>
	{:else}
		<p class="text-sm text-red-600">
			Authentication configuration is missing. Ensure <code>API_BASE_URL</code> and OIDC settings are
			set in <code>.env</code> and reload the app.
		</p>
	{/if}
</Card>
