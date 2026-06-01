<script lang="ts">
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';
	import { toast } from '$lib/toast.svelte';
</script>

<div class="fixed top-5 right-5 z-9999 flex flex-col items-end gap-2.5 pointer-events-none">
	{#each toast.list as item (item.id)}
		<div
			animate:flip={{ duration: 200 }}
			in:fly={{ y: -16, opacity: 0, duration: 250 }}
			out:fly={{ x: 80, opacity: 0, duration: 150 }}
			class="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white dark:bg-zinc-900 px-4 py-3.5 shadow-[0_4px_24px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] min-w-[260px] max-w-sm"
			role="alert"
		>
			<div class="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-zinc-900 dark:bg-white">
				{#if item.type === 'error' || item.type === 'warning'}
					<span class="text-[11px] font-bold text-white dark:text-zinc-900 leading-none">!</span>
				{:else}
					<!-- Inline SVG avoids the global * { border-border } CSS conflict that breaks Lucide icons -->
					<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" class="dark:stroke-zinc-900">
						<polyline points="20 6 9 17 4 12" />
					</svg>
				{/if}
			</div>
			<span class="text-sm font-semibold text-zinc-900 dark:text-zinc-50 leading-snug">
				{item.message}
			</span>
		</div>
	{/each}
</div>
