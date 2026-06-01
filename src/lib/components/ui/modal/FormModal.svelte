<script lang="ts">
	import Modal from './Modal.svelte';
	import { enhance } from '$app/forms';

	let {
		isOpen = $bindable(false),
		title = '',
		action = '',
		onsubmit,
		useEnhance,
		onCloseRequest,
		disableEscape = false,
		children
	}: {
		isOpen: boolean;
		title?: string;
		action?: string;
		onsubmit?: (e: SubmitEvent) => void;
		useEnhance?: import('@sveltejs/kit').SubmitFunction;
		onCloseRequest?: () => void;
		disableEscape?: boolean;
		children?: import('svelte').Snippet;
	} = $props();
</script>

<Modal bind:isOpen={isOpen} title={title} {onCloseRequest} {disableEscape}>
	{#if useEnhance}
		<form method="POST" {action} onsubmit={onsubmit} use:enhance={useEnhance} class="space-y-4" novalidate>
			{@render children?.()}
		</form>
	{:else}
		<form method="POST" {action} onsubmit={onsubmit} class="space-y-4" novalidate>
			{@render children?.()}
		</form>
	{/if}
</Modal>
