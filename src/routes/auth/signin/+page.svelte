<script lang="ts">
	import { page } from '$app/state';
	import { signInWithKeycloak } from '$lib/auth';
	import {
		Alert,
		AlertDescription,
		Button,
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui';

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

<Card>
	<CardHeader>
		<CardTitle>Sign in</CardTitle>
	</CardHeader>
	<CardContent>
		{#if configReady && oidc}
			<CardDescription class="mb-4">
				Authenticate with Keycloak realm <strong>{oidc.realm}</strong> (client: {oidc.clientId}).
			</CardDescription>
			<Button onclick={handleSignIn}>Sign in with Keycloak</Button>
		{:else}
			<Alert variant="destructive">
				<AlertDescription>
					Authentication configuration is missing. Ensure <code>API_BASE_URL</code> and OIDC settings are
					set in <code>.env</code> and reload the app.
				</AlertDescription>
			</Alert>
		{/if}
	</CardContent>
</Card>
