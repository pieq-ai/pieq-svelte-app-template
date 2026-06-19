<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components';
	import { modalStack } from './modalStack.js';
	import { onDestroy } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		description?: string;
		closeLabel?: string;
		isSubmitting?: boolean;
		onClose: () => void;
		children?: import('svelte').Snippet<[{ cancel: () => void }]>;
		preventOutsideClickClose?: boolean;
		cardClass?: string;
	}

	let {
		open,
		title,
		description = '',
		closeLabel = 'Close modal',
		isSubmitting = false,
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
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div 
		class="fixed inset-0 z-50 flex items-center justify-center bg-[#262626]/70 px-4 py-6 pointer-events-auto"
		onclick={handleBackdropClick}
	>
		<Card class="relative max-h-[90vh] w-full max-w-lg overflow-y-auto custom-scrollbar" onclick={(e) => e.stopPropagation()}>
			<CardHeader class="flex-col items-start gap-1 px-6 pr-12">
				<CardTitle>{title}</CardTitle>
				{#if description}
					<CardDescription>{description}</CardDescription>
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
{/if}
