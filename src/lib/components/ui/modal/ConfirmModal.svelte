<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import Button from '../button/button.svelte';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';

	let {
		isOpen = $bindable(false),
		title = 'Confirmation Required',
		message = 'Are you sure you want to proceed?',
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		variant = 'destructive', // 'default' | 'destructive'
		isConfirming = false,
		onConfirm,
		onCancel
	}: {
		isOpen: boolean;
		title?: string;
		message?: string;
		confirmLabel?: string;
		cancelLabel?: string;
		variant?: 'default' | 'destructive';
		isConfirming?: boolean;
		onConfirm?: () => void | Promise<void>;
		onCancel?: () => void;
	} = $props();

	function handleCancel() {
		if (isConfirming) return;
		isOpen = false;
		onCancel?.();
	}

	async function handleConfirm() {
		if (isConfirming) return;
		try {
			await onConfirm?.();
			isOpen = false;
		} catch (error) {
			console.error('Confirm action failed:', error);
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleCancel();
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		transition:fade={{ duration: 150 }}
		class="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
		onclick={handleCancel}
	>
		<div
			transition:scale={{ duration: 150, start: 0.95 }}
			class="w-full max-w-md bg-card text-card-foreground rounded-lg border border-border shadow-lg flex flex-col p-6"
			onclick={(e) => e.stopPropagation()}
		>
			<h3 class="font-semibold text-lg tracking-tight mb-2">{title}</h3>
			<p class="text-sm text-muted-foreground mb-6">{message}</p>

			<div class="flex items-center justify-end gap-3">
				<Button
					type="button"
					variant="ghost"
					onclick={handleCancel}
					disabled={isConfirming}
				>
					{cancelLabel}
				</Button>
				<Button
					type="button"
					variant={variant === 'destructive' ? 'destructive' : 'default'}
					onclick={handleConfirm}
					disabled={isConfirming}
				>
					{#if isConfirming}
						<LoaderCircleIcon class="size-4 animate-spin mr-2" />
					{/if}
					{confirmLabel}
				</Button>
			</div>
		</div>
	</div>
{/if}
