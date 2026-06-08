<script lang="ts">
	import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import XIcon from '@lucide/svelte/icons/x';

	interface Props {
		open: boolean;
		title: string;
		description: string;
		confirmLabel?: string;
		isSubmitting?: boolean;
		isDestructive?: boolean;
		onCancel: () => void;
		onConfirm: () => void;
	}

	let {
		open,
		title,
		description,
		confirmLabel = 'Confirm',
		isSubmitting = false,
		isDestructive = true,
		onCancel,
		onConfirm
	}: Props = $props();
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-250 flex items-center justify-center bg-[rgba(15,11,10,0.4)] backdrop-blur-md px-4 py-6"
		onclick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
	>
		<div
			class="bg-card border border-border rounded-[14px] w-full max-w-[400px] shadow-xl flex flex-col overflow-hidden"
			role="dialog"
			aria-modal="true"
		>
			<div class="flex items-center justify-between px-5 py-[18px] border-b border-border">
				<div class="flex items-center gap-2.5">
					{#if isDestructive}
						<span class="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center shrink-0">
							<AlertTriangleIcon size={18} />
						</span>
					{/if}
					<h3 class="text-base font-bold text-foreground m-0 leading-[1.2]">
						{title}
					</h3>
				</div>
				<button
					onclick={onCancel}
					class="bg-transparent border-none cursor-pointer text-muted-foreground p-1 rounded-md flex items-center justify-center transition-colors duration-150 hover:bg-muted hover:text-foreground"
					aria-label="Close dialog"
					disabled={isSubmitting}
				>
					<XIcon size={16} />
				</button>
			</div>

			<div class="p-5">
				<p class="text-sm text-muted-foreground m-0 leading-normal">{description}</p>
			</div>

			<div class="flex justify-end gap-2.5 px-5 py-3.5 bg-muted border-t border-border">
				<button
					type="button"
					onclick={onCancel}
					class="px-4 py-2 rounded-lg border border-border bg-card text-[13px] font-semibold cursor-pointer text-foreground transition-colors duration-150 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={isSubmitting}
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={onConfirm}
					class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-white text-[13px] font-semibold cursor-pointer transition-colors duration-150 disabled:opacity-70 disabled:cursor-not-allowed {isDestructive ? 'bg-pieq-tertiary hover:bg-[#600018]' : 'bg-pieq-primary hover:bg-[#d4430c]'}"
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
