<script lang="ts">
	import UserCircleIcon from '@lucide/svelte/icons/user-circle';
	import ShieldIcon from '@lucide/svelte/icons/shield';
	import CalendarIcon from '@lucide/svelte/icons/calendar';

	let { data } = $props();
</script>

<svelte:head>
	<title>Dashboard – PieQ HRMS</title>
</svelte:head>

<!-- Page header -->
<div class="flex items-center justify-between mb-6 max-md:flex-col max-md:items-stretch max-md:gap-4">
	<div>
		<span
			class="inline-block bg-pieq-primary/10 text-pieq-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.75 rounded-full mb-1.5"
		>Overview</span>
		<h1 class="text-[26px] font-bold text-foreground m-0 leading-[1.2]">
			Dashboard
		</h1>
		<p class="text-muted-foreground text-sm mt-1">
			Welcome back, {data.context.user.name ?? data.context.user.email}
		</p>
	</div>
</div>

<!-- Stats strip -->
<div class="grid gap-4 mb-7 grid-cols-[repeat(auto-fit,minmax(180px,1fr))] max-md:grid-cols-[repeat(auto-fit,minmax(140px,1fr))] max-md:gap-3 max-md:mb-5">
	<div class="bg-card border border-border rounded-xl p-5 shadow-sm border-l-[3px] border-l-pieq-primary">
		<div class="text-xs font-medium text-muted-foreground tracking-wide mb-1.5">Assigned Roles</div>
		<div class="text-[28px] font-bold text-foreground leading-none tabular-nums">{data.context.stats.roleCount}</div>
	</div>
	<div class="bg-card border border-border rounded-xl p-5 shadow-sm">
		<div class="text-xs font-medium text-muted-foreground tracking-wide mb-1.5">Member Since</div>
		<div class="text-lg font-bold text-foreground leading-none">{data.context.stats.memberSince}</div>
	</div>
</div>

<!-- Cards grid -->
<div class="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 mt-1">

	<!-- Profile card -->
	<div class="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
		<div class="px-5 py-4 border-b border-border flex items-center gap-2.5">
			<UserCircleIcon size={18} class="text-pieq-primary" />
			<span class="text-sm font-bold text-foreground">Profile</span>
		</div>
		<div class="p-5 flex flex-col gap-3.5">
			<dl class="flex flex-col gap-3">
				<div>
					<dt class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.75">Name</dt>
					<dd class="text-sm font-semibold text-foreground m-0">{data.context.user.name ?? '—'}</dd>
				</div>
				<div>
					<dt class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.75">Email</dt>
					<dd class="text-sm text-foreground m-0">{data.context.user.email}</dd>
				</div>
				<div>
					<dt class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.75">Member Since</dt>
					<dd class="text-sm text-foreground m-0">{data.context.stats.memberSince}</dd>
				</div>
			</dl>
		</div>
	</div>

	<!-- Roles card -->
	<div class="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
		<div class="px-5 py-4 border-b border-border flex items-center gap-2.5">
			<ShieldIcon size={18} class="text-pieq-primary" />
			<span class="text-sm font-bold text-foreground">Assigned Roles</span>
		</div>
		<div class="p-5">
			{#if data.context.roles.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each data.context.roles as role (role)}
						<span class="inline-flex items-center px-3 py-1 bg-pieq-primary/10 text-pieq-primary rounded-full text-xs font-semibold">{role}</span>
					{/each}
				</div>
			{:else}
				<p class="text-[13px] text-muted-foreground m-0">No realm roles assigned.</p>
			{/if}
			<p class="text-xs text-muted-foreground mt-4">Total: {data.context.stats.roleCount} role{data.context.stats.roleCount !== 1 ? 's' : ''}</p>
		</div>
	</div>
</div>

{#if data.showAdminSection}
	<div class="mt-4 bg-card border border-border rounded-xl overflow-hidden shadow-sm">
		<div class="px-5 py-4 border-b border-border flex items-center gap-2.5">
			<ShieldIcon size={18} style="color:#8C3C3C" />
			<span class="text-sm font-bold text-foreground">Admin</span>
			<span class="px-2 py-0.5 bg-[#8C3C3C]/10 text-[#8C3C3C] rounded-full text-[10px] font-bold uppercase">Restricted</span>
		</div>
		<div class="p-5">
			<p class="text-[13px] text-muted-foreground m-0">
				Visible only when the Keycloak token includes the <code class="bg-muted px-1.5 py-0.5 rounded text-xs">admin</code> role.
			</p>
		</div>
	</div>
{/if}
