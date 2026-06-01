<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components';
	import { fade } from 'svelte/transition';

	interface Props {
		open: boolean;
		title: string;
		description?: string;
		closeLabel?: string;
		isDirty?: boolean;
		onClose: () => void;
		children?: import('svelte').Snippet;
	}

	let { open, title, description = '', closeLabel = 'Close modal', isDirty = false, onClose, children }: Props = $props();

	let showUnsavedConfirm = $state(false);

	function handleCloseAttempt() {
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
			>
				<XIcon class="size-4" />
			</Button>
			<CardContent>
				{@render children?.()}
			</CardContent>
		</Card>
	</div>
{/if}

{#if showUnsavedConfirm}
	<div class="fixed inset-0 z-60 flex items-center justify-center bg-[#262626]/70 px-4 py-6">
		<Card class="w-full max-w-sm">
			<CardHeader>
				<CardTitle>Unsaved Changes</CardTitle>
				<CardDescription>You have unsaved changes. Do you want to continue editing or close without saving?</CardDescription>
			</CardHeader>
			<div class="flex justify-end gap-2 p-6 pt-0">
				<Button variant="outline" onclick={() => (showUnsavedConfirm = false)}>Continue Editing</Button>
				<Button class="bg-[#8C3C3C] text-white hover:bg-[#8C3C3C]/90" onclick={() => {
					showUnsavedConfirm = false;
					onClose();
				}}>Close Without Saving</Button>
			</div>
		</Card>
	</div>
{/if}
