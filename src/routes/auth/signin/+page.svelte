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
	} from '$lib/components';

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

<Card class="w-full max-w-md mx-auto shadow-xl border-border/40 bg-card/60 backdrop-blur-md">
	<CardHeader class="space-y-1 pb-4">
		<CardTitle class="text-2xl font-bold tracking-tight text-center">Sign in</CardTitle>
		<CardDescription class="text-center">Choose an authentication method to access the HRMS portal</CardDescription>
	</CardHeader>
	<CardContent class="space-y-6">
		<div class="space-y-4">
			{#if configReady && oidc}
				<div class="p-4 rounded-lg bg-muted/40 border border-border/50 space-y-3">
					<p class="text-xs text-muted-foreground text-center">
						Standard single sign-on via Keycloak realm <strong>{oidc.realm}</strong>
					</p>
					<Button class="w-full" onclick={handleSignIn}>Sign in with Keycloak</Button>
				</div>
			{:else}
				<Alert variant="destructive">
					<AlertDescription>
						Production SSO (Keycloak) configuration is not active. Ensure your environment variables are configured if needed.
					</AlertDescription>
				</Alert>
			{/if}
		</div>
	</CardContent>
</Card>
