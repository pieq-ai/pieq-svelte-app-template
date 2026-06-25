<!-- src/lib/components/ConfirmationModal.svelte -->
<script lang="ts">
	import { confirmation } from '$lib/confirmation.svelte.js';
	import { fade, scale } from 'svelte/transition';
	import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import XIcon from '@lucide/svelte/icons/x';

	let loading = $state(false);

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape' && confirmation.show) {
			confirmation.onCancel();
		}
	}

	async function handleConfirm() {
		loading = true;
		try {
			await confirmation.onConfirm();
		} finally {
			loading = false;
		}
	}

	// Lock body scroll when confirmation is open
	$effect(() => {
		if (typeof document !== 'undefined') {
			if (confirmation.show) {
				document.body.style.overflow = 'hidden';
			} else {
				document.body.style.overflow = '';
			}
		}
	});
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if confirmation.show}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-250 flex items-center justify-center bg-[rgba(15,11,10,0.4)] backdrop-blur-md"
		transition:fade={{ duration: 150 }}
		onclick={(e) => { if (e.target === e.currentTarget) confirmation.onCancel(); }}
	>
		<div
			class="bg-card border border-border rounded-[14px] w-full max-w-[400px] mx-4 shadow-xl flex flex-col overflow-hidden"
			role="dialog"
			aria-modal="true"
			aria-labelledby="confirm-title"
			transition:scale={{ duration: 150, start: 0.95 }}
		>
			<div class="flex items-center justify-between px-5 py-[18px] border-b border-border">
				<div class="flex items-center gap-2.5">
					{#if confirmation.isDestructive}
						<span class="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center shrink-0">
							<AlertTriangleIcon size={18} />
						</span>
					{/if}
					<h3 id="confirm-title" class="text-base font-bold text-foreground m-0 leading-[1.2]">
						{confirmation.title}
					</h3>
				</div>
				<button
					onclick={confirmation.onCancel}
					class="bg-transparent border-none cursor-pointer text-muted-foreground p-1 rounded-md flex items-center justify-center transition-colors duration-150 hover:bg-muted hover:text-foreground"
					aria-label="Close dialog"
					disabled={loading}
				>
					<XIcon size={16} />
				</button>
			</div>

			<div class="p-5">
				<p class="text-sm text-muted-foreground m-0 leading-normal">{confirmation.message}</p>
			</div>

			<div class="flex justify-end gap-2.5 px-5 py-3.5 bg-muted border-t border-border">
				<button
					type="button"
					onclick={confirmation.onCancel}
					class="px-4 py-2 rounded-lg border border-border bg-card text-[13px] font-semibold cursor-pointer text-foreground transition-colors duration-150 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={loading}
				>
					{confirmation.cancelText}
				</button>
				<button
					type="button"
					onclick={handleConfirm}
					class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-white text-[13px] font-semibold cursor-pointer transition-colors duration-150 disabled:opacity-70 disabled:cursor-not-allowed {confirmation.isDestructive ? 'bg-[#800020] hover:bg-[#600018]' : 'bg-[#F45310] hover:bg-[#d4430a]'}"
					disabled={loading}
				>
					{#if loading}
						<LoaderCircleIcon class="animate-spin" size={14} />
					{/if}
					{confirmation.confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}
