<script lang="ts">
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import { Input, Button } from '$lib/components';

	let {
		value = $bindable(''),
		placeholder = 'Search...',
		debounceMs = 300
	}: {
		value: string;
		placeholder?: string;
		debounceMs?: number;
	} = $props();

	let internalValue = $state(value);
	let timeoutId: ReturnType<typeof setTimeout>;

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		internalValue = target.value;

		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			value = internalValue;
		}, debounceMs);
	}

	function handleClear() {
		internalValue = '';
		value = '';
	}
</script>

<div class="relative w-full max-w-sm">
	<SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
	<Input
		type="text"
		{placeholder}
		value={internalValue}
		oninput={handleInput}
		class="bg-card hover:border-slate-350 focus-visible:ring-primary pl-9 pr-9 transition-all"
	/>
	{#if internalValue}
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			class="absolute top-1/2 right-1 -translate-y-1/2 text-slate-400 hover:text-slate-650"
			aria-label="Clear search"
			onclick={handleClear}
		>
			<XIcon class="size-4" />
		</Button>
	{/if}
</div>
