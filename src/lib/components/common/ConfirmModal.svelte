<script lang="ts">
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import { modalStack } from './modalStack.js';
	import { onDestroy } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		description: string;
		confirmLabel?: string;
		isSubmitting?: boolean;
		isDestructive?: boolean;
		onCancel: () => void;
		onConfirm: () => void;
		preventOutsideClickClose?: boolean;
	}

	let {
		open,
		title,
		description,
		confirmLabel = 'Confirm',
		isSubmitting = false,
		isDestructive = true,
		onCancel,
		onConfirm,
		preventOutsideClickClose = false
	}: Props = $props();

	const modalId = Symbol('ConfirmModal');

	$effect(() => {
		if (open) {
			modalStack.push(modalId);
		} else {
			modalStack.pop(modalId);
		}
	});

	onDestroy(() => {
		modalStack.pop(modalId);
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			if (modalStack.isTop(modalId)) {
				onCancel();
				e.preventDefault();
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-250 flex items-center justify-center bg-[rgba(15,11,10,0.4)] backdrop-blur-md px-4 py-6"
		onclick={(e) => {
			if (preventOutsideClickClose) return;
			if (e.target === e.currentTarget) onCancel();
		}}
	>
		<div
			class="bg-card border border-border/50 rounded-[24px] w-full max-w-[420px] shadow-2xl flex flex-col p-6 sm:p-7 md:p-8"
			role="dialog"
			aria-modal="true"
		>
			<h3 class="text-xl font-bold text-foreground m-0 leading-tight mb-2">
				{title}
			</h3>

			<p class="text-sm text-muted-foreground m-0 leading-relaxed mb-6">
				{description}
			</p>

			<div class="flex justify-end gap-3">
				<button
					type="button"
					onclick={onCancel}
					class="h-[38px] px-5 rounded-[12px] border border-[#e5e7eb] bg-card text-[14px] font-semibold cursor-pointer text-foreground transition-colors duration-150 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={isSubmitting}
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={onConfirm}
					class="inline-flex items-center justify-center gap-1.5 h-[38px] px-5 rounded-[12px] border-none text-white text-[14px] font-semibold cursor-pointer transition-colors duration-150 disabled:opacity-70 disabled:cursor-not-allowed {isDestructive ? 'bg-[#800020] hover:bg-[#600018]' : 'bg-[#F45310] hover:bg-[#d4430c]'}"
					disabled={isSubmitting}
				>
					{#if isSubmitting}
						<LoaderCircleIcon class="animate-spin" size={14} />
					{/if}
					{confirmLabel}
				</button>
			</div>
		</div>
	</div>
{/if}
