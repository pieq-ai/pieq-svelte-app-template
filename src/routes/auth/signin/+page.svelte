<script lang="ts">
	import { page } from '$app/state';
	import { signInWithKeycloak } from '$lib/auth';
	import { toast } from '$lib/toast';
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
	const devMode = $derived(data.dev);

	function handleSignIn() {
		signInWithKeycloak(redirectTo);
	}

	async function handleMockSignIn(email: string) {
		try {
			const res = await fetch('/api/auth/mock-login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email })
			});
			if (res.ok) {
				toast.success('Mock authentication successful!');
				window.location.href = redirectTo;
			} else {
				const body = await res.json();
				toast.error(body.error || 'Failed to sign in');
			}
		} catch (err) {
			console.error(err);
			toast.error('An error occurred during mock sign-in.');
		}
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

		{#if devMode}
			<div class="relative flex py-2 items-center">
				<div class="grow border-t border-border/60"></div>
				<span class="shrink mx-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-transparent">Local Dev Sandbox</span>
				<div class="grow border-t border-border/60"></div>
			</div>

			<div class="space-y-3">
				<p class="text-xs text-muted-foreground text-center mb-1">Select a seeded account to simulate authentication:</p>
				<div class="grid gap-3">
					<!-- John Doe -->
					<button
						onclick={() => handleMockSignIn('karthika.s@pieq.ai')}
						class="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-card hover:bg-accent/40 hover:border-pieq-primary/50 transition-all duration-200 text-left group cursor-pointer shadow-sm hover:shadow-md"
					>
						<div class="flex items-center gap-3">
							<div class="size-10 rounded-full bg-pieq-primary/10 text-pieq-primary flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform duration-200">
								JD
							</div>
							<div>
								<h4 class="text-sm font-semibold leading-none group-hover:text-pieq-primary transition-colors duration-200">John Doe</h4>
								<p class="text-xs text-muted-foreground mt-1">Reporting Manager (Eng)</p>
							</div>
						</div>
						<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-pieq-primary/10 text-pieq-primary">Manager</span>
					</button>

					<!-- Jane Smith -->
					<button
						onclick={() => handleMockSignIn('jane.smith@pieq.ai')}
						class="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-card hover:bg-accent/40 hover:border-pieq-primary/50 transition-all duration-200 text-left group cursor-pointer shadow-sm hover:shadow-md"
					>
						<div class="flex items-center gap-3">
							<div class="size-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform duration-200">
								JS
							</div>
							<div>
								<h4 class="text-sm font-semibold leading-none group-hover:text-blue-500 transition-colors duration-200">Jane Smith</h4>
								<p class="text-xs text-muted-foreground mt-1">HR Specialist (HR)</p>
							</div>
						</div>
						<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-500">Employee</span>
					</button>

					<!-- Bob Johnson -->
					<button
						onclick={() => handleMockSignIn('bob.johnson@pieq.ai')}
						class="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-card hover:bg-accent/40 hover:border-pieq-primary/50 transition-all duration-200 text-left group cursor-pointer shadow-sm hover:shadow-md"
					>
						<div class="flex items-center gap-3">
							<div class="size-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform duration-200">
								BJ
							</div>
							<div>
								<h4 class="text-sm font-semibold leading-none group-hover:text-emerald-500 transition-colors duration-200">Bob Johnson</h4>
								<p class="text-xs text-muted-foreground mt-1">Junior Software Engineer</p>
							</div>
						</div>
						<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500">Employee</span>
					</button>
				</div>
			</div>
		{/if}
	</CardContent>
</Card>
