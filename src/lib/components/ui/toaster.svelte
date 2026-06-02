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
	<SonnerToaster 
		position="top-right" 
		closeButton={true} 
		toastOptions={{
			classes: {
				toast: '!flex !flex-row !items-center !w-full',
				content: '!flex-1',
				closeButton: '!static !translate-x-0 !translate-y-0 !bg-transparent !border-0 text-muted-foreground hover:text-foreground shrink-0 !ml-auto'
			}
		}}
	/>
{/if}
