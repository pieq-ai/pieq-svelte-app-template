<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { Button } from '$lib/components';
	import { modalStack } from './modalStack.js';
	import { onDestroy } from 'svelte';
	import { fade, scale } from 'svelte/transition';

	interface Props {
		open: boolean;
		title: string;
		description: string;
		cancelLabel?: string;
		confirmLabel?: string;
		isSubmitting?: boolean;
		onCancel: () => void;
		onConfirm: () => void;
		preventOutsideClickClose?: boolean;
	}

	let {
		open,
		title,
		description,
		cancelLabel = 'Cancel',
		confirmLabel = 'Confirm',
		isSubmitting = false,
		onCancel,
		onConfirm,
		preventOutsideClickClose = false
	}: Props = $props();

	const modalId = Symbol('ConfirmModal');

	$effect(() => {
		if (open) {
			modalStack.push(modalId);
			const handleDocKeydown = (e: KeyboardEvent) => {
				if (e.key === 'Escape' && modalStack.isTop(modalId)) {
					handleCancel();
					e.preventDefault();
					e.stopPropagation();
				}
			};
			window.addEventListener('keydown', handleDocKeydown);
			return () => {
				window.removeEventListener('keydown', handleDocKeydown);
				modalStack.pop(modalId);
			};
		} else {
			modalStack.pop(modalId);
		}
	});

	onDestroy(() => {
		modalStack.pop(modalId);
	});

	function handleCancel() {
		if (isSubmitting) return;
		onCancel();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (preventOutsideClickClose) return;
		if (e.target === e.currentTarget && modalStack.isTop(modalId)) {
			handleCancel();
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-200 flex items-center justify-center bg-[rgba(15,11,10,0.5)] backdrop-blur-sm px-4 pointer-events-auto"
		onclick={handleBackdropClick}
		transition:fade={{ duration: 150 }}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="bg-card border border-border rounded-xl w-full max-w-[400px] shadow-xl flex flex-col overflow-hidden"
			role="dialog"
			aria-modal="true"
			aria-labelledby="confirm-modal-title"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			transition:scale={{ duration: 150, start: 0.95 }}
		>
			<!-- Header -->
			<div class="flex items-center justify-between px-5 py-4 border-b border-border">
				<h3 id="confirm-modal-title" class="text-base font-semibold text-foreground leading-tight">{title}</h3>
				<button
					type="button"
					onclick={handleCancel}
					class="bg-transparent border-none cursor-pointer text-muted-foreground p-1 rounded-md flex items-center justify-center transition-colors duration-150 hover:bg-muted hover:text-foreground disabled:opacity-50"
					aria-label="Close dialog"
					disabled={isSubmitting}
				>
					<XIcon size={16} />
				</button>
			</div>

			<!-- Body -->
			<div class="px-5 py-4">
				<p class="text-sm text-muted-foreground leading-normal">{description}</p>
			</div>

			<!-- Footer -->
			<div class="flex justify-end gap-2.5 px-5 py-3.5 bg-muted border-t border-border">
				<Button type="button" variant="outline" onclick={handleCancel} disabled={isSubmitting}>
					{cancelLabel}
				</Button>
				<Button
					type="button"
					class="bg-danger text-danger-foreground hover:bg-danger/90 focus-visible:ring-danger/50 focus-visible:border-danger"
					onclick={onConfirm}
					disabled={isSubmitting}
				>
					{confirmLabel}
				</Button>
			</div>
		</div>
	</div>
{/if}

