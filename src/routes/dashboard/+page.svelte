<script lang="ts">
	import { page } from '$app/stores';

	let { data } = $props();
</script>

<svelte:head>
	<title>Dashboard – PieQ HRMS</title>
</svelte:head>

<h1 class="text-[32px] font-bold text-foreground mb-1 leading-tight">Dashboard</h1>
<p class="text-muted-foreground text-sm mb-6">Protected route demonstrating the controller → view flow.</p>

<!-- Cards grid -->
<div class="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">

	<!-- Profile card -->
	<div class="bg-card border border-border rounded-xl p-6 shadow-sm">
		<h2 class="text-base font-semibold text-foreground mb-4">Profile</h2>
		<dl class="flex flex-col gap-3">
			<div>
				<dt class="text-sm text-muted-foreground mb-0.5">Name</dt>
				<dd class="text-sm font-medium text-foreground m-0">{data.context.user.name ?? '—'}</dd>
			</div>
			<div>
				<dt class="text-sm text-muted-foreground mb-0.5">Email</dt>
				<dd class="text-sm font-medium text-foreground m-0">{data.context.user.email}</dd>
			</div>
			<div>
				<dt class="text-sm text-muted-foreground mb-0.5">Member since</dt>
				<dd class="text-sm font-medium text-foreground m-0">{data.context.stats.memberSince ?? '—'}</dd>
			</div>
		</dl>
	</div>

	<!-- Roles card -->
	<div class="bg-card border border-border rounded-xl p-6 shadow-sm">
		<h2 class="text-base font-semibold text-foreground mb-4">Roles</h2>
		{#if data.context.roles.length > 0}
			<div class="flex flex-wrap gap-2 mb-3">
				{#each data.context.roles as role (role)}
					<span class="inline-flex items-center px-3 py-1 bg-muted text-foreground rounded-md text-sm font-medium">{role}</span>
				{/each}
			</div>
		{:else}
			<p class="text-sm text-muted-foreground mb-3">No realm roles assigned.</p>
		{/if}
		<p class="text-sm text-muted-foreground">Role count: {data.context.stats.roleCount}</p>
	</div>
</div>

{#if data.showAdminSection}
	<div class="mt-4 bg-card border border-border rounded-xl p-6 shadow-sm">
		<h2 class="text-base font-semibold text-foreground mb-3">Admin <span class="ml-2 px-2 py-0.5 bg-[#8C3C3C]/10 text-[#8C3C3C] rounded-full text-[10px] font-bold uppercase">Restricted</span></h2>
		<p class="text-sm text-muted-foreground m-0">
			Visible only when the Keycloak token includes the <code class="bg-muted px-1.5 py-0.5 rounded text-xs">admin</code> role.
		</p>
	</div>
{/if}
