<script lang="ts">
	import { Badge, Card, CardContent, CardHeader, CardTitle } from '$lib/components';

	let { data } = $props();
</script>

<svelte:head>
	<title>Dashboard</title>
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
						<dd class="break-words">{data.context.user?.name ?? '—'}</dd>
					</div>
					<div>
						<dt class="font-medium text-muted-foreground">Email</dt>
						<dd class="break-words">{data.context.user?.email}</dd>
					</div>
					<div>
						<dt class="font-medium text-muted-foreground">Member since</dt>
						<dd class="break-words">{data.context.stats.memberSince}</dd>
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
		<Card>
			<CardHeader>
				<CardTitle>Admin</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">
					Visible only when the Keycloak token includes the <code>admin</code> role.
				</p>
			</CardContent>
		</Card>
	{/if}
</div>
