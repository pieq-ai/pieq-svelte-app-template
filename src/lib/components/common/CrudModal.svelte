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
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div 
		class="fixed inset-0 z-100 flex items-center justify-center bg-[rgba(15,11,10,0.4)] backdrop-blur-md px-4 py-6"
		onclick={(e) => { if (e.target === e.currentTarget) showUnsavedConfirm = false; }}
	>
		<div
			class="bg-card border border-border/50 rounded-[24px] w-full max-w-[420px] shadow-2xl flex flex-col p-6 sm:p-7 md:p-8"
			role="dialog"
			aria-modal="true"
		>
			<h3 class="text-xl font-bold text-foreground m-0 leading-tight mb-2">
				Cancel Changes
			</h3>
			<p class="text-sm text-muted-foreground m-0 leading-relaxed mb-6">
				Are you sure you want to cancel? All unsaved changes will be lost.
			</p>
			<div class="flex justify-end gap-3">
				<button
					type="button"
					class="h-[38px] px-5 rounded-[12px] border border-[#e5e7eb] bg-card text-[14px] font-semibold cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
					onclick={() => {
						showUnsavedConfirm = false;
						onClose();
					}}
				>
					Cancel
				</button>
				<button
					type="button"
					class="h-[38px] px-5 rounded-[12px] border-none text-white text-[14px] font-semibold cursor-pointer transition-colors duration-150 bg-[#800020] hover:bg-[#600018]"
					onclick={() => (showUnsavedConfirm = false)}
				>
					Keep Editing
				</button>
			</div>
		</div>
	</div>
{/if}
