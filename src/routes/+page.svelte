<script lang="ts">
	import { signInWithKeycloak } from '$lib/auth';
	import { resolve } from '$app/paths';
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';

	let { data } = $props();

	function handleSignIn() {
		signInWithKeycloak('/dashboard');
	}
</script>

<svelte:head>
	<title>PieQ HRMS – Enterprise HR Management</title>
	<meta name="description" content="PieQ HRMS — Manage roles, shifts, locations, and more in one enterprise-grade platform." />
</svelte:head>

<div class="min-h-[70vh] flex items-center justify-center">
	<div class="text-center max-w-[520px] py-10 px-6">
		<!-- Brand mark -->
		<div class="w-18 h-18 bg-pieq-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_8px_24px_rgba(244,83,16,0.25)]">
			<span class="text-[28px] font-extrabold text-white tracking-[-1px]">PQ</span>
		</div>

		<p class="text-[11px] font-bold uppercase tracking-[2px] text-pieq-primary mb-3">
			Enterprise HR Suite
		</p>

		<h1 class="text-4xl font-extrabold text-foreground leading-[1.15] mb-4 tracking-[-0.5px]">
			PieQ HRMS
		</h1>

		<p class="text-[15px] text-muted-foreground leading-[1.6] mb-9">
			Streamline your workforce — manage roles, shifts, locations, and permissions with a powerful, modern HR platform.
		</p>

		{#if data.user}
			<a
				href={resolve('/dashboard')}
				class="inline-flex items-center gap-2 bg-pieq-primary text-white text-sm font-semibold px-7 py-3 rounded-[10px] no-underline transition-[background-color,transform] duration-200 hover:bg-[#d8470a] hover:-translate-y-0.5 shadow-[0_4px_16px_rgba(244,83,16,0.18)]"
			>
				<LayoutDashboardIcon size={17} />
				Go to Dashboard
			</a>
		{:else}
			<button
				onclick={handleSignIn}
				class="inline-flex items-center gap-2 bg-pieq-primary text-white text-sm font-semibold px-7 py-3 rounded-[10px] no-underline transition-[background-color,transform] duration-200 hover:bg-[#d8470a] hover:-translate-y-0.5 shadow-[0_4px_16px_rgba(244,83,16,0.18)] border-none cursor-pointer"
			>
				<LogInIcon size={17} />
				Sign in with Keycloak
			</button>
		{/if}

		<!-- Feature pills -->
		<div class="flex flex-wrap gap-2 justify-center mt-10">
			{#each ['Role-Based Access', 'Shift Management', 'Locations Configuration', 'Secure Auth'] as feat}
				<span class="px-3.5 py-1.25 border border-border rounded-full text-xs text-muted-foreground bg-card">{feat}</span>
			{/each}
		</div>
	</div>
</div>
