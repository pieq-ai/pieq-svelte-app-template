<script lang="ts">
	import { fade, scale } from 'svelte/transition';

	let {
		isOpen = $bindable(false),
		title = '',
		onCloseRequest,
		disableEscape = false,
		children
	}: {
		isOpen: boolean;
		title?: string;
		onCloseRequest?: () => void;
		disableEscape?: boolean;
		children?: import('svelte').Snippet;
	} = $props();

	function close() {
		if (onCloseRequest) {
			onCloseRequest();
		} else {
			isOpen = false;
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (!isOpen) return;
		if (e.key === 'Escape' && !disableEscape) {
			e.preventDefault();
			close();
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if isOpen}
	<!-- Modal backdrop overlay -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		transition:fade={{ duration: 150 }}
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
	>
		<!-- Modal box container -->
		<div
			transition:scale={{ duration: 150, start: 0.95 }}
			class="w-full max-w-lg bg-card text-card-foreground rounded-lg border border-border shadow-lg flex flex-col max-h-[90vh]"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Modal Header -->
			<div class="flex items-center justify-between border-b border-border px-6 py-4">
				<h3 class="font-semibold text-lg tracking-tight">{title}</h3>
				<button
					type="button"
					onclick={close}
					class="text-muted-foreground hover:text-foreground rounded-md p-1 hover:bg-accent transition-colors cursor-pointer"
					aria-label="Close modal"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
				</button>
			</div>
			<!-- Modal Content -->
			<div class="p-6 overflow-y-auto flex-1">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}
