<script lang="ts">
	import { Modal } from '$lib/components';
	import { enhance } from '$app/forms';

	let {
		isOpen = $bindable(false),
		title = '',
		action = '',
		onsubmit,
		useEnhance,
		children
	}: {
		isOpen: boolean;
		title?: string;
		action?: string;
		onsubmit?: (e: SubmitEvent) => void;
		useEnhance?: import('@sveltejs/kit').SubmitFunction;
		children?: import('svelte').Snippet;
	} = $props();
</script>

<Modal bind:isOpen={isOpen} title={title}>
	{#if useEnhance}
		<form method="POST" {action} onsubmit={onsubmit} use:enhance={useEnhance} class="space-y-4">
			{@render children?.()}
		</form>
	{:else}
		<form method="POST" {action} onsubmit={onsubmit} class="space-y-4">
			{@render children?.()}
		</form>
	{/if}
</Modal>
