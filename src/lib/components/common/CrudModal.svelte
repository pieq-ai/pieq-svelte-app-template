<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components';
	import { modalStack } from './modalStack.js';
	import { onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		open: boolean;
		title: string;
		description?: string;
		closeLabel?: string;
		isSubmitting?: boolean;
		/** Default false = right-side slide panel. Set true to keep the old centered card layout (e.g. inside employee wizard). */
		centered?: boolean;
		onClose: () => void;
		children?: import('svelte').Snippet<[{ cancel: () => void }]>;
		preventOutsideClickClose?: boolean;
	}

	let {
		open,
		title,
		description = '',
		closeLabel = 'Close modal',
		isSubmitting = false,
		centered = false,
		onClose,
		children,
		preventOutsideClickClose = false
	}: Props = $props();

	const modalId = Symbol('CrudModal');

	$effect(() => {
		if (open) {
			modalStack.push(modalId);
			const handleDocKeydown = (e: KeyboardEvent) => {
				if (e.key === 'Escape' && modalStack.isTop(modalId)) {
					handleCloseAttempt();
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

	function handleCloseAttempt() {
		if (isSubmitting) return;
		onClose();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (preventOutsideClickClose) return;
		if (e.target === e.currentTarget && modalStack.isTop(modalId)) {
			handleCloseAttempt();
		}
	}
</script>

{#if open}
	{#if centered}
		<!-- Centered modal — legacy layout for employee wizard -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-[#262626]/70 px-4 py-6 pointer-events-auto"
			onclick={handleBackdropClick}
			transition:fade={{ duration: 150 }}
		>
			<Card
				class="relative max-h-[90vh] w-full max-w-lg overflow-y-auto custom-scrollbar"
				onclick={(e) => e.stopPropagation()}
			>
				<CardHeader class="flex-col items-start gap-1 px-6 pr-12">
					<CardTitle>{title}</CardTitle>
					{#if description}
						<CardDescription class="whitespace-pre-line">{description}</CardDescription>
					{/if}
				</CardHeader>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					class="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
					aria-label={closeLabel}
					onclick={handleCloseAttempt}
					disabled={isSubmitting}
				>
					<XIcon class="size-4" />
				</Button>
				<CardContent class="px-6">
					{@render children?.({ cancel: handleCloseAttempt })}
				</CardContent>
			</Card>
		</div>
	{:else}
		<!-- Right-side slide panel (default) -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="fixed inset-0 z-40 bg-[#262626]/70 pointer-events-auto"
			onclick={handleBackdropClick}
		></div>

		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="fixed top-0 right-0 h-full w-[40vw] min-w-[360px] max-w-[620px] bg-card border-l border-border flex flex-col shadow-2xl z-50"
			role="dialog"
			aria-modal="true"
			aria-label={title}
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Sticky header -->
			<div class="flex items-start justify-between gap-3 px-6 py-5 border-b border-border shrink-0">
				<div class="flex flex-col gap-1 min-w-0">
					<h2 class="text-base font-semibold text-foreground leading-tight">{title}</h2>
					{#if description}
						<p class="text-sm text-muted-foreground whitespace-pre-line">{description}</p>
					{/if}
				</div>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					class="shrink-0 mt-0.5 text-muted-foreground hover:text-foreground"
					aria-label={closeLabel}
					onclick={handleCloseAttempt}
					disabled={isSubmitting}
				>
					<XIcon class="size-4" />
				</Button>
			</div>

			<!-- Independently scrollable body -->
			<div class="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
				{@render children?.({ cancel: handleCloseAttempt })}
			</div>
		</div>
	{/if}
{/if}

