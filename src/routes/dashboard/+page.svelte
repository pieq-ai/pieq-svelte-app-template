<script lang="ts">
	import { page } from '$app/stores';
	import { Card, CardHeader, CardTitle, CardContent, Badge } from '$lib/components';

	let { data } = $props();
</script>

<svelte:head>
	<title>Dashboard – PieQ HRMS</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
		<p class="mt-2 text-muted-foreground">Protected route demonstrating the controller → view flow.</p>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle>Profile</CardTitle>
			</CardHeader>
			<CardContent>
				<dl class="space-y-3 text-sm">
					<div>
						<dt class="font-medium text-muted-foreground">Name</dt>
						<dd class="wrap-break-word">{data.context.user?.name ?? '—'}</dd>
					</div>
					<div>
						<dt class="font-medium text-muted-foreground">Email</dt>
						<dd class="wrap-break-word">{data.context.user?.email}</dd>
					</div>
					<div>
						<dt class="font-medium text-muted-foreground">Member since</dt>
						<dd class="wrap-break-word">{data.context.stats.memberSince}</dd>
					</div>
				</dl>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Roles</CardTitle>
			</CardHeader>
			<CardContent>
				{#if data.context.roles.length > 0}
					<ul class="flex flex-wrap gap-2">
						{#each data.context.roles as role (role)}
							<li><Badge variant="secondary">{role}</Badge></li>
						{/each}
					</ul>
				{:else}
					<p class="text-sm text-muted-foreground">No realm roles assigned.</p>
				{/if}
				<p class="mt-4 text-sm text-muted-foreground">Role count: {data.context.stats.roleCount}</p>
			</CardContent>
		</Card>
	</div>

	{#if data.showAdminSection}
		<div class="mt-4 bg-card border border-border rounded-xl p-6 shadow-sm">
			<h2 class="text-base font-semibold text-foreground mb-3">Admin <span class="ml-2 px-2 py-0.5 bg-[#8C3C3C]/10 text-[#8C3C3C] rounded-full text-[10px] font-bold uppercase">Restricted</span></h2>
			<p class="text-sm text-muted-foreground m-0">
				Visible only when the Keycloak token includes the <code class="bg-muted px-1.5 py-0.5 rounded text-xs">admin</code> role.
			</p>
		</div>
	{/if}
</div>
