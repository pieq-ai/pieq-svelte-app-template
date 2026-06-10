<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components';
	import { modalRegistry } from './modalRegistry.js';


	interface Props {
		open: boolean;
		title: string;
		description?: string;
		closeLabel?: string;
		isDirty?: boolean;
		isSubmitting?: boolean;
		isConfirmation?: boolean;
		onClose: () => void;
		children?: import('svelte').Snippet<[{ cancel: () => void }]>;
	}

	let { open, title, description = '', closeLabel = 'Close modal', isDirty = false, isSubmitting = false, isConfirmation = false, onClose, children }: Props = $props();

	const instanceId = Math.random().toString(36).substring(2, 9);
	let showUnsavedConfirm = $state(false);

	$effect(() => {
		if (open) {
			modalRegistry.push(instanceId);
		} else {
			modalRegistry.remove(instanceId);
		}
		return () => {
			modalRegistry.remove(instanceId);
		};
	});

	function handleCloseAttempt() {
		if (isSubmitting) return;
		if (isDirty) {
			showUnsavedConfirm = true;
		} else {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;

		// Only the topmost/active modal should process ESC events
		if (e.key === 'Escape') {
			if (!modalRegistry.isTop(instanceId)) {
				e.stopPropagation();
				return;
			}
		}

		// Disable ESC and Enter completely inside confirmation modals
		if (isConfirmation) {
			if (e.key === 'Escape' || e.key === 'Enter') {
				e.preventDefault();
				e.stopPropagation();
			}
			return;
		}

		// Disable ESC and Enter completely when the internal warning dialog is active
		if (showUnsavedConfirm) {
			if (e.key === 'Escape' || e.key === 'Enter') {
				e.preventDefault();
				e.stopPropagation();
			}
			return;
		}

		// Normal ESC closes modal (subject to dirty warning)
		if (e.key === 'Escape') {
			handleCloseAttempt();
		}

		// Normal Enter key logic (prevents unintended form submissions)
		if (e.key === 'Enter') {
			const target = e.target as HTMLElement;
			if (target && target.tagName !== 'TEXTAREA' && target.tagName !== 'BUTTON' && target.tagName !== 'A') {
				e.preventDefault();
				e.stopPropagation();
			}
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		// Backdrop click-to-close is disabled globally
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div 
		class="fixed inset-0 z-50 flex items-center justify-center bg-[#262626]/70 px-4 py-6"
		onclick={handleBackdropClick}
	>
		<Card class="relative max-h-[90vh] w-full max-w-lg overflow-hidden flex flex-col py-0" onclick={(e) => e.stopPropagation()}>
			<CardHeader class="flex-col items-start gap-1 pl-6 pt-6 pr-12 flex-shrink-0">
				<CardTitle>{title}</CardTitle>
				{#if description}
					<CardDescription>{description}</CardDescription>
				{/if}
			</CardHeader>
			<Button 
				type="button" 
				variant="ghost" 
				size="icon-sm" 
				class="absolute right-4 top-4 text-muted-foreground hover:text-foreground z-10"
				aria-label={closeLabel} 
				onclick={handleCloseAttempt}
				disabled={isSubmitting}
			>
				<XIcon class="size-4" />
			</Button>
			<CardContent class="flex-1 overflow-hidden flex flex-col p-6 pt-0 min-h-0">
				{@render children?.({ cancel: handleCloseAttempt })}
			</CardContent>
		</Card>
	</div>
{/if}

{#if showUnsavedConfirm}
	<div class="fixed inset-0 z-60 flex items-center justify-center bg-[#262626]/70 px-4 py-6">
		<Card class="w-full max-w-sm animate-in fade-in zoom-in-95 duration-150 py-0">
			<CardHeader class="pt-6 pl-6 pr-6">
				<CardTitle>Cancel Changes</CardTitle>
				<CardDescription>Are you sure you want to cancel? All unsaved changes will be lost.</CardDescription>
			</CardHeader>
			<div class="flex justify-end gap-2 p-6 pt-0">
				<Button variant="outline" onclick={() => (showUnsavedConfirm = false)}>Keep Editing</Button>
				<Button class="bg-[#800020] dark:bg-[#9e1a35] text-white hover:bg-[#800020]/90 dark:hover:bg-[#9e1a35]/90 focus-visible:ring-[#800020]/50 dark:focus-visible:ring-[#9e1a35]/50 focus-visible:border-[#800020] dark:focus-visible:border-[#9e1a35]" onclick={() => {
					showUnsavedConfirm = false;
					onClose();
				}}>Discard Changes</Button>
			</div>
		</Card>
	</div>
{/if}
