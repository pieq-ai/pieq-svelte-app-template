<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let SonnerToaster = $state<any>(null);

	onMount(async () => {
		if (browser) {
			const module = await import('svelte-sonner');
			SonnerToaster = module.Toaster;
		}
	});
</script>

{#if SonnerToaster}
	<SonnerToaster position="top-right" />
{/if}
