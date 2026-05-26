<script lang="ts">
	import { Card } from '$lib/components';

	let { data } = $props();
</script>

<svelte:head>
	<title>Dashboard</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
		<p class="mt-2 text-slate-600">Protected route demonstrating the controller → view flow.</p>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<Card title="Profile">
			<dl class="space-y-3 text-sm">
				<div>
					<dt class="font-medium text-slate-500">Name</dt>
					<dd class="text-slate-900">{data.context.user.name ?? '—'}</dd>
				</div>
				<div>
					<dt class="font-medium text-slate-500">Email</dt>
					<dd class="text-slate-900">{data.context.user.email}</dd>
				</div>
				<div>
					<dt class="font-medium text-slate-500">Member since</dt>
					<dd class="text-slate-900">{data.context.stats.memberSince}</dd>
				</div>
			</dl>
		</Card>

		<Card title="Roles">
			{#if data.context.roles.length > 0}
				<ul class="flex flex-wrap gap-2">
					{#each data.context.roles as role (role)}
						<li class="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{role}</li>
					{/each}
				</ul>
			{:else}
				<p class="text-sm text-slate-600">No realm roles assigned.</p>
			{/if}
			<p class="mt-4 text-sm text-slate-500">Role count: {data.context.stats.roleCount}</p>
		</Card>
	</div>

	{#if data.showAdminSection}
		<Card title="Admin">
			<p class="text-sm text-slate-600">Visible only when the Keycloak token includes the <code>admin</code> role.</p>
		</Card>
	{/if}
</div>
