<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
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
			class="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-background shadow-xl dark:border-slate-800"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="px-6 py-5 space-y-4">
				<div class="flex items-start gap-4">
					<div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
						<AlertTriangleIcon class="size-5" />
					</div>
					<div class="space-y-1.5">
						<h3 id={dialogTitleId} class="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
							{title}
						</h3>
						<p class="text-sm text-slate-500 font-medium leading-relaxed">
							{message}
						</p>
					</div>
				</div>
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50">
				<Button
					type="button"
					variant="outline"
					class="hover:bg-slate-100 border-slate-200"
					disabled={isConfirming}
					onclick={oncancel}
				>
					{cancelText}
				</Button>
				<Button
					type="button"
					variant="destructive"
					class="shadow-sm shadow-destructive/10"
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
