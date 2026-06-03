<!-- src/lib/components/Modal.svelte -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import XIcon from '@lucide/svelte/icons/x';
	import { fade, scale } from 'svelte/transition';

	interface Props {
		show: boolean;
		title: string;
		onclose: () => void;
		children?: import('svelte').Snippet;
	}

	let { show = $bindable(), title, onclose, children }: Props = $props();

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape' && show) {
			onclose();
		}
	}

	// Lock body scroll when modal is open
	$effect(() => {
		if (typeof document !== 'undefined') {
			if (show) {
				document.body.style.overflow = 'hidden';
			} else {
				document.body.style.overflow = '';
			}
		}
	});

	onDestroy(() => {
		if (typeof document !== 'undefined') {
			document.body.style.overflow = '';
		}
	});
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if show}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-200 flex items-center justify-center bg-[rgba(15,11,10,0.4)] backdrop-blur-md"
		transition:fade={{ duration: 150 }}
		onclick={(e) => { if (e.target === e.currentTarget) onclose(); }}
	>
		<div
			class="bg-card border border-border rounded-2xl w-full max-w-[440px] mx-4 shadow-xl flex flex-col overflow-hidden"
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
			transition:scale={{ duration: 150, start: 0.95 }}
		>
			<!-- Header -->
			<div class="flex items-center justify-between px-6 py-5 border-b border-border">
				<h2 id="modal-title" class="text-lg font-bold text-foreground m-0 leading-[1.2]">
					{title}
				</h2>
				<button
					onclick={onclose}
					class="bg-transparent border-none cursor-pointer text-muted-foreground p-1.5 rounded-lg flex items-center justify-center transition-colors duration-150 hover:bg-muted hover:text-foreground"
					aria-label="Close modal"
				>
					<XIcon size={18} />
				</button>
			</div>

			<!-- Body / Content -->
			<div class="p-6 overflow-y-auto max-h-[calc(100vh-120px)]">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}
