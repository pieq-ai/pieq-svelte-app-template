<script lang="ts">
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import { Input } from '$lib/components';

	interface Props {
		value: string;
		placeholder?: string;
		oninput?: (e: Event) => void;
		class?: string;
	}

	let { value = $bindable(), placeholder = 'Search...', oninput, class: className = '' }: Props = $props();

	function clearSearch() {
		value = '';
		if (oninput) {
			const event = new Event('input', { bubbles: true });
			oninput(event);
		}
	}
</script>

<div class="relative flex-1 {className}">
	<SearchIcon class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
	<Input 
		bind:value 
		oninput={oninput} 
		class="pl-9 pr-9 w-full" 
		{placeholder} 
	/>
	{#if value && value.length > 0}
		<button
			type="button"
			class="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex size-6 items-center justify-center text-muted-foreground hover:bg-muted"
			onclick={clearSearch}
			aria-label="Clear search"
		>
			<XIcon class="size-4" />
		</button>
	{/if}
</div>
