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
	<meta name="description" content="PieQ HRMS — Manage employees, roles, departments, and more in one enterprise-grade platform." />
</svelte:head>

<div style="min-height:70vh;display:flex;align-items:center;justify-content:center">
	<div style="text-align:center;max-width:520px;padding:40px 24px">
		<!-- Brand mark -->
		<div style="width:72px;height:72px;background:#F45310;border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;box-shadow:0 8px 24px #F4531040">
			<span style="font-size:28px;font-weight:800;color:white;letter-spacing:-1px">PQ</span>
		</div>

		<p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#F45310;margin-bottom:12px">
			Enterprise HR Suite
		</p>

		<h1 style="font-size:36px;font-weight:800;color:var(--foreground);line-height:1.15;margin-bottom:16px;letter-spacing:-0.5px">
			PieQ HRMS
		</h1>

		<p style="font-size:15px;color:var(--muted-foreground);line-height:1.6;margin-bottom:36px">
			Streamline your workforce — manage employees, roles, and permissions with a powerful, modern HR platform.
		</p>

		{#if data.user}
			<a
				href={resolve('/dashboard')}
				style="display:inline-flex;align-items:center;gap:8px;background:#F45310;color:white;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none;transition:background .2s,transform .1s;box-shadow:0 4px 16px #F4531030"
				onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background = '#d8470a'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
				onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = '#F45310'; (e.currentTarget as HTMLElement).style.transform = ''; }}
			>
				<LayoutDashboardIcon size={17} />
				Go to Dashboard
			</a>
		{:else}
			<button
				onclick={handleSignIn}
				style="display:inline-flex;align-items:center;gap:8px;background:#F45310;color:white;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;border:none;cursor:pointer;transition:background .2s,transform .1s;box-shadow:0 4px 16px #F4531030"
				onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background = '#d8470a'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
				onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = '#F45310'; (e.currentTarget as HTMLElement).style.transform = ''; }}
			>
				<LogInIcon size={17} />
				Sign in with Keycloak
			</button>
		{/if}

		<!-- Feature pills -->
		<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:40px">
			{#each ['Employee Management', 'Role-Based Access', 'Secure Auth', 'Real-time Data'] as feat}
				<span style="padding:5px 14px;border:1px solid var(--border);border-radius:99px;font-size:12px;color:var(--muted-foreground);background:var(--card)">{feat}</span>
			{/each}
		</div>
	</div>
</div>
