<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import { Button } from '$lib/components';

	let {
		isOpen = false,
		title = 'Are you sure?',
		message = 'This action cannot be undone. Please confirm to proceed.',
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		isConfirming = false,
		onconfirm,
		oncancel
	}: {
		isOpen: boolean;
		title?: string;
		message?: string;
		confirmText?: string;
		cancelText?: string;
		isConfirming?: boolean;
		onconfirm: () => void;
		oncancel: () => void;
	} = $props();

	const dialogTitleId = 'confirm-dialog-title';

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			oncancel();
		}
	}

	function handleBackdropKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			oncancel();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- Backdrop -->
	<div
		transition:fade={{ duration: 150 }}
		role="presentation"
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[3px]"
		onclick={oncancel}
		onkeydown={handleBackdropKeydown}
	>
		<!-- Modal Content Box -->
		<div
			transition:scale={{ start: 0.96, duration: 150 }}
			role="dialog"
			aria-modal="true"
			aria-labelledby={dialogTitleId}
			tabindex="-1"
			class="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-background shadow-xl dark:border-slate-800"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<!-- Body -->
			<div class="px-6 pt-7 pb-5 text-center space-y-2">
				<h3 id={dialogTitleId} class="text-base font-semibold text-foreground tracking-tight">
					{title}
				</h3>
				<p class="text-sm text-muted-foreground leading-relaxed">
					{message}
				</p>
			</div>

			<!-- Footer -->
			<div class="grid grid-cols-2 gap-3 border-t border-border px-6 py-4">
				<!-- Safe action: continue editing -->
				<Button
					type="button"
					variant="outline"
					class="w-full"
					disabled={isConfirming}
					onclick={oncancel}
				>
					{cancelText}
				</Button>
				<!-- Destructive action: close without saving -->
				<Button
					type="button"
					class="w-full bg-hrms-destructive text-white hover:bg-hrms-destructive/90 border-0"
					disabled={isConfirming}
					onclick={onconfirm}
				>
					{#if isConfirming}
						<LoaderCircleIcon class="mr-1.5 size-4 animate-spin" />
						Processing...
					{:else}
						{confirmText}
					{/if}
				</Button>
			</div>
		</div>
	</div>
{/if}
