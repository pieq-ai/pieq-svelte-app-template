<script lang="ts">
	import { signInWithKeycloak } from '$lib/auth';
	import { resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();
	let authenticatedUser = $derived(data.user ?? null);

	function handleSignIn() {
		signInWithKeycloak('/dashboard');
	}

	onMount(() => {
		if (authenticatedUser) {
			goto(resolve('/dashboard'));
		}
	});
</script>

<svelte:head>
	<title>PieQ HRMS – Login</title>
	<meta name="description" content="Sign in to PieQ HRMS" />
</svelte:head>

<!-- Full screen overlay to hide sidebar on the root login page -->
<div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white bg-gradient-to-br from-white to-[#F43510]/10 p-4">
	
	<!-- Centered Login Card -->
	<div class="w-full max-w-md bg-white border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-10 flex flex-col items-center text-center">
		
		<!-- Branding / Logo -->
		<img src={favicon} alt="PieQ HRMS Logo" class="w-16 h-16 mb-6" />
		
		<h1 class="text-3xl font-bold tracking-tight text-foreground mb-2">PieQ HRMS</h1>
		<p class="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-10">
			Human Resource Management System
		</p>
		
		<!-- Action Button -->
		<button
			onclick={handleSignIn}
			class="w-full flex items-center justify-center gap-2 bg-[#F43510] text-white text-base font-medium px-6 py-3.5 rounded-xl transition-all duration-200 hover:bg-[#d82f0e] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#F43510]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F43510] border-none cursor-pointer"
		>
			<LogInIcon class="size-5" />
			Sign in with Keycloak
		</button>
		
	</div>
	
</div>
