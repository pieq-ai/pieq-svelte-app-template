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
		class="modal-overlay"
		transition:fade={{ duration: 150 }}
		onclick={(e) => { if (e.target === e.currentTarget) onclose(); }}
	>
		<div
			class="modal-card"
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
			transition:scale={{ duration: 150, start: 0.95 }}
		>
			<!-- Header -->
			<div class="modal-header">
				<h2 id="modal-title" class="modal-title-text">
					{title}
				</h2>
				<button
					onclick={onclose}
					class="modal-close-btn"
					aria-label="Close modal"
				>
					<XIcon size={18} />
				</button>
			</div>

			<!-- Body / Content -->
			<div class="modal-body">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(15, 11, 10, 0.4);
		backdrop-filter: blur(8px);
	}

	.modal-card {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 16px;
		width: 100%;
		max-width: 440px;
		margin: 0 16px;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 24px;
		border-bottom: 1px solid var(--border);
	}

	.modal-title-text {
		font-size: 18px;
		font-weight: 700;
		color: var(--foreground);
		margin: 0;
		line-height: 1.2;
	}

	.modal-close-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--muted-foreground);
		padding: 6px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.15s, color 0.15s;
	}

	.modal-close-btn:hover {
		background-color: var(--muted);
		color: var(--foreground);
	}

	.modal-body {
		padding: 24px;
		overflow-y: auto;
		max-height: calc(100vh - 120px);
	}
</style>
