<!-- src/lib/components/ToastContainer.svelte -->
<script lang="ts">
	import { toast } from '$lib/toast.svelte.js';
	import { flip } from 'svelte/animate';
	import { fade, fly } from 'svelte/transition';
	import XIcon from '@lucide/svelte/icons/x';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import InfoIcon from '@lucide/svelte/icons/info';
	import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
</script>

<div class="fixed bottom-6 right-6 z-300 flex flex-col gap-2.5 max-w-[380px] w-[calc(100vw-48px)] pointer-events-none" aria-live="polite">
	{#each toast.toasts as t (t.id)}
		<div
			class="flex items-center gap-3 px-4 py-3.5 bg-white border border-border rounded-xl shadow-md pointer-events-auto select-none relative overflow-hidden"
			transition:fly={{ y: 20, duration: 250 }}
			animate:flip={{ duration: 200 }}
		>
			<span class="flex items-center justify-center shrink-0">
				{#if t.type === 'success'}
					<div class="bg-[#18181b] text-white rounded-full w-5 h-5 flex items-center justify-center shrink-0">
						<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
					</div>
				{:else}
					<div class="bg-pieq-tertiary text-white rounded-full w-5 h-5 flex items-center justify-center shrink-0">
						{#if t.type === 'error'}
							<AlertCircleIcon size={12} />
						{:else if t.type === 'warning'}
							<AlertTriangleIcon size={12} />
						{:else}
							<InfoIcon size={12} />
						{/if}
					</div>
				{/if}
			</span>

			<p class="text-[13px] font-semibold text-[#18181b] m-0 leading-[1.4] flex-1 pr-3">{t.message}</p>

			<button
				onclick={() => toast.dismiss(t.id)}
				class="bg-transparent border-none cursor-pointer text-muted-foreground p-0.5 rounded flex items-center justify-center transition-colors duration-150 hover:bg-muted hover:text-foreground"
				aria-label="Dismiss toast"
			>
				<XIcon size={14} />
			</button>
		</div>
	{/each}
</div>
