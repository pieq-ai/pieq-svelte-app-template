<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { Button } from '$lib/components';
	import { modalStack } from './modalStack.js';
	import { onDestroy } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import TimePicker from './TimePicker.svelte';

	interface Props {
		open: boolean;
		title: string;
		checkInTime: string; // Formatting context for the user, e.g. "09:00 AM"
		cancelLabel?: string;
		confirmLabel?: string;
		isSubmitting?: boolean;
		onCancel: () => void;
		onConfirm: (selectedTime: string) => void;
		preventOutsideClickClose?: boolean;
	}

	let {
		open,
		title,
		checkInTime,
		cancelLabel = 'Cancel',
		confirmLabel = 'Confirm',
		isSubmitting = false,
		onCancel,
		onConfirm,
		preventOutsideClickClose = true
	}: Props = $props();

	let selectedTime = $state('');
	let isTimeError = $state(false);
	let localError = $state('');

	const modalId = Symbol('PendingCheckoutModal');

	$effect(() => {
		if (open) {
			selectedTime = '';
			isTimeError = false;
			localError = '';
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

	function handleConfirm() {
		if (isSubmitting) return;
		if (!selectedTime) {
			localError = 'Please select check-out time';
			return;
		}
		if (isTimeError) {
			localError = 'Please enter a valid time';
			return;
		}
		localError = '';
		onConfirm(selectedTime);
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
			<div class="px-5 py-4 flex flex-col gap-4">
				<p class="text-sm text-muted-foreground leading-normal">
					Please select the actual check-out time for this attendance record.
				</p>

				<div class="bg-muted/40 border border-border/60 rounded-lg p-3 text-xs flex flex-col gap-1">
					<div class="flex justify-between">
						<span class="text-muted-foreground">Check-In Time:</span>
						<span class="font-bold text-foreground">{checkInTime}</span>
					</div>
				</div>

				<div class="flex flex-col gap-1.5">
					<label for="checkout-time-input" class="text-xs font-bold text-foreground">Actual Check-Out Time <span class="text-destructive">*</span></label>
					<TimePicker
						id="checkout-time-input"
						bind:value={selectedTime}
						bind:isError={isTimeError}
						disabled={isSubmitting}
					/>
					{#if localError}
						<span class="text-xs font-semibold text-destructive">{localError}</span>
					{/if}
				</div>
			</div>

			<!-- Footer -->
			<div class="flex justify-end gap-2.5 px-5 py-3.5 bg-muted border-t border-border">
				<Button type="button" variant="outline" onclick={handleCancel} disabled={isSubmitting}>
					{cancelLabel}
				</Button>
				<Button
					type="button"
					class="bg-hrms-primary text-white hover:bg-hrms-primary/90 focus-visible:ring-hrms-primary/50 focus-visible:border-hrms-primary"
					onclick={handleConfirm}
					disabled={isSubmitting}
				>
					{confirmLabel}
				</Button>
			</div>
		</div>
	</div>
{/if}
