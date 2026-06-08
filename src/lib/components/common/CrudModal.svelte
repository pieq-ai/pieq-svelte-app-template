<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components';


	interface Props {
		open: boolean;
		title: string;
		description?: string;
		closeLabel?: string;
		isDirty?: boolean;
		isSubmitting?: boolean;
		onClose: () => void;
		children?: import('svelte').Snippet<[{ cancel: () => void }]>;
	}

	let { open, title, description = '', closeLabel = 'Close modal', isDirty = false, isSubmitting = false, onClose, children }: Props = $props();

	let showUnsavedConfirm = $state(false);

	function handleCloseAttempt() {
		if (isSubmitting) return;
		if (isDirty) {
			showUnsavedConfirm = true;
		} else {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			if (showUnsavedConfirm) {
				showUnsavedConfirm = false;
			} else {
				handleCloseAttempt();
			}
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleCloseAttempt();
		}
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
		<Card class="relative max-h-[90vh] w-full max-w-lg overflow-y-auto" onclick={(e) => e.stopPropagation()}>
			<CardHeader class="flex-col items-start gap-1 pr-12">
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
			<CardContent>
				{@render children?.({ cancel: handleCloseAttempt })}
			</CardContent>
		</Card>
	</div>
{/if}

{#if showUnsavedConfirm}
	<div class="fixed inset-0 z-60 flex items-center justify-center bg-[#262626]/70 px-4 py-6">
		<Card class="w-full max-w-sm">
			<CardHeader>
				<CardTitle>Unsaved Changes</CardTitle>
				<CardDescription>You have unsaved changes. Are you sure you want to close this form?</CardDescription>
			</CardHeader>
			<div class="flex justify-end gap-2 p-6 pt-0">
				<Button variant="outline" onclick={() => (showUnsavedConfirm = false)}>Continue Editing</Button>
				<Button class="bg-danger text-danger-foreground hover:bg-danger/90 focus-visible:ring-danger/50 focus-visible:border-danger" onclick={() => {
					showUnsavedConfirm = false;
					onClose();
				}}>Discard Changes</Button>
			</div>
		</Card>
	</div>
{/if}
