<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import XIcon from '@lucide/svelte/icons/x';
	import { Button, Alert, AlertDescription } from '$lib/components';

	let {
		isOpen = false,
		title = 'Master Form',
		isSubmitting = false,
		errorMessage = '',
		onclose,
		onsubmit,
		children
	}: {
		isOpen: boolean;
		title: string;
		isSubmitting?: boolean;
		errorMessage?: string;
		onclose: () => void;
		onsubmit: (e: SubmitEvent) => void | Promise<void>;
		children: Snippet;
	} = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- Backdrop -->
	<!-- eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -->
	<div
		transition:fade={{ duration: 150 }}
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[3px] transition-all"
		onclick={onclose}
	>
		<!-- Modal Content Box -->
		<!-- eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -->
		<div
			transition:scale={{ start: 0.96, duration: 150 }}
			class="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-background shadow-xl dark:border-slate-800"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex items-center border-b border-slate-100 dark:border-slate-800 px-6 py-4.5 bg-slate-50/50">
				<h3 class="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight pr-12">
					{title}
				</h3>
				<Button
					variant="ghost"
					size="icon-sm"
					class="absolute right-4 top-4 text-slate-400 hover:text-slate-600 rounded-full h-8 w-8 hover:bg-slate-100 transition-all duration-200 z-10 flex items-center justify-center"
					onclick={onclose}
					aria-label="Close modal"
				>
					<XIcon class="size-4" />
				</Button>
			</div>

			<!-- Form -->
			<form onsubmit={onsubmit} class="flex flex-col">
				<div class="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">
					{#if errorMessage}
						<Alert variant="destructive" class="border-destructive/30 bg-destructive/5 text-destructive">
							<AlertDescription class="font-medium">{errorMessage}</AlertDescription>
						</Alert>
					{/if}

					{@render children()}
				</div>

				<!-- Footer -->
				<div class="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50">
					<Button
						type="button"
						variant="outline"
						class="hover:bg-slate-100 border-slate-200"
						disabled={isSubmitting}
						onclick={onclose}
					>
						Cancel
					</Button>
					<Button type="submit" class="shadow-sm shadow-primary/10" disabled={isSubmitting}>
						{#if isSubmitting}
							<LoaderCircleIcon class="mr-1.5 size-4 animate-spin" />
							Saving...
						{:else}
							Save Changes
						{/if}
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
